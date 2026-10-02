package com.unipop.market.dto.securityDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordDto (@NotBlank String currentPassword, @NotBlank @Size(min = 8, message="Password must be at least 8 characters") String newPassword){
}
