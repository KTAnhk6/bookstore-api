package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Order;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private String orderCode;
    private Long userId;
    private String recipientName;
    private String shippingAddress;
    private String note;
    private String cancelReason;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private Order.PaymentMethod paymentMethod;
    private Order.PaymentStatus paymentStatus;
    private String couponCode;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponse fromEntity(Order order) {
        if (order == null) return null;

        String cancelReason = null;
        if (order.getStatus() == Order.OrderStatus.CANCELLED && order.getNote() != null) {
            cancelReason = order.getNote().startsWith("Hủy đơn hàng: ")
                    ? order.getNote().substring("Hủy đơn hàng: ".length())
                    : order.getNote();
        }

        String recipientName = null;
        if (order.getShippingAddress() != null && order.getShippingAddress().contains(",")) {
            recipientName = order.getShippingAddress().split(",")[0].trim();
        } else if (order.getUser() != null) {
            recipientName = order.getUser().getFullName();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .recipientName(recipientName)
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .cancelReason(cancelReason)
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .items(order.getItems() != null ? order.getItems().stream()
                        .map(OrderItemResponse::fromEntity)
                        .collect(Collectors.toList()) : List.of())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
