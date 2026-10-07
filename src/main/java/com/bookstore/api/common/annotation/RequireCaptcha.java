package com.bookstore.api.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation dùng để đánh dấu các API cần được bảo vệ bằng mã Captcha.
 * Hỗ trợ reCAPTCHA v3 với thuộc tính action.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireCaptcha {
    /**
     * Tên action cần verify trên Google reCAPTCHA (vd: login, register)
     */
    String action() default "";
}
