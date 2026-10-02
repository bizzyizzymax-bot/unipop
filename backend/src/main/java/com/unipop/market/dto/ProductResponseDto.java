package com.unipop.market.dto;

import java.time.Instant;
import java.util.List;

/** Listing payload returned to the client. */
public record ProductResponseDto(
        Long id,
        String title,
        String description,
        Double price,
        String category,
        String subcategory,
        String gender,
        String size,
        String condition,
        String status,
        List<String> images,
        Instant createdAt,
        SellerSummaryDto seller,
        String sellerSchoolDomain,
        boolean saved,
        boolean owner
) {}