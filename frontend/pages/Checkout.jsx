import React, { useState, useEffect } from 'react';

/**
 * Checkout.jsx - Giao diện Thanh toán & Quét mã VietQR động
 * Tác giả nhiệm vụ: Minh Anh
 */
export default function Checkout() {
    const [cart, setCart] = useState([
        { id: 1, title: 'Nhà Giả Kim (Tái Bản 2024)', price: 79000, quantity: 2, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300' },
        { id: 2, title: 'Đắc Nhân Tâm (Khổ Lớn)', price: 98000, quantity: 1, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300' }
    ]);

    const [paymentMethod, setPaymentMethod] = useState('VIETQR'); // 'VIETQR' | 'COD' | 'VNPAY'
    const [recipient, setRecipient] = useState({
        name: 'Trần Minh Anh',
        phone: '0987654321',
        email: 'minhanh@bookstore.vn',
        address: '123 Đường Tri Thức, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        note: 'Giao hàng giờ hành chính giúp mình nhé'
    });

    const [couponCode, setCouponCode] = useState('BOOK20');
    const [couponApplied, setCouponApplied] = useState({ code: 'BOOK20', discount: 30000 });
    const [couponError, setCouponError] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const [timeLeft, setTimeLeft] = useState(900); // 15 phút = 900s
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Tính toán tài chính
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = couponApplied ? couponApplied.discount : 0;
    const shipping = subtotal >= 350000 ? 0 : 25000;
    const totalAmount = Math.max(0, subtotal - discount + shipping);

    const orderCode = 'BK' + 88629;
    const bankInfo = {
        bankName: 'MBBank (Ngân hàng Quân Đội)',
        accountNumber: '0912345678',
        accountName: 'BOOKSTORE OFFICIAL',
        amount: totalAmount,
        content: orderCode
    };

    const qrUrl = `https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg?accountName=BOOKSTORE%20OFFICIAL&amount=${totalAmount}&addInfo=${orderCode}`;

    // Đếm ngược 15 phút cho mã QR
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const handleCopy = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleApplyCoupon = () => {
        if (couponCode.toUpperCase() === 'BOOK20') {
            setCouponApplied({ code: 'BOOK20', discount: 30000 });
            setCouponError('');
        } else if (couponCode.toUpperCase() === 'FREESHIP') {
            setCouponApplied({ code: 'FREESHIP', discount: shipping });
            setCouponError('');
        } else {
            setCouponError('Mã ưu đãi không hợp lệ hoặc đã hết lượt dùng!');
        }
    };

    const handleConfirmPayment = () => {
        setIsProcessing(true);
        // Giả lập gọi API Backend /api/payments/process hoặc /api/payments/callback
        setTimeout(() => {
            setIsProcessing(false);
            setOrderSuccess(true);
        }, 1200);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {/* Header & Breadcrumb */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                    Trang chủ / Giỏ hàng / <span style={{ color: '#2563eb', fontWeight: 600 }}>Thanh toán đơn hàng</span>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Thanh Toán & Đặt Hàng</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr', gap: '28px' }}>
                {/* CỘT TRÁI: Form người nhận & Chọn phương thức */}
                <div>
                    {/* Bước 1: Thông tin giao hàng */}
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>1</span>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>Thông Tin Nhận Hàng</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Họ và tên *</label>
                                <input
                                    type="text"
                                    value={recipient.name}
                                    onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Số điện thoại *</label>
                                <input
                                    type="text"
                                    value={recipient.phone}
                                    onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Địa chỉ nhận hàng chi tiết *</label>
                            <input
                                type="text"
                                value={recipient.address}
                                onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Ghi chú giao hàng</label>
                            <textarea
                                value={recipient.note}
                                onChange={(e) => setRecipient({ ...recipient, note: e.target.value })}
                                rows="2"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    {/* Bước 2: Phương thức thanh toán */}
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>2</span>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>Chọn Hình Thức Thanh Toán</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Option 1: VietQR */}
                            <label
                                onClick={() => setPaymentMethod('VIETQR')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: paymentMethod === 'VIETQR' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                    background: paymentMethod === 'VIETQR' ? '#eff6ff' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input type="radio" checked={paymentMethod === 'VIETQR'} onChange={() => setPaymentMethod('VIETQR')} />
                                <div style={{ fontSize: '24px' }}>📱</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Chuyển khoản VietQR (Napas 24/7)
                                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Tự động duyệt</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Quét mã QR qua app ngân hàng, miễn phí, xử lý tức thì</div>
                                </div>
                            </label>

                            {/* Option 2: COD */}
                            <label
                                onClick={() => setPaymentMethod('COD')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: paymentMethod === 'COD' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                    background: paymentMethod === 'COD' ? '#eff6ff' : '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                                <div style={{ fontSize: '24px' }}>💵</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Thanh toán khi nhận hàng (COD)</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Thanh toán bằng tiền mặt trực tiếp cho nhân viên bưu tá</div>
                                </div>
                            </label>

                            {/* Option 3: VNPay */}
                            <label
                                onClick={() => setPaymentMethod('VNPAY')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: paymentMethod === 'VNPAY' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                    background: paymentMethod === 'VNPAY' ? '#eff6ff' : '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                <input type="radio" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} />
                                <div style={{ fontSize: '24px' }}>💳</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Cổng thanh toán VNPay / Thẻ ATM</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Hỗ trợ thẻ nội địa & quốc tế Visa / MasterCard</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Khối VietQR & Tóm tắt đơn hàng */}
                <div>
                    {paymentMethod === 'VIETQR' && (
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '2px solid #bfdbfe', boxShadow: '0 4px 20px rgba(37,99,235,0.08)', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e3a8a' }}>MÃ VIETQR THANH TOÁN</div>
                                <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, background: '#fee2e2', padding: '4px 10px', borderRadius: '20px' }}>
                                    ⏱ Còn lại: {formatTime(timeLeft)}
                                </div>
                            </div>

                            {/* Khung QR code */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '18px' }}>
                                <img
                                    src={qrUrl}
                                    alt="VietQR Payment"
                                    style={{ width: '220px', height: '220px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                                />
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Mở App ngân hàng bất kỳ để quét mã QR</div>
                            </div>

                            {/* Chi tiết tài khoản & Copy */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{bankInfo.bankName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, color: '#2563eb' }}>{bankInfo.accountNumber}</span>
                                        <button
                                            onClick={() => handleCopy(bankInfo.accountNumber, 'acc')}
                                            style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Số tiền:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(bankInfo.amount)}</span>
                                        <button
                                            onClick={() => handleCopy(bankInfo.amount.toString(), 'amount')}
                                            style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Nội dung CK:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{bankInfo.content}</span>
                                        <button
                                            onClick={() => handleCopy(bankInfo.content, 'content')}
                                            style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: isProcessing ? '#94a3b8' : '#2563eb',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    border: 'none',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isProcessing ? 'Đang xác thực thanh toán...' : 'Tôi Đã Chuyển Khoản Thành Công'}
                            </button>
                        </div>
                    )}

                    {/* Tóm tắt chi phí đơn hàng */}
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>Chi Tiết Đơn Hàng ({cart.length} sản phẩm)</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            {cart.map((item) => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={item.image} alt={item.title} style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>SL: {item.quantity} x {formatCurrency(item.price)}</div>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{formatCurrency(item.price * item.quantity)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Mã giảm giá */}
                        <div style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Nhập mã giảm giá..."
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {couponError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px' }}>{couponError}</div>}
                            {couponApplied && <div style={{ color: '#16a34a', fontSize: '12px', marginTop: '6px' }}>Áp dụng mã <strong>{couponApplied.code}</strong> thành công!</div>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Tạm tính:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                                <span>Giảm giá coupon:</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Phí vận chuyển:</span>
                                <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                <span>Tổng thanh toán:</span>
                                <span style={{ color: '#2563eb' }}>{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>

                        {paymentMethod !== 'VIETQR' && (
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Đặt Hàng Ngay ({formatCurrency(totalAmount)})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal hoàn thành đặt hàng */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
                            ✓
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Đặt Hàng & Thanh Toán Thành Công!</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                            Mã đơn hàng <strong>#{orderCode}</strong> đã được hệ thống ghi nhận. Cảm ơn bạn đã đồng hành cùng BookStore.
                        </p>
                        <button
                            onClick={() => (window.location.href = '#/profile')}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#2563eb', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                            Xem Lịch Sử Đơn Hàng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
