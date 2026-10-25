package com.bookstore.api.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu endpoint cần xác minh captcha.
 * Hiện chỉ là marker (chưa có aspect kiểm tra) để AuthController compile được.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireCaptcha {
    String action() default "";
}
