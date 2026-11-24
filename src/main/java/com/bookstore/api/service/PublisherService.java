package com.bookstore.api.service;

import com.bookstore.api.dto.request.PublisherRequest;
import com.bookstore.api.dto.response.PublisherResponse;

import java.util.List;

public interface PublisherService {

    List<PublisherResponse> getAllPublishers();

    PublisherResponse getPublisherById(Long id);

    PublisherResponse getPublisherBySlug(String slug);

    PublisherResponse createPublisher(PublisherRequest request);

    PublisherResponse updatePublisher(Long id, PublisherRequest request);

    void deletePublisher(Long id);
}
