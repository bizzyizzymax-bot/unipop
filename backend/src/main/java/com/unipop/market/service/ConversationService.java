package com.unipop.market.service;

import com.unipop.market.dto.MessagingDtos.*;
import com.unipop.market.entity.Conversation;
import com.unipop.market.entity.Message;
import com.unipop.market.entity.Product;
import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.ConversationRepo;
import com.unipop.market.repository.MessageRepo;
import com.unipop.market.repository.ProductRepo;
import com.unipop.market.repository.UserRepo;
import com.unipop.market.security.AuthUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Inbox / messaging. Students never check out in the app - they message the
 * seller and arrange an in-person exchange on campus. Conversations are only
 * possible between students at the same school.
 */
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepo conversationRepo;
    private final MessageRepo messageRepo;
    private final UserRepo userRepo;
    private final ProductRepo productRepo;

    public List<ConversationDto> listConversations() {
        User me = AuthUtils.currentUser(userRepo);
        return conversationRepo.findForUser(me.getId()).stream()
                .map(c -> toConversationDto(c, me))
                .toList();
    }

    /**
     * True once the logged-in student has sent at least one message to
     * `otherUserId` - reviews are only allowed after students have messaged.
     */
    public boolean hasMessaged(Long otherUserId) {
        if (otherUserId == null) {
            throw ApiException.badRequest("userId is required.");
        }
        User me = AuthUtils.currentUser(userRepo);
        if (Objects.equals(me.getId(), otherUserId)) {
            return false;
        }
        return messageRepo.countMessagesFrom(me.getId(), otherUserId) > 0;
    }

    @Transactional
    public ConversationDto startConversation(StartConversationRequest request) {
        User me = AuthUtils.currentUser(userRepo);
        User recipient = userRepo.findById(request.recipientId())
                .orElseThrow(() -> ApiException.notFound("Student not found."));

        if (Objects.equals(recipient.getId(), me.getId())) {
            throw ApiException.badRequest("You cannot message yourself.");
        }
        if (!Objects.equals(recipient.getSchoolDomain(), me.getSchoolDomain())) {
            throw ApiException.forbidden("You can only message students at your own school ("
                    + me.getSchoolDomain() + ").");
        }

        Product product = null;
        if (request.productId() != null) {
            product = productRepo.findById(request.productId())
                    .orElseThrow(() -> ApiException.notFound("Listing not found."));
            if (!Objects.equals(product.getSeller().getId(), recipient.getId())) {
                throw ApiException.badRequest("That listing does not belong to this student.");
            }
        }

        Long productId = request.productId();
        Conversation conversation = conversationRepo
                .findBetween(me.getId(), recipient.getId(), productId)
                .orElse(null);
        if (conversation == null) {
            conversation = conversationRepo.save(Conversation.builder()
                    .user1(me)
                    .user2(recipient)
                    .product(product)
                    .build());
        }

        return toConversationDto(conversation, me);
    }

    public List<MessageDto> getMessages(Long conversationId) {
        User me = AuthUtils.currentUser(userRepo);
        Conversation conversation = memberConversation(conversationId, me);
        return messageRepo.findByConversationIdOrderBySentAtAsc(conversation.getId()).stream()
                .map(m -> toMessageDto(m, conversation))
                .toList();
    }

    @Transactional
    public MessageDto sendMessage(Long conversationId, SendMessageRequest request) {
        User me = AuthUtils.currentUser(userRepo);
        Conversation conversation = memberConversation(conversationId, me);

        Message message = messageRepo.save(Message.builder()
                .conversation(conversation)
                .sender(me)
                .content(request.content().trim())
                .build());

        conversation.setUpdatedAt(Instant.now());
        conversationRepo.save(conversation);

        return toMessageDto(message, conversation);
    }

    @Transactional
    public void markRead(Long conversationId) {
        User me = AuthUtils.currentUser(userRepo);
        Conversation conversation = memberConversation(conversationId, me);
        messageRepo.flush();
        messageRepo.markReadFor(conversation.getId(), me.getId());
    }

    private Conversation memberConversation(Long conversationId, User me) {
        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found."));
        boolean member = Objects.equals(conversation.getUser1().getId(), me.getId())
                || Objects.equals(conversation.getUser2().getId(), me.getId());
        if (!member) {
            throw ApiException.forbidden("You are not part of this conversation.");
        }
        return conversation;
    }

    private ConversationDto toConversationDto(Conversation c, User me) {
        User other = Objects.equals(c.getUser1().getId(), me.getId()) ? c.getUser2() : c.getUser1();
        Message last = messageRepo.findTopByConversationIdOrderBySentAtDesc(c.getId());
        long unread = messageRepo.countUnreadFor(c.getId(), me.getId());

        ProductSummaryDto productSummary = c.getProduct() == null ? null : new ProductSummaryDto(
                c.getProduct().getId(),
                c.getProduct().getTitle(),
                c.getProduct().getPrice(),
                c.getProduct().getCondition(),
                c.getProduct().getImages()
        );

        return new ConversationDto(
                c.getId(),
                new UserSummaryDto(other.getId(), other.getUsername(), other.getFirstName()),
                productSummary,
                last == null ? null : last.getContent(),
                last == null ? c.getCreatedAt() : last.getSentAt(),
                unread
        );
    }

    private MessageDto toMessageDto(Message m, Conversation c) {
        return new MessageDto(
                m.getId(),
                c.getId(),
                m.getSender().getId(),
                m.getSender().getUsername(),
                m.getContent(),
                m.getSentAt(),
                Boolean.TRUE.equals(m.getReadFlag())
        );
    }
}