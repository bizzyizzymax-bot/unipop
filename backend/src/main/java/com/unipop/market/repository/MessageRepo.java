package com.unipop.market.repository;

import com.unipop.market.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepo extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    Message findTopByConversationIdOrderBySentAtDesc(Long conversationId);

    /** Has `senderId` sent at least one message to `otherId`? (review gate) */
    @Query("""
            select count(m) from Message m
            where m.sender.id = :senderId
              and (m.conversation.user1.id = :otherId or m.conversation.user2.id = :otherId)
            """)
    long countMessagesFrom(@Param("senderId") Long senderId, @Param("otherId") Long otherId);

    /** Unread messages in a conversation for a given reader (excludes their own). */
    @Query("""
            select count(m) from Message m
            where m.conversation.id = :conversationId
              and m.readFlag = false
              and m.sender.id <> :userId
            """)
    long countUnreadFor(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("update Message m set m.readFlag = true where m.conversation.id = :conversationId and m.sender.id <> :userId")
    void markReadFor(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}