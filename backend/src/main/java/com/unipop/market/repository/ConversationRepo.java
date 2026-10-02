package com.unipop.market.repository;

import com.unipop.market.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepo extends JpaRepository<Conversation, Long> {

    @Query("""
            select c from Conversation c
            where (c.user1.id = :userId or c.user2.id = :userId)
            order by c.updatedAt desc
            """)
    List<Conversation> findForUser(@Param("userId") Long userId);

    @Query("""
            select c from Conversation c
            where ((c.user1.id = :a and c.user2.id = :b) or (c.user1.id = :b and c.user2.id = :a))
              and (:productId is null or c.product.id = :productId)
            """)
    Optional<Conversation> findBetween(@Param("a") Long a, @Param("b") Long b, @Param("productId") Long productId);

    /** Every conversation about a given listing (listing deletion). */
    List<Conversation> findByProductId(Long productId);

    /** Every conversation involving this user, or about one of their listings (account deletion). */
    @Query("""
            select c from Conversation c
            where c.user1.id = :userId
               or c.user2.id = :userId
               or c.product.id in (select p.id from Product p where p.seller.id = :userId)
            """)
    List<Conversation> findAllTouchingUser(@Param("userId") Long userId);
}
