package com.unipop.market.service;

import com.unipop.market.dto.ReviewRequestDto;
import com.unipop.market.dto.ReviewResponseDto;
import com.unipop.market.entity.Review;
import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.MessageRepo;
import com.unipop.market.repository.ReviewRepo;
import com.unipop.market.repository.UserRepo;
import com.unipop.market.security.AuthUtils;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepo reviewRepo;
    private final UserRepo userRepo;
    private final MessageRepo messageRepo;
    private final EntityManager entityManager;

    /**
     * The reviewer is always the logged-in student (never taken from the request
     * body), so you can only review someone else - never impersonate a buyer.
     *
     * Rules:
     *  - you must have messaged the student first,
     *  - only one review per student pair,
     *  - after you delete your review you may write a new one (there is then
     *    no past review left from you).
     */
    @Transactional
    public ReviewResponseDto addReview(@Valid ReviewRequestDto request) {
        if (request.sellerId() == null) {
            throw ApiException.badRequest("sellerId is required.");
        }
        User buyer = AuthUtils.currentUser(userRepo);
        User seller = userRepo.findById(request.sellerId())
                .orElseThrow(() -> ApiException.notFound("Student not found."));

        if (Objects.equals(buyer.getId(), seller.getId())) {
            throw ApiException.badRequest("You cannot review yourself.");
        }
        if (!Objects.equals(buyer.getSchoolDomain(), seller.getSchoolDomain())) {
            throw ApiException.forbidden("You can only review students at your own school.");
        }
        if (messageRepo.countMessagesFrom(buyer.getId(), seller.getId()) == 0) {
            throw ApiException.forbidden(
                    "You can only review a student after you've messaged them.");
        }
        if (reviewRepo.existsByBuyerIdAndSellerId(buyer.getId(), seller.getId())) {
            throw ApiException.conflict(
                    "You have already reviewed this student. Delete your review to write a new one.");
        }

        Review review = Review.builder()
                .rating(request.rating())
                .comment(request.comment() == null ? null : request.comment().trim())
                .seller(seller)
                .buyer(buyer)
                .build();

        Review newReview = reviewRepo.save(review);

        return mapToView(newReview);
    }

    /**
     * Students may only delete reviews they themselves wrote. Once deleted there
     * is no past review left from this student, so they may write a new one
     * (as long as they have messaged the other student).
     */
    @Transactional
    public void deleteReview(Long reviewId) {
        if (reviewId == null) {
            throw ApiException.badRequest("Review id is required.");
        }
        User me = AuthUtils.currentUser(userRepo);
        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> ApiException.notFound("Review not found."));
        if (!Objects.equals(review.getBuyer().getId(), me.getId())) {
            throw ApiException.forbidden("You can only delete your own reviews.");
        }
        reviewRepo.delete(review);
        // Execute the DELETE now so a follow-up "add review" in the same
        // session no longer sees the old review.
        entityManager.flush();
    }

    public List<ReviewResponseDto> getReviewsBySellerId(Long id) {
        List<Review> reviews = reviewRepo.findReviewsBySellerId(id);
        return reviews.stream().map(this::mapToView).toList();
    }

    private ReviewResponseDto mapToView(Review review) {
        return new ReviewResponseDto(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getSeller().getId(),
                review.getBuyer().getId(),
                review.getBuyer().getUsername(),
                review.getBuyer().getFirstName());
    }

}
