package com.bookstore.api.interceptor;

import com.bookstore.api.common.annotation.RequireCaptcha;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.service.RecaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class CaptchaInterceptor implements HandlerInterceptor {

    private final RecaptchaService recaptchaService;

    public CaptchaInterceptor(RecaptchaService recaptchaService) {
        this.recaptchaService = recaptchaService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            RequireCaptcha requireCaptcha = handlerMethod.getMethodAnnotation(RequireCaptcha.class);
            
            // Fallback to class level annotation if not found on method
            if (requireCaptcha == null) {
                requireCaptcha = handlerMethod.getBeanType().getAnnotation(RequireCaptcha.class);
            }

            if (requireCaptcha != null) {
                String captchaToken = request.getHeader("X-Captcha-Token");
                
                if (captchaToken == null || captchaToken.trim().isEmpty()) {
                    throw new BadRequestException("Mã xác thực (Captcha) là bắt buộc");
                }

                String action = requireCaptcha.action();
                boolean isCaptchaValid = recaptchaService.verifyRecaptcha(captchaToken, action);
                
                if (!isCaptchaValid) {
                    throw new BadRequestException("Xác thực Captcha thất bại hoặc đã hết hạn");
                }
            }
        }
        return true;
    }
}
