package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.GoogleRecaptchaResponse;
import com.bookstore.api.service.RecaptchaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class RecaptchaServiceImpl implements RecaptchaService {

    @Value("${google.recaptcha.secret:}")
    private String recaptchaSecret;

    @Value("${google.recaptcha.verify-url:https://www.google.com/recaptcha/api/siteverify}")
    private String recaptchaVerifyUrl;

    @Value("${google.recaptcha.threshold:0.5}")
    private double threshold;

    private final RestTemplate restTemplate;

    public RecaptchaServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public boolean verifyRecaptcha(String captchaToken, String action) {
        if (captchaToken == null || captchaToken.trim().isEmpty()) {
            return false;
        }

        MultiValueMap<String, String> requestMap = new LinkedMultiValueMap<>();
        requestMap.add("secret", recaptchaSecret);
        requestMap.add("response", captchaToken);

        try {
            GoogleRecaptchaResponse apiResponse = restTemplate.postForObject(
                    recaptchaVerifyUrl,
                    requestMap,
                    GoogleRecaptchaResponse.class
            );

            if (apiResponse == null) {
                return false;
            }

            // reCAPTCHA v3
            if (apiResponse.isSuccess() && apiResponse.getScore() >= threshold) {
                if (action != null && !action.isEmpty() && apiResponse.getAction() != null) {
                    return action.equals(apiResponse.getAction());
                }
                return true;
            }
        } catch (Exception e) {
            System.err.println("Error validating reCAPTCHA: " + e.getMessage());
        }
        return false;
    }
}
