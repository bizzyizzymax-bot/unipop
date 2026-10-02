package com.unipop.market.service;

import com.unipop.market.dto.ProductResponseDto;
import com.unipop.market.entity.SavedListing;
import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.ProductRepo;
import com.unipop.market.repository.SavedListingRepo;
import com.unipop.market.repository.UserRepo;
import com.unipop.market.security.AuthUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** Saved ("hearted") listings for the logged in student. */
@Service
@RequiredArgsConstructor
public class SavedListingService {

    private final SavedListingRepo savedListingRepo;
    private final ProductRepo productRepo;
    private final UserRepo userRepo;
    private final ProductService productService;

    public List<ProductResponseDto> getSaved() {
        User me = AuthUtils.currentUser(userRepo);
        Set<Long> savedIds = idsOf(me);

        return savedListingRepo.findByUserIdOrderByCreatedAtDesc(me.getId()).stream()
                .map(s -> toDto(s, me, savedIds))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional
    public void save(Long productId) {
        User me = AuthUtils.currentUser(userRepo);
        var product = productRepo.findById(productId)
                .orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!Objects.equals(product.getSeller().getSchoolDomain(), me.getSchoolDomain())) {
            throw ApiException.notFound("Listing not found.");
        }
        if (savedListingRepo.existsByUserIdAndProductId(me.getId(), productId)) return;
        savedListingRepo.save(SavedListing.builder().user(me).product(product).build());
    }

    @Transactional
    public void unsave(Long productId) {
        User me = AuthUtils.currentUser(userRepo);
        savedListingRepo.deleteByUserIdAndProductId(me.getId(), productId);
    }

    private Set<Long> idsOf(User me) {
        return savedListingRepo.findByUserIdOrderByCreatedAtDesc(me.getId()).stream()
                .map(s -> s.getProduct().getId())
                .collect(Collectors.toSet());
    }

    private ProductResponseDto toDto(SavedListing saved, User me, Set<Long> savedIds) {
        try {
            return productService.getProductById(saved.getProduct().getId());
        } catch (ApiException e) {
            return null; // listing from another campus / deleted - skip
        }
    }
}