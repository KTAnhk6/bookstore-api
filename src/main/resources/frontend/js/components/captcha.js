/**
 * VISUAL CAPTCHA COMPONENT
 * Ảnh captcha do máy chủ sinh (GET /auth/captcha); mã chỉ nằm ở server nên client không tự kiểm tra được.
 * Gửi kèm headers() khi gọi API đăng nhập / đăng ký / quên mật khẩu. Mỗi mã chỉ dùng được một lần.
 */

class VisualCaptcha {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.captchaId = null;
        this.generate();
    }

    async generate() {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d');
        try {
            const { captchaId, image } = await ApiService.auth.captcha();
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            };
            img.src = image;
            this.captchaId = captchaId;
        } catch (err) {
            this.captchaId = null;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('Không tải được mã', 10, this.canvas.height / 2 + 4);
        }
    }

    headers(inputCode) {
        return { 'X-Captcha-Id': this.captchaId || '', 'X-Captcha-Code': (inputCode || '').trim() };
    }
}
