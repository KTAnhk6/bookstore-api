import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * CAPTCHA COMPONENT (React)
 * Component hiển thị Captcha phía Client theo Jira DB-39:
 * - Vẽ mã xác thực trực quan trên thẻ Canvas với nhiễu đường cong và biến dạng ký tự.
 * - Cung cấp hàm sinh token Captcha an toàn để đính kèm vào payload gửi lên API Auth.
 * - Hỗ trợ tự động làm mới, xác thực realtime hoặc khi submit form.
 */
const Captcha = forwardRef(({ 
    onVerify, 
    value, 
    onChange, 
    showInput = true,
    placeholder = "Nhập mã xác thực...", 
    error = null,
    className = "" 
}, ref) => {
    const canvasRef = useRef(null);
    const [captchaCode, setCaptchaCode] = useState('');
    const [inputValue, setInputValue] = useState(value || '');
    const [isRotating, setIsRotating] = useState(false);

    // Random characters pool
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const generateCaptcha = () => {
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 500);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width || 140;
        const height = canvas.height || 44;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#f1f5f9');
        bgGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Generate Random 5-character Alphanumeric code
        let code = "";
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);

        // Draw Noise Lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 200)}, 0.45)`;
            ctx.lineWidth = 1 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }

        // Draw Noise Dots
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, 0.6)`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Distorted Characters
        ctx.font = "bold 22px 'Segoe UI', Tahoma, monospace";
        ctx.textBaseline = "middle";

        const letterSpacing = width / 6;
        const colors = ['#1e1b4b', '#4338ca', '#0f766e', '#b45309', '#9f1239'];

        for (let i = 0; i < code.length; i++) {
            ctx.save();
            const charX = 16 + i * letterSpacing;
            const charY = height / 2 + (Math.random() * 6 - 3);
            const angle = (Math.random() * 30 - 15) * Math.PI / 180;

            ctx.translate(charX, charY);
            ctx.rotate(angle);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillText(code[i], 0, 0);
            ctx.restore();
        }

        // Generate token
        const token = `visual_${Date.now()}_${btoa(code)}`;
        if (onVerify) {
            onVerify({ code, token, isValid: false });
        }
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
        refresh: () => {
            generateCaptcha();
            setInputValue('');
        },
        getCode: () => captchaCode,
        getToken: () => `visual_${Date.now()}_${btoa(captchaCode)}`,
        validate: (customInput) => {
            const val = (customInput !== undefined ? customInput : inputValue).trim().toUpperCase();
            return val === captchaCode.toUpperCase();
        }
    }));

    const handleInputChange = (e) => {
        const val = e.target.value.toUpperCase();
        setInputValue(val);
        if (onChange) onChange(e);

        const isValid = val.trim() === captchaCode.toUpperCase();
        const token = `visual_${Date.now()}_${btoa(captchaCode)}`;
        if (onVerify) {
            onVerify({ code: captchaCode, token, isValid, input: val });
        }
    };

    return (
        <div className={`captcha-widget ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Canvas Container */}
                <div 
                    style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #cbd5e1',
                        lineHeight: 0,
                        backgroundColor: '#f8fafc'
                    }}
                >
                    <canvas 
                        ref={canvasRef} 
                        width={140} 
                        height={44} 
                        style={{ display: 'block', cursor: 'pointer' }}
                        onClick={generateCaptcha}
                        title="Bấm để đổi mã khác"
                    />
                </div>

                {/* Refresh Button */}
                <button
                    type="button"
                    onClick={generateCaptcha}
                    title="Đổi mã Captcha khác"
                    style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span 
                        style={{ 
                            display: 'inline-block',
                            transition: 'transform 0.5s ease',
                            transform: isRotating ? 'rotate(360deg)' : 'none',
                            fontSize: '16px'
                        }}
                    >
                        🔄
                    </span>
                </button>

                {/* Input Field */}
                {showInput && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        maxLength={6}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                            color: '#0f172a'
                        }}
                    />
                )}
            </div>

            {error && (
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                    {error}
                </span>
            )}
        </div>
    );
});

export default Captcha;
