package com.unipop.market.dto;

import java.util.List;

/**
 * Canonical Unipop category tree served to the client so the browse filters and
 * the "sell" form always stay in sync with the backend.
 */
public final class CategoryCatalog {

    private CategoryCatalog() {}

    public record CategoryDto(
            String name,
            List<String> subcategories,
            List<String> genders,
            List<String> sizes
    ) {}

    public static final List<String> CONDITIONS = List.of("NEW", "GOOD", "POOR");

    public static final List<String> CLOTHING_SIZES = List.of("XS", "S", "M", "L", "XL", "XXL");
    public static final List<String> SHOE_SIZES = List.of("5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5",
            "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14");
    public static final List<String> GENDERS = List.of("Mens", "Womens", "Unisex");

    public static final List<String> CLOTHES_TYPES = List.of(
            "Shirts", "Pants", "Shorts", "Outerwear", "Athletic", "Dresses", "Other");

    public static final List<CategoryDto> CATEGORIES = List.of(
            new CategoryDto("Clothes", CLOTHES_TYPES, GENDERS, CLOTHING_SIZES),
            new CategoryDto("Shoes", List.of(), List.of("Mens", "Womens", "Unisex"), SHOE_SIZES),
            new CategoryDto("Hats", List.of(), GENDERS, List.of()),
            new CategoryDto("Jewelry", List.of(), GENDERS, List.of()),
            new CategoryDto("Accessories", List.of(), GENDERS, List.of()),
            new CategoryDto("Books", List.of("Textbooks", "Course Readers", "Study Guides", "Other"), List.of(), List.of()),
            new CategoryDto("School Gear", List.of("Hoodies", "Spirits Wear", "Decals", "Other"), List.of(), CLOTHING_SIZES),
            new CategoryDto("Electronics", List.of("Laptops", "Phones", "Tablets", "Audio", "Gaming", "Other"), List.of(), List.of()),
            new CategoryDto("Bikes", List.of("Road", "Mountain", "Hybrid", "Scooters", "Other"), List.of(), List.of()),
            new CategoryDto("Home Goods", List.of("Kitchen", "Decor", "Bedding", "Other"), List.of(), List.of()),
            new CategoryDto("Furniture", List.of("Desks", "Chairs", "Dressers", "Bed Frames", "Mini Fridges", "Other"), List.of(), List.of()),
            new CategoryDto("Tickets", List.of("Sports", "Concerts", "Events", "Parking", "Other"), List.of(), List.of()),
            new CategoryDto("Leases", List.of("Sublease", "Roommate Needed", "Full Apartment", "Other"), List.of(), List.of()),
            new CategoryDto("Other", List.of(), GENDERS, List.of())
    );

    public static boolean isValidCategory(String category) {
        return CATEGORIES.stream().anyMatch(c -> c.name().equalsIgnoreCase(category));
    }

    public static boolean isValidCondition(String condition) {
        return CONDITIONS.stream().anyMatch(c -> c.equalsIgnoreCase(condition));
    }

    public static CategoryDto byName(String category) {
        return CATEGORIES.stream()
                .filter(c -> c.name().equalsIgnoreCase(category))
                .findFirst()
                .orElse(null);
    }
}