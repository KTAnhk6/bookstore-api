package com.bookstore.api.exception;

import com.bookstore.api.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Sai tên đăng nhập hoặc mật khẩu"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Bạn không có quyền thực hiện hành động này"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Dữ liệu đầu vào không hợp lệ")
                        .data(errors)
                        .build());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        Throwable root = org.springframework.core.NestedExceptionUtils.getMostSpecificCause(ex);
        String msg = (root != null ? root.getMessage() : ex.getMessage()) + " " + ex.getMessage();
        if (msg.contains("users.phone") || (msg.contains("Duplicate entry") && msg.contains("phone"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Số điện thoại này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng số điện thoại khác!"));
        }
        if (msg.contains("users.email") || (msg.contains("Duplicate entry") && msg.contains("email")) || msg.contains("UK_6dotkott2kjsp8vw4d0m25fb7")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng email khác hoặc đăng nhập!"));
        }
        if (msg.contains("users.username") || (msg.contains("Duplicate entry") && msg.contains("username")) || msg.contains("UK_r43af9ap4edm43mmtq01oddj6")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên đăng nhập khác!"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Dữ liệu bị trùng lặp hoặc vi phạm ràng buộc dữ liệu trong hệ thống."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception ex) {
        Throwable root = org.springframework.core.NestedExceptionUtils.getMostSpecificCause(ex);
        String msg = (root != null ? root.getMessage() : ex.getMessage()) + " " + ex.getMessage();
        String lower = msg.toLowerCase();
        if (lower.contains("duplicate entry") || lower.contains("unique constraint") || lower.contains("constraint [users.")) {
            if (lower.contains("email") || lower.contains("uk_6dotkott2kjsp8vw4d0m25fb7")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Email này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng email khác hoặc đăng nhập!"));
            }
            if (lower.contains("phone")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Số điện thoại này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng số khác!"));
            }
            if (lower.contains("username") || lower.contains("uk_r43af9ap4edm43mmtq01oddj6")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!"));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Thông tin đăng ký bị trùng lặp trong hệ thống. Vui lòng kiểm tra lại!"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Đã xảy ra lỗi hệ thống: " + (root != null ? root.getMessage() : ex.getMessage())));
    }
}
