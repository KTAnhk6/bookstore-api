/**
 * VISUAL CANVAS CAPTCHA COMPONENT
 * Generates dynamic visual captcha with noise patterns, rotation and distortion.
 */

class VisualCaptcha {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.currentCode = "";
        this.generate();
    }

    generate() {
        if (!this.canvas) return "";
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width || 140;
        const height = this.canvas.height || 44;

        // Reset canvas
        ctx.clearRect(0, 0, width, height);

        // Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#e2e8f0');
        bgGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Generate Random 5-character Alphanumeric code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.currentCode = code;

        // Draw Noise Lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.floor(Math.random()*150)}, ${Math.floor(Math.random()*150)}, ${Math.floor(Math.random()*200)}, 0.4)`;
            ctx.lineWidth = 1 + Math.random() * 2;
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
        for (let i = 0; i < 35; i++) {
            ctx.fillStyle = `rgba(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, 0.6)`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Distorted Characters
        ctx.font = "bold 22px 'Plus Jakarta Sans', monospace";
        ctx.textBaseline = "middle";

        const letterSpacing = width / 6;
        for (let i = 0; i < code.length; i++) {
            ctx.save();
            const charX = 18 + i * letterSpacing;
            const charY = height / 2 + (Math.random() * 6 - 3);
            const angle = (Math.random() * 30 - 15) * Math.PI / 180;

            ctx.translate(charX, charY);
            ctx.rotate(angle);

            ctx.fillStyle = ['#1e1b4b', '#4338ca', '#0f766e', '#b45309', '#9f1239'][i % 5];
            ctx.fillText(code[i], 0, 0);
            ctx.restore();
        }

        return this.currentCode;
    }

    validate(inputCode) {
        if (!inputCode) return false;
        return inputCode.trim().toUpperCase() === this.currentCode.toUpperCase();
    }
}
