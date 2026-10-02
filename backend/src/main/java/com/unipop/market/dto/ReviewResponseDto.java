package com.unipop.market.dto;

/**
 * Read model for reviews so students can see what other buyers said
 * about a seller (rating, comment, and who wrote it).
 */
public record ReviewResponseDto(
        Long id,
        Integer rating,
        String comment,
        Long sellerId,
        Long buyerId,
        String buyerUsername,
        String buyerFirstName
) {
}