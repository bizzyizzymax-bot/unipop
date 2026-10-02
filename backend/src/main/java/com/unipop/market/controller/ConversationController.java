package com.unipop.market.controller;

import com.unipop.market.dto.MessagingDtos.*;
import com.unipop.market.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Inbox - students arrange in-person exchanges over messages. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<List<ConversationDto>> listConversations() {
        return ResponseEntity.ok(conversationService.listConversations());
    }

    @PostMapping
    public ResponseEntity<ConversationDto> startConversation(@Valid @RequestBody StartConversationRequest request) {
        return new ResponseEntity<>(conversationService.startConversation(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.getMessages(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDto> sendMessage(@PathVariable Long id,
                                                  @Valid @RequestBody SendMessageRequest request) {
        return new ResponseEntity<>(conversationService.sendMessage(id, request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        conversationService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    /** Has the caller sent at least one message to this student? (review gate) */
    @GetMapping("/contacted/{userId}")
    public ResponseEntity<Map<String, Boolean>> hasMessaged(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("contacted", conversationService.hasMessaged(userId)));
    }
}