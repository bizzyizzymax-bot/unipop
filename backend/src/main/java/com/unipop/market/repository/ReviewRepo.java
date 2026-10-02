package com.unipop.market.repository;

import com.unipop.market.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepo extends JpaRepository<Review, Long> {

    List<Review> findReviewsBySellerId(Long id);

    List<Review> findReviewsByBuyerId(Long id);

    /** Has this buyer already reviewed this seller? (one review per student pair) */
    boolean existsByBuyerIdAndSellerId(Long buyerId, Long sellerId);
}
