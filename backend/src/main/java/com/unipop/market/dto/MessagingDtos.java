package com.unipop.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** DTO records for the inbox / messaging feature. */
public final class MessagingDtos {

    private MessagingDtos() {}

    /** Lightweight user summary shown in the inbox. */
    public record UserSummaryDto(Long id, String username, String firstName) {}

    /** Lightweight listing summary pinned to a conversation. */
    public record ProductSummaryDto(Long id, String title, Double price, String condition, List<String> images) {}

    public record ConversationDto(
            Long id,
            UserSummaryDto otherUser,
            ProductSummaryDto product,
            String lastMessage,
            Instant lastMessageAt,
            long unreadCount
    ) {}

    public record MessageDto(
            Long id,
            Long conversationId,
            Long senderId,
            String senderUsername,
            String content,
            Instant sentAt,
            boolean readFlag
    ) {}

    public record StartConversationRequest(
            @NotNull(message = "recipientId is required") Long recipientId,
            Long productId
    ) {}

    public record SendMessageRequest(
            @NotBlank(message = "Message cannot be empty")
            @Size(max = 2000)
            String content
    ) {}
}