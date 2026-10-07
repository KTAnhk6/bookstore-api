package com.bookstore.api.service;

public interface RecaptchaService {
    boolean verifyRecaptcha(String captchaToken, String action);
}
