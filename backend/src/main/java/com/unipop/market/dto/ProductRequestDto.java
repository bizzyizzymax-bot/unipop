package com.unipop.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Payload used to create or update a listing.
 * Sellers are derived from the authenticated user - there is no in-app checkout,
 * buyers and sellers arrange an in-person exchange over messages.
 */
public record ProductRequestDto(
        @NotBlank(message = "Title is required")
        @Size(max = 120)
        String title,

        @Size(max = 2000)
        String description,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be greater than 0")
        Double price,

        @NotBlank(message = "Category is required")
        String category,

        String subcategory,

        String gender,

        String size,

        @NotBlank(message = "Condition is required")
        String condition,

        String status,

        List<String> images
) {}