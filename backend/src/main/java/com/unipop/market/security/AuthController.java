package com.unipop.market.security;

import com.unipop.market.entity.User;
import com.unipop.market.exception.ApiException;
import com.unipop.market.repository.UserRepo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    /**
     * Sign up. Only university (.edu) emails are accepted and students must be at least 18.
     * The email domain (e.g. charlotte.edu) becomes the student's campus and scopes
     * every listing and conversation they can see.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequestDto request) {
        String email = request.email().trim().toLowerCase();

        if (!email.endsWith(".edu")) {
            throw ApiException.badRequest("Sign up with a university email ending in .edu");
        }
        if (userRepo.findByEmail(email).isPresent()) {
            throw ApiException.conflict("An account with that email already exists.");
        }
        if (userRepo.findByUsername(request.username()).isPresent()) {
            throw ApiException.conflict("That username is already taken.");
        }

        User user = User.builder()
                .firstName(request.firstName().trim())
                .email(email)
                .username(request.username().trim())
                .dob(request.dob())
                .password(passwordEncoder.encode(request.password()))
                .schoolDomain(User.domainOf(email))
                .build();

        if (!user.isAtLeast18()) {
            throw ApiException.badRequest("You must be at least 18 years old to use Unipop.");
        }

        userRepo.save(user);

        String token = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPassword())
                        .authorities("USER")
                        .build());

        return ResponseEntity.ok(authResponse(token, user));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestDto request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        UserDetails principal = (UserDetails) auth.getPrincipal();
        String token = jwtUtils.generateToken(principal);

        User user = userRepo.findByEmail(request.email())
                .orElseThrow(() -> ApiException.notFound("User not found."));

        return ResponseEntity.ok(authResponse(token, user));
    }

    private Map<String, Object> authResponse(String token, User user) {
        return Map.of(
                "token", token,
                "id", user.getId(),
                "firstName", user.getFirstName(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "dob", user.getDob().toString(),
                "schoolDomain", user.getSchoolDomain(),
                "lastEmailUsernameChange", String.valueOf(user.getLastEmailUsernameChange()),
                "lastPasswordChange", String.valueOf(user.getLastPasswordChange())
        );
    }
}