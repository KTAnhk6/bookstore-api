package com.bookstore.api.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Tắt CSRF (vì mình làm REST API, không dùng form login truyền thống)
            .csrf(csrf -> csrf.disable())
            
            // 2. Cấu hình CORS (để frontend gọi API không bị chặn)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 3. Phân quyền các request
            .authorizeHttpRequests(auth -> auth
                // Cho phép gọi API upload ảnh và xem ảnh công khai
                .requestMatchers("/api/files/**", "/uploads/**").permitAll()
                
                // Cho phép đăng nhập, đăng ký
                .requestMatchers("/api/auth/**").permitAll()
                
                // Cho phép xem sách, tác giả, NXB (không cần login)
                .requestMatchers("/api/books/**", "/api/authors/**", "/api/categories/**", "/api/publishers/**").permitAll()
                // Các API còn lại (giỏ hàng, đơn hàng, admin...) yêu cầu đăng nhập
                .anyRequest().authenticated()
            );

        return http.build();
    }

    // Cấu hình CORS chi tiết
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173")); // Cho phép React/Vue gọi
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}