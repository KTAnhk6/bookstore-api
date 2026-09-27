package com.bookstore.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String username;
    private Integer rating;
    private String comment;
    private String status;
    private LocalDateTime createdAt;
}