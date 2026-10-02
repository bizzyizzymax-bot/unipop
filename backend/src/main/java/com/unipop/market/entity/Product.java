package com.unipop.market.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    public static final String CONDITION_NEW = "NEW";
    public static final String CONDITION_GOOD = "GOOD";
    public static final String CONDITION_POOR = "POOR";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_SOLD = "SOLD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Double price;

    /** Top level category, e.g. Clothes, Shoes, Books, Leases ... */
    @Column(nullable = false)
    private String category;

    /** Sub category / type, e.g. Shirts, Pants (mainly for Clothes). */
    private String subcategory;

    /** Mens / Womens / Unisex - only for the Clothes category. */
    private String gender;

    /** Optional size, e.g. "M" or "10". */
    private String size;

    /** NEW / GOOD / POOR */
    @Column(nullable = false)
    private String condition;

    /** ACTIVE / SOLD - there is no in-app checkout, items are swapped in person. */
    @Column(nullable = false)
    private String status;

    /**
     * Listing photos stored as base64 data-urls so a listing can be created
     * with its images in a single request.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_data", columnDefinition = "text")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = STATUS_ACTIVE;
        if (images == null) images = new ArrayList<>();
    }
}