package com.unipop.market.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

/**
 * User payload. The id (userID) is permanent and is never accepted back from
 * the client - username, email and password may only be changed once every 14 days.
 */
public record UserRequestDto(
        Long id,
        String firstName,

        @NotBlank
        @Email
        @Pattern(regexp = ".*\\.edu$", flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Only university (.edu) email addresses are allowed")
        String email,

        @NotBlank
        @Size(min = 3, max = 30)
        String username,

        LocalDate dob,
        String schoolDomain,
        Instant lastEmailUsernameChange,
        Instant lastPasswordChange
) {}