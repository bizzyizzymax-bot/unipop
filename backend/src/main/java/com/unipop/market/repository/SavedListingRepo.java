package com.unipop.market.repository;

import com.unipop.market.entity.SavedListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedListingRepo extends JpaRepository<SavedListing, Long> {

    List<SavedListing> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<SavedListing> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    /** Saves pointing at these listings (other students may have saved them). */
    List<SavedListing> findByProductIdIn(List<Long> productIds);
}
