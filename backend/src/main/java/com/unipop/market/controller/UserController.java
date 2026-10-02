package com.unipop.market.controller;

import com.unipop.market.dto.UserRequestDto;
import com.unipop.market.dto.securityDtos.UpdatePasswordDto;
import com.unipop.market.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.unipop.market.exception.ApiException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserRequestDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable Long id,
                                               @Valid @RequestBody UpdatePasswordDto request) {
        ensureSelf(id);
        userService.updatePassword(id, request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates first name, username and/or email.
     * The id in the path is the permanent userID and can never be changed.
     * Username/email edits are limited to once every 14 days (enforced in the service).
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserRequestDto> updateUser(@PathVariable Long id,
                                                     @Valid @RequestBody UserRequestDto request) {
        ensureSelf(id);
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable Long id) {
        ensureSelf(id);
        userService.deleteUserById(id);
        return ResponseEntity.noContent().build();
    }

    private void ensureSelf(Long id) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        UserRequestDto existing = userService.getUserById(id);
        if (!currentEmail.equals(existing.email())) {
            throw ApiException.forbidden("You can only modify your own account.");
        }
    }
}