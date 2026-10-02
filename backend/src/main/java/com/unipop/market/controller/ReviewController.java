package com.unipop.market.controller;

import com.unipop.market.dto.ReviewRequestDto;
import com.unipop.market.dto.ReviewResponseDto;
import com.unipop.market.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponseDto> addReview(@Valid @RequestBody ReviewRequestDto request){
        return ResponseEntity.ok(reviewService.addReview(request));
    }

    /** Delete your own review (so you can write a new one later). */
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id){
        reviewService.deleteReview(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsBySellerId(@PathVariable Long id){
        return ResponseEntity.ok(reviewService.getReviewsBySellerId(id));
    }

}
