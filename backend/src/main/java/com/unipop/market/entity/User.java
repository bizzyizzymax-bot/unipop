package com.unipop.market.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Past(message = "Date of Birth must be in the past")
    @Column(nullable = false, name = "date_of_birth")
    private LocalDate dob;

    @Column(nullable = false, name = "first_name")
    private String firstName;

    /**
     * School domain derived from the .edu email address, e.g. "charlotte.edu".
     * Used to scope listings and messaging to a single campus.
     */
    @Column(nullable = false, name = "school_domain")
    private String schoolDomain;

    /** Last time the user changed username or email (14-day lock). */
    @Column(name = "last_email_username_change")
    private java.time.Instant lastEmailUsernameChange;

    /** Last time the user changed password (14-day lock). */
    @Column(name = "last_password_change")
    private java.time.Instant lastPasswordChange;

    /**
     * The userID is permanent: it can never be modified once the account exists.
     * (Hibernate uses field access because @Id is declared on the field, so
     * overriding the setter does not interfere with persistence.)
     */
    public void setId(Long id) {
        if (this.id != null && !this.id.equals(id)) {
            throw new UnsupportedOperationException("User ID cannot be changed.");
        }
        this.id = id;
    }

    public boolean isAtLeast18() {
        return dob != null && Period.between(dob, LocalDate.now()).getYears() >= 18;
    }

    public static String domainOf(String email) {
        if (email == null) return null;
        int at = email.lastIndexOf('@');
        return at >= 0 && at < email.length() - 1 ? email.substring(at + 1).toLowerCase() : null;
    }
}