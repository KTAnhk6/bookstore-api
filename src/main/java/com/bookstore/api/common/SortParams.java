package com.bookstore.api.common;

import org.springframework.data.domain.Sort;

import java.util.Map;

/**
 * Đọc tham số sắp xếp dạng "cột_asc" / "cột_desc" của các bảng admin.
 * Chỉ nhận cột có trong danh sách cho phép; sai định dạng thì dùng thứ tự mặc định.
 */
public final class SortParams {

    private SortParams() {
    }

    public static Sort parse(String sortBy, Map<String, String> allowed, Sort fallback) {
        if (sortBy == null) return fallback;
        int split = sortBy.lastIndexOf('_');
        if (split < 0) return fallback;
        String property = allowed.get(sortBy.substring(0, split));
        String dir = sortBy.substring(split + 1);
        if (property == null || !(dir.equals("asc") || dir.equals("desc"))) return fallback;
        Sort.Direction direction = dir.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, property).and(Sort.by(Sort.Direction.DESC, "id"));
    }
}
