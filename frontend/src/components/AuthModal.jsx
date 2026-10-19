import React, { useState, useRef } from 'react';
import Captcha from './Captcha';

/**
 * AUTH MODAL COMPONENT (React)
 * Màn hình Đăng ký / Đăng nhập tích hợp Widget Captcha theo yêu cầu DB-39:
 * - Đính kèm mã Captcha token vào payload gửi lên API auth
 * - Tương thích giao diện phân quyền và kết nối backend
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('quang@booknest.vn');
    const [password, setPassword] = useState('123456');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Captcha state
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaError, setCaptchaError] = useState('');
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const captchaRef = useRef(null);

    if (!isOpen) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        setApiError('');
        setCaptchaError('');

        // 1. Kiểm tra Captcha hợp lệ
        if (!captchaRef.current || !captchaRef.current.validate(captchaInput)) {
            setCaptchaError('Mã xác thực (Captcha) không chính xác!');
            captchaRef.current?.refresh();
            setCaptchaInput('');
            return;
        }

        // 2. Lấy Captcha token để đính kèm payload
        const captchaToken = captchaRef.current.getToken();

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Captcha-Token': captchaToken
                },
                body: JSON.stringify({
                    usernameOrEmail: email,
                    password: password,
                    captchaToken: captchaToken
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập không thành công');
            }

            if (onAuthSuccess) {
                onAuthSuccess(data.data || data);
            }
            onClose();
        } catch (err) {
            setApiError(err.message || 'Lỗi kết nối máy chủ');
            captchaRef.current?.refresh();
            setCaptchaInput('');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setApiError('');
        setCaptchaError('');

        if (password !== confirmPassword) {
            setApiError('Mật khẩu xác nhận không khớp!');
            return;
        }

        // 1. Kiểm tra Captcha hợp lệ
        if (!captchaRef.current || !captchaRef.current.validate(captchaInput)) {
            setCaptchaError('Mã xác thực (Captcha) không chính xác!');
            captchaRef.current?.refresh();
            setCaptchaInput('');
            return;
        }

        // 2. Lấy Captcha token
        const captchaToken = captchaRef.current.getToken();

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Captcha-Token': captchaToken
                },
                body: JSON.stringify({
                    username: email.split('@')[0],
                    fullName: fullName,
                    email: email,
                    phone: phone,
                    password: password,
                    captchaToken: captchaToken
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Đăng ký không thành công');
            }

            if (onAuthSuccess) {
                onAuthSuccess(data.data || data);
            }
            onClose();
        } catch (err) {
            setApiError(err.message || 'Lỗi khi đăng ký tài khoản');
            captchaRef.current?.refresh();
            setCaptchaInput('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '460px',
                padding: '28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#64748b'
                    }}
                >
                    ✕
                </button>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <button
                        onClick={() => { setActiveTab('login'); setCaptchaError(''); setApiError(''); }}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            color: activeTab === 'login' ? '#2563eb' : '#64748b',
                            borderBottom: activeTab === 'login' ? '2px solid #2563eb' : 'none'
                        }}
                    >
                        Đăng Nhập
                    </button>
                    <button
                        onClick={() => { setActiveTab('register'); setCaptchaError(''); setApiError(''); }}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            color: activeTab === 'register' ? '#2563eb' : '#64748b',
                            borderBottom: activeTab === 'register' ? '2px solid #2563eb' : 'none'
                        }}
                    >
                        Tạo Tài Khoản
                    </button>
                </div>

                {apiError && (
                    <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '13px',
                        marginBottom: '14px'
                    }}>
                        {apiError}
                    </div>
                )}

                {/* Login Form */}
                {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Email / Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Captcha Integration Widget */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Mã xác nhận chống bot (Captcha) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Captcha
                                ref={captchaRef}
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                error={captchaError}
                                placeholder="Nhập mã..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '10px',
                                padding: '12px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                        </button>
                    </form>
                ) : (
                    /* Register Form */
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="Trịnh Quang"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="quang@booknest.vn"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="0912 345 678"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                Nhập lại mật khẩu
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                placeholder="Nhập lại mật khẩu"
                            />
                        </div>

                        {/* Captcha Integration Widget for Register */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                Mã xác thực bảo vệ (Captcha) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <Captcha
                                ref={captchaRef}
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                error={captchaError}
                                placeholder="Nhập mã..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '10px',
                                padding: '12px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng Ký Tài Khoản'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
