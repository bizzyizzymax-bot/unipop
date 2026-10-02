package com.unipop.market.service;

import com.unipop.market.dto.UserRequestDto;
import com.unipop.market.entity.Conversation;
import com.unipop.market.entity.Message;
import com.unipop.market.entity.Product;
import com.unipop.market.entity.Review;
import com.unipop.market.entity.SavedListing;
import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.ConversationRepo;
import com.unipop.market.repository.MessageRepo;
import com.unipop.market.repository.ProductRepo;
import com.unipop.market.repository.ReviewRepo;
import com.unipop.market.repository.SavedListingRepo;
import com.unipop.market.repository.UserRepo;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    /** Username, email and password may only be edited once every 14 days. */
    public static final Duration CHANGE_LOCK = Duration.ofDays(14);

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneId.systemDefault());

    private final UserRepo userRepo;
    private final ProductRepo productRepo;
    private final ReviewRepo reviewRepo;
    private final SavedListingRepo savedListingRepo;
    private final ConversationRepo conversationRepo;
    private final MessageRepo messageRepo;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public UserRequestDto getUserById(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));
        return mapToResponseDto(user);
    }

    private UserRequestDto mapToResponseDto(User user) {
        return new UserRequestDto(
                user.getId(),
                user.getFirstName(),
                user.getEmail(),
                user.getUsername(),
                user.getDob(),
                user.getSchoolDomain(),
                user.getLastEmailUsernameChange(),
                user.getLastPasswordChange()
        );
    }

    /**
     * Permanently deletes the account and everything hanging off it so no
     * foreign keys are left dangling:
     * reviews (written and received), saved listings (own and other students'
     * saves of this user's listings), conversations + their messages, and
     * the user's listings.
     *
     * Each stage is flushed to the database before the next one starts so the
     * DELETE statements run children-before-parents in a deterministic order.
     * Without the flushes Hibernate submits every delete in one batch at commit
     * time, in an order it does not guarantee, which trips the FK constraints.
     */
    @Transactional
    public void deleteUserById(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));

        // 1. Reviews where this user is the buyer or the seller.
        List<Review> buyerReviews = reviewRepo.findReviewsByBuyerId(id);
        if (!buyerReviews.isEmpty()) reviewRepo.deleteAll(buyerReviews);

        List<Review> sellerReviews = reviewRepo.findReviewsBySellerId(id);
        if (!sellerReviews.isEmpty()) reviewRepo.deleteAll(sellerReviews);
        entityManager.flush();

        // 2. Listings this user saved (FK: saved_listings.user_id).
        List<SavedListing> saved = savedListingRepo.findByUserIdOrderByCreatedAtDesc(id);
        if (!saved.isEmpty()) savedListingRepo.deleteAll(saved);
        entityManager.flush();

        // 3. Conversations involving this user, or about their listings:
        //    messages first (FK: messages.conversation_id / sender_id),
        //    then the conversation rows themselves.
        List<Conversation> conversations = conversationRepo.findAllTouchingUser(id);
        if (!conversations.isEmpty()) {
            List<Message> allMessages = conversations.stream()
                    .flatMap(conversation ->
                            messageRepo.findByConversationIdOrderBySentAtAsc(conversation.getId()).stream())
                    .toList();
            if (!allMessages.isEmpty()) messageRepo.deleteAll(allMessages);
            entityManager.flush();

            conversationRepo.deleteAll(conversations);
            entityManager.flush();
        }

        // 4. The user's listings: other students' saves of them first
        //    (FK: saved_listings.product_id), then the products.
        List<Product> products = productRepo.findProductsBySellerId(id);
        if (!products.isEmpty()) {
            List<Long> productIds = products.stream().map(Product::getId).toList();
            List<SavedListing> savedOfProducts = savedListingRepo.findByProductIdIn(productIds);
            if (!savedOfProducts.isEmpty()) savedListingRepo.deleteAll(savedOfProducts);
            entityManager.flush();

            productRepo.deleteAll(products);
            entityManager.flush();
        }

        // 5. Every referencing row is gone now, so the user row can go.
        userRepo.delete(user);
    }

    @Transactional
    public void updatePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));

        if (user.getLastPasswordChange() != null) {
            Instant next = user.getLastPasswordChange().plus(CHANGE_LOCK);
            if (next.isAfter(Instant.now())) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Password can only be changed once every 14 days. Next change available "
                                + DATE.format(next) + ".");
            }
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw ApiException.badRequest("New password must be at least 8 characters.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLastPasswordChange(Instant.now());
        userRepo.save(user);
    }

    /**
     * Updates profile details. The userID is never accepted or changed here.
     * Username and email are locked for 14 days after any change to either.
     */
    @Transactional
    public UserRequestDto updateUser(Long id, UserRequestDto request) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));

        boolean emailChanging = request.email() != null && !request.email().equalsIgnoreCase(user.getEmail());
        boolean usernameChanging = request.username() != null && !request.username().equals(user.getUsername());

        if (emailChanging || usernameChanging) {
            if (user.getLastEmailUsernameChange() != null) {
                Instant next = user.getLastEmailUsernameChange().plus(CHANGE_LOCK);
                if (next.isAfter(Instant.now())) {
                    throw new ApiException(HttpStatus.FORBIDDEN,
                            "Username and email can only be changed once every 14 days. Next change available "
                                    + DATE.format(next) + ".");
                }
            }
            if (emailChanging && !isValidEduEmail(request.email())) {
                throw ApiException.badRequest("Only university (.edu) email addresses are allowed.");
            }
            if (emailChanging && userRepo.findByEmail(request.email().toLowerCase()).isPresent()) {
                throw ApiException.conflict("That email is already in use.");
            }
            if (usernameChanging && request.username().length() < 3) {
                throw ApiException.badRequest("Username must be at least 3 characters.");
            }
            if (usernameChanging && userRepo.findByUsername(request.username()).isPresent()) {
                throw ApiException.conflict("That username is already taken.");
            }
        }

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (emailChanging) {
            user.setEmail(request.email().toLowerCase());
            user.setSchoolDomain(User.domainOf(user.getEmail()));
        }
        if (usernameChanging) {
            user.setUsername(request.username());
        }
        if (emailChanging || usernameChanging) {
            user.setLastEmailUsernameChange(Instant.now());
        }

        userRepo.save(user);
        return mapToResponseDto(user);
    }

    public static boolean isValidEduEmail(String email) {
        return email != null
                && email.trim().toLowerCase().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.edu$");
    }
}