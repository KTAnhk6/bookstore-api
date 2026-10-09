package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    private String avatar;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate birthday;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.CUSTOMER;

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints = 0;

    @Column(name = "has_set_preferences")
    private Boolean hasSetPreferences = false;

    @Column(name = "preferences_updated_at")
    private LocalDateTime preferencesUpdatedAt;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Role { CUSTOMER, STAFF, ADMIN }
    public enum Gender { MALE, FEMALE, OTHER }
    public enum Status { ACTIVE, INACTIVE, BANNED }
}