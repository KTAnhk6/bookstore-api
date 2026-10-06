package com.bookstore.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình đường dẫn URL để truy cập ảnh
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/"); // Thư mục uploads nằm ở gốc project
    }
}