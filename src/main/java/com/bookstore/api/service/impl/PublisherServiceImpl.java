package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.PublisherRequest;
import com.bookstore.api.dto.response.PublisherResponse;
import com.bookstore.api.entity.Publisher;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.PublisherRepository;
import com.bookstore.api.service.PublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublisherServiceImpl implements PublisherService {

    private final PublisherRepository publisherRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PublisherResponse> getAllPublishers() {
        return publisherRepository.findAll().stream()
                .map(PublisherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PublisherResponse getPublisherById(Long id) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", id));
        return PublisherResponse.fromEntity(publisher);
    }

    @Override
    @Transactional(readOnly = true)
    public PublisherResponse getPublisherBySlug(String slug) {
        Publisher publisher = publisherRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "slug", slug));
        return PublisherResponse.fromEntity(publisher);
    }

    @Override
    @Transactional
    public PublisherResponse createPublisher(PublisherRequest request) {
        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? CategoryServiceImpl.toSlug(request.getSlug())
                : CategoryServiceImpl.toSlug(request.getName());

        if (publisherRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Publisher publisher = Publisher.builder()
                .name(request.getName().trim())
                .slug(slug)
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .logo(request.getLogo())
                .description(request.getDescription())
                .build();

        publisher = publisherRepository.save(publisher);
        return PublisherResponse.fromEntity(publisher);
    }

    @Override
    @Transactional
    public PublisherResponse updatePublisher(Long id, PublisherRequest request) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", id));

        publisher.setName(request.getName().trim());
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            publisher.setSlug(CategoryServiceImpl.toSlug(request.getSlug()));
        }
        publisher.setAddress(request.getAddress());
        publisher.setPhone(request.getPhone());
        publisher.setEmail(request.getEmail());
        publisher.setWebsite(request.getWebsite());
        publisher.setLogo(request.getLogo());
        publisher.setDescription(request.getDescription());

        publisher = publisherRepository.save(publisher);
        return PublisherResponse.fromEntity(publisher);
    }

    @Override
    @Transactional
    public void deletePublisher(Long id) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", id));
        publisherRepository.delete(publisher);
    }
}
