package com.bookstore.api.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu endpoint cần xác minh captcha.
 * Kiểm tra bởi CaptchaAspect qua header X-Captcha-Id / X-Captcha-Code (lấy mã tại GET /api/auth/captcha).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireCaptcha {
    String action() default "";
}
