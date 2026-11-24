package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Author;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorResponse {

    private Long id;
    private String name;
    private String slug;
    private String bio;
    private String avatar;
    private String nationality;
    private Integer birthYear;
    private Integer deathYear;
    private LocalDateTime createdAt;

    public static AuthorResponse fromEntity(Author author) {
        if (author == null) return null;
        return AuthorResponse.builder()
                .id(author.getId())
                .name(author.getName())
                .slug(author.getSlug())
                .bio(author.getBio())
                .avatar(author.getAvatar())
                .nationality(author.getNationality())
                .birthYear(author.getBirthYear())
                .deathYear(author.getDeathYear())
                .createdAt(author.getCreatedAt())
                .build();
    }
}
