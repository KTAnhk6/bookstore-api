package com.bookstore.api.aspect;

import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.service.CaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Chặn các endpoint gắn @RequireCaptcha nếu header X-Captcha-Id / X-Captcha-Code không khớp mã server đã cấp. */
@Aspect
@Component
@RequiredArgsConstructor
public class CaptchaAspect {

    private final CaptchaService captchaService;

    @Before("@annotation(com.bookstore.api.common.annotation.RequireCaptcha)")
    public void checkCaptcha() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        if (!captchaService.verify(request.getHeader("X-Captcha-Id"), request.getHeader("X-Captcha-Code"))) {
            throw new BadRequestException("Mã captcha không đúng hoặc đã hết hạn");
        }
    }
}
