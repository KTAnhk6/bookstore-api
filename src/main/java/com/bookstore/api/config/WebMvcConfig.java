package com.bookstore.api.config;

import com.bookstore.api.interceptor.CaptchaInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CaptchaInterceptor captchaInterceptor;

    public WebMvcConfig(CaptchaInterceptor captchaInterceptor) {
        this.captchaInterceptor = captchaInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(captchaInterceptor)
                .addPathPatterns("/**");
    }
}
