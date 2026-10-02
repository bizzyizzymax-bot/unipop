package com.unipop.market.security;

import com.unipop.market.entity.User;
import com.unipop.market.repository.UserRepo;
import com.unipop.market.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Helpers for reading the authenticated student from the security context. */
public final class AuthUtils {

    private AuthUtils() {}

    /** Email is the JWT subject, so it identifies the logged in student. */
    public static String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw ApiException.forbidden("Not authenticated.");
        }
        return auth.getName();
    }

    /** School domain of the logged in student, e.g. "charlotte.edu". */
    public static String currentSchoolDomain() {
        return User.domainOf(currentEmail());
    }

    public static User currentUser(UserRepo userRepo) {
        return userRepo.findByEmail(currentEmail())
                .orElseThrow(() -> ApiException.notFound("User not found."));
    }
}