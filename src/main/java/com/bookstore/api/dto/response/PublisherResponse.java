package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Publisher;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherResponse {

    private Long id;
    private String name;
    private String slug;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String description;
    private LocalDateTime createdAt;

    public static PublisherResponse fromEntity(Publisher publisher) {
        if (publisher == null) return null;
        return PublisherResponse.builder()
                .id(publisher.getId())
                .name(publisher.getName())
                .slug(publisher.getSlug())
                .address(publisher.getAddress())
                .phone(publisher.getPhone())
                .email(publisher.getEmail())
                .website(publisher.getWebsite())
                .logo(publisher.getLogo())
                .description(publisher.getDescription())
                .createdAt(publisher.getCreatedAt())
                .build();
    }
}
