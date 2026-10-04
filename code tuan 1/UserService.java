package com.bookstore.api.service;

import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.response.FavoriteCategoriesResponse;

public interface UserService {

    FavoriteCategoriesResponse setFavoriteCategories(Long userId, FavoriteCategoriesRequest request);

    FavoriteCategoriesResponse getFavoriteCategories(Long userId);

    FavoriteCategoriesResponse addFavoriteCategory(Long userId, Long categoryId);

    FavoriteCategoriesResponse removeFavoriteCategory(Long userId, Long categoryId);

    void clearFavoriteCategories(Long userId);
}
