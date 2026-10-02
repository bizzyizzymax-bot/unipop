package com.unipop.market.service;

import com.unipop.market.dto.CategoryCatalog;
import com.unipop.market.dto.ProductRequestDto;
import com.unipop.market.dto.ProductResponseDto;
import com.unipop.market.dto.SellerSummaryDto;
import com.unipop.market.entity.Conversation;
import com.unipop.market.entity.Product;
import com.unipop.market.entity.SavedListing;
import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.ConversationRepo;
import com.unipop.market.repository.ProductRepo;
import com.unipop.market.repository.SavedListingRepo;
import com.unipop.market.repository.UserRepo;
import com.unipop.market.security.AuthUtils;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepo productRepo;
    private final UserRepo userRepo;
    private final SavedListingRepo savedListingRepo;
    private final ConversationRepo conversationRepo;
    private final EntityManager entityManager;

    public record ProductFilters(
            String category, String subcategory, String gender, String condition,
            String size, String search, Double minPrice, Double maxPrice, Long sellerId
    ) {}

    /**
     * Every query is automatically scoped to the campus of the logged in student:
     * a @charlotte.edu student only ever sees listings from other @charlotte.edu students.
     */
    public List<ProductResponseDto> getProducts(ProductFilters filters) {
        User viewer = AuthUtils.currentUser(userRepo);
        String domain = viewer.getSchoolDomain();

        Specification<Product> spec = sameCampus(domain);

        // Sold listings are hidden everywhere except your own profile,
        // so buyers only ever browse what is actually still available.
        boolean browsingOwnListings = filters.sellerId() != null
                && Objects.equals(filters.sellerId(), viewer.getId());
        if (!browsingOwnListings) {
            spec = spec.and(equalTo("status", Product.STATUS_ACTIVE));
        }

        if (notBlank(filters.category())) spec = spec.and(equalTo("category", filters.category()));
        if (notBlank(filters.subcategory())) spec = spec.and(equalTo("subcategory", filters.subcategory()));
        if (notBlank(filters.gender())) spec = spec.and(equalTo("gender", filters.gender()));
        if (notBlank(filters.condition())) spec = spec.and(equalTo("condition", filters.condition().toUpperCase()));
        if (notBlank(filters.size())) spec = spec.and(equalTo("size", filters.size()));
        if (filters.sellerId() != null) spec = spec.and(equalToRootId("seller", filters.sellerId()));
        if (filters.minPrice() != null) spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("price"), filters.minPrice()));
        if (filters.maxPrice() != null) spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("price"), filters.maxPrice()));
        if (notBlank(filters.search())) {
            String like = "%" + filters.search().trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("description")), like),
                    cb.like(cb.lower(root.get("category")), like)));
        }

        List<Product> products = productRepo.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        Set<Long> savedIds = savedIdsOf(viewer);

        return products.stream()
                .map(p -> mapToDto(p, savedIds, viewer))
                .toList();
    }

    public ProductResponseDto getProductById(Long id) {
        User viewer = AuthUtils.currentUser(userRepo);
        Product product = productRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!Objects.equals(product.getSeller().getSchoolDomain(), viewer.getSchoolDomain())) {
            // Campus scoping: listings from other schools are invisible.
            throw ApiException.notFound("Listing not found.");
        }
        return mapToDto(product, savedIdsOf(viewer), viewer);
    }

    public ProductResponseDto addProduct(ProductRequestDto request) {
        User seller = AuthUtils.currentUser(userRepo);
        validate(request);

        Product product = Product.builder()
                .title(request.title().trim())
                .description(request.description())
                .price(request.price())
                .category(normalizeCategory(request.category()))
                .subcategory(emptyToNull(request.subcategory()))
                .gender(emptyToNull(request.gender()))
                .size(emptyToNull(request.size()))
                .condition(request.condition().toUpperCase())
                .status(Product.STATUS_ACTIVE)
                .images(request.images() == null ? List.of() : request.images())
                .seller(seller)
                .build();

        Product saved = productRepo.save(product);
        return mapToDto(saved, Set.of(), seller);
    }

    public ProductResponseDto updateProduct(Long id, ProductRequestDto request) {
        User viewer = AuthUtils.currentUser(userRepo);
        Product product = ownedProduct(id, viewer);
        validate(request);

        product.setTitle(request.title().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCategory(normalizeCategory(request.category()));
        product.setSubcategory(emptyToNull(request.subcategory()));
        product.setGender(emptyToNull(request.gender()));
        product.setSize(emptyToNull(request.size()));
        product.setCondition(request.condition().toUpperCase());
        if (request.status() != null && !request.status().isBlank()) {
            String status = request.status().toUpperCase();
            if (!Product.STATUS_ACTIVE.equals(status) && !Product.STATUS_SOLD.equals(status)) {
                throw ApiException.badRequest("Status must be ACTIVE or SOLD.");
            }
            product.setStatus(status);
        }
        if (request.images() != null) product.setImages(request.images());

        Product saved = productRepo.save(product);
        return mapToDto(saved, savedIdsOf(viewer), viewer);
    }

    /**
     * Deletes a listing without ever tripping the conversations foreign key:
     * conversations about the listing are kept (the students keep their chat
     * history) and simply detached by setting product_id to null, students'
     * saves of the listing are removed, and only then is the listing deleted.
     * Each stage is flushed so the DELETE/UPDATE statements reach the database
     * children-before-parents.
     */
    @Transactional
    public void deleteProduct(Long id) {
        User viewer = AuthUtils.currentUser(userRepo);
        Product product = ownedProduct(id, viewer);

        // 1. Conversations about this listing: keep the chat, drop the link
        //    (FK: conversations.product_id becomes NULL - no row is deleted).
        List<Conversation> conversations = conversationRepo.findByProductId(product.getId());
        for (Conversation conversation : conversations) {
            conversation.setProduct(null);
        }
        if (!conversations.isEmpty()) {
            conversationRepo.saveAll(conversations);
            entityManager.flush();
        }

        // 2. Saves pointing at this listing (FK: saved_listings.product_id).
        List<SavedListing> saves = savedListingRepo.findByProductIdIn(List.of(product.getId()));
        if (!saves.isEmpty()) savedListingRepo.deleteAll(saves);
        entityManager.flush();

        // 3. The listing itself (product_images rows go with it).
        productRepo.delete(product);
    }

    private Product ownedProduct(Long id, User viewer) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!Objects.equals(product.getSeller().getId(), viewer.getId())) {
            throw ApiException.forbidden("You can only manage your own listings.");
        }
        return product;
    }

    private void validate(ProductRequestDto request) {
        if (!CategoryCatalog.isValidCategory(request.category())) {
            throw ApiException.badRequest("Unknown category: " + request.category());
        }
        if (!CategoryCatalog.isValidCondition(request.condition())) {
            throw ApiException.badRequest("Condition must be NEW, GOOD or POOR.");
        }
        if (request.images() != null && request.images().size() > 10) {
            throw ApiException.badRequest("A listing can have at most 10 photos.");
        }
    }

    private Set<Long> savedIdsOf(User viewer) {
        return savedListingRepo.findByUserIdOrderByCreatedAtDesc(viewer.getId()).stream()
                .map(s -> s.getProduct().getId())
                .collect(Collectors.toSet());
    }

    private Specification<Product> sameCampus(String domain) {
        return (root, query, cb) -> cb.equal(root.get("seller").get("schoolDomain"), domain);
    }

    private Specification<Product> equalTo(String field, String value) {
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private Specification<Product> equalToRootId(String field, Long value) {
        return (root, query, cb) -> cb.equal(root.get(field).get("id"), value);
    }

    private ProductResponseDto mapToDto(Product product, Set<Long> savedIds, User viewer) {
        User seller = product.getSeller();
        SellerSummaryDto sellerDto = new SellerSummaryDto(
                seller.getFirstName(), seller.getUsername(), seller.getEmail(), seller.getId());

        return new ProductResponseDto(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory(),
                product.getSubcategory(),
                product.getGender(),
                product.getSize(),
                product.getCondition(),
                product.getStatus(),
                product.getImages(),
                product.getCreatedAt(),
                sellerDto,
                seller.getSchoolDomain(),
                savedIds.contains(product.getId()),
                viewer != null && Objects.equals(seller.getId(), viewer.getId())
        );
    }

    private String normalizeCategory(String category) {
        CategoryDtoMatch match = CategoryCatalog.CATEGORIES.stream()
                .filter(c -> c.name().equalsIgnoreCase(category))
                .findFirst()
                .map(c -> new CategoryDtoMatch(c.name()))
                .orElseThrow(() -> ApiException.badRequest("Unknown category: " + category));
        return match.name();
    }

    private record CategoryDtoMatch(String name) {}

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}