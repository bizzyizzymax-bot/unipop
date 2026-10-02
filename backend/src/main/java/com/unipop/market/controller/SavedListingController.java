package com.unipop.market.controller;

import com.unipop.market.dto.ProductResponseDto;
import com.unipop.market.service.SavedListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Saved ("hearted") listings for the logged in student. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/saved")
public class SavedListingController {

    private final SavedListingService savedListingService;

    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> getSaved() {
        return ResponseEntity.ok(savedListingService.getSaved());
    }

    @PostMapping("/{productId}")
    public ResponseEntity<Void> save(@PathVariable Long productId) {
        savedListingService.save(productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> unsave(@PathVariable Long productId) {
        savedListingService.unsave(productId);
        return ResponseEntity.noContent().build();
    }
}