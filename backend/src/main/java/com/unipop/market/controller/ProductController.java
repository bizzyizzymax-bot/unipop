package com.unipop.market.controller;

import com.unipop.market.dto.CategoryCatalog;
import com.unipop.market.dto.ProductRequestDto;
import com.unipop.market.dto.ProductResponseDto;
import com.unipop.market.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    /** Browse listings - always scoped to the caller's campus, with optional filters. */
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDto>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Long sellerId) {
        return ResponseEntity.ok(productService.getProducts(
                new ProductService.ProductFilters(
                        category, subcategory, gender, condition, size, search, minPrice, maxPrice, sellerId)));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponseDto> addProduct(@Valid @RequestBody ProductRequestDto request) {
        return new ResponseEntity<>(productService.addProduct(request), HttpStatus.CREATED);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductResponseDto> updateProduct(@PathVariable Long id,
                                                            @Valid @RequestBody ProductRequestDto request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /** Category tree + conditions used by the browse filters and the sell form. */
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        return ResponseEntity.ok(Map.of(
                "categories", CategoryCatalog.CATEGORIES,
                "conditions", CategoryCatalog.CONDITIONS));
    }
}