/**
 * CANVAS 2D CHART RENDERER
 * BookNest Dashboard & Admin Charts
 * Hỗ trợ vẽ biểu đồ đường doanh thu, tỷ lệ đơn hàng và cơ cấu thể loại.
 * Tương thích giao diện Sáng / Tối (Dark mode).
 */

const chartRenderer = {
    /**
     * Biểu đồ đường doanh thu 12 tháng
     */
    renderRevenueLineChart(canvasId, dataPoints = []) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const parentW = (canvas.parentElement ? canvas.parentElement.clientWidth : 0);
        const width = parentW || canvas.clientWidth || 600;
        const height = 280;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const padding = { top: 38, right: 30, bottom: 35, left: 55 };
        const chartWidth = Math.max(10, width - padding.left - padding.right);
        const chartHeight = Math.max(10, height - padding.top - padding.bottom);

        const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        let values = dataPoints && dataPoints.length ? dataPoints.map(v => Number(v) || 0) : [];
        if (!values.length) {
            values = new Array(12).fill(0);
        }

        // Tự động nhận diện nếu dữ liệu truyền vào tính theo triệu đồng (< 1000)
        const maxRaw = Math.max(...values, 0);
        if (maxRaw > 0 && maxRaw < 1000) {
            values = values.map(v => v * 1e6);
        }

        // Trục dọc chia bước tròn đẹp
        const top = (Math.max(...values, 0) || 1e6) * 1.2;
        const rough = top / 4;
        const mag = 10 ** Math.max(0, Math.floor(Math.log10(rough)));
        const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(v => v >= rough) || rough;
        const gridSteps = Math.ceil(top / step) || 4;
        const maxVal = Math.max(step * gridSteps, 1);

        // Format tiền tệ gọn: "1,5 tr", "500k", "0"
        const fmt = (v) => {
            if (v >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
            if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
            return `${Math.round(v)}`;
        };

        // Theme colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
        const axisColor = isDark ? '#94a3b8' : '#64748b';
        const pointBg = isDark ? '#1e293b' : '#ffffff';

        // Vẽ đường lưới ngang
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = axisColor;
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= gridSteps; i++) {
            const yVal = step * i;
            const yPos = padding.top + chartHeight - (chartHeight / gridSteps) * i;

            ctx.beginPath();
            ctx.moveTo(padding.left, yPos);
            ctx.lineTo(width - padding.right, yPos);
            ctx.stroke();

            ctx.fillText(fmt(yVal), padding.left - 8, yPos + 4);
        }

        // Tính toạ độ các điểm
        const stepX = chartWidth / (months.length - 1);
        const points = months.map((m, idx) => {
            const val = values[idx] || 0;
            const x = padding.left + idx * stepX;
            const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
            return { x, y, val, month: m };
        });

        // Vùng chuyển màu mềm mại dưới đường cong
        const areaGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        areaGrad.addColorStop(0, 'rgba(79, 70, 229, 0.32)');
        areaGrad.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.lineTo(points[0].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Đường biểu đồ chính
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Các điểm tròn và nhãn tháng
        ctx.textAlign = 'center';
        points.forEach((p) => {
            // Điểm tròn
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = pointBg;
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Nhãn tháng ở dưới
            ctx.fillStyle = axisColor;
            ctx.font = '11px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(p.month, p.x, height - 12);

            // Nhãn giá trị phía trên điểm nếu > 0
            if (p.val > 0) {
                ctx.fillStyle = '#818cf8';
                ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
                ctx.strokeStyle = pointBg;
                ctx.lineWidth = 3;
                ctx.strokeText(fmt(p.val), p.x, p.y - 9);
                ctx.fillText(fmt(p.val), p.x, p.y - 9);
            }
        });
    },

    // Alias tương thích
    renderRevenueChart(canvasId, dataPoints = []) {
        return this.renderRevenueLineChart(canvasId, dataPoints);
    },

    /**
     * Biểu đồ tỷ lệ trạng thái đơn hàng (Donut)
     */
    renderOrderStatusDonutChart(canvasId, segments = [], totalLabel = 'Đơn') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const parentW = (canvas.parentElement ? canvas.parentElement.clientWidth : 0);
        const width = parentW || canvas.clientWidth || 300;
        const height = 260;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = (height - 30) / 2;
        const outerRadius = 75;
        const innerRadius = 50;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark');
        const titleColor = isDark ? '#f8fafc' : '#0f172a';
        const subtitleColor = isDark ? '#94a3b8' : '#64748b';

        const data = (segments || []).filter(s => s && s.percent > 0);
        if (!data.length) {
            ctx.fillStyle = subtitleColor;
            ctx.font = '12px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Chưa có dữ liệu đơn', centerX, centerY);
            return;
        }

        let startAngle = -Math.PI / 2;
        data.forEach(item => {
            const sliceAngle = (item.percent / 100) * (Math.PI * 2);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = item.color || '#6366f1';
            ctx.fill();

            startAngle += sliceAngle;
        });

        // Chữ ở tâm donut
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(totalLabel, centerX, centerY - 6);

        ctx.fillStyle = subtitleColor;
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Tỷ Lệ', centerX, centerY + 12);
    },

    /**
     * Biểu đồ cơ cấu thể loại (Donut)
     */
    renderDonutChart(canvasId, segments = [], totalLabel = "Thể Loại") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const parentW = (canvas.parentElement ? canvas.parentElement.clientWidth : 0);
        const width = parentW || canvas.clientWidth || 300;
        const height = 260;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = (height - 30) / 2;
        const outerRadius = 75;
        const innerRadius = 50;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark');
        const titleColor = isDark ? '#f8fafc' : '#0f172a';
        const subtitleColor = isDark ? '#94a3b8' : '#64748b';

        const data = (segments || []).filter(s => s && s.percent > 0);
        if (!data.length) {
            ctx.fillStyle = subtitleColor;
            ctx.font = '12px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Chưa có dữ liệu thể loại', centerX, centerY);
            return;
        }

        let startAngle = -Math.PI / 2;
        data.forEach(item => {
            const sliceAngle = (item.percent / 100) * (Math.PI * 2);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = item.color || '#6366f1';
            ctx.fill();

            startAngle += sliceAngle;
        });

        // Chữ ở tâm donut
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(totalLabel, centerX, centerY - 6);

        ctx.fillStyle = subtitleColor;
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Cơ Cấu', centerX, centerY + 12);
    },

    // Alias tương thích
    renderCategoryDonutChart(canvasId, segments = [], totalLabel = "Thể Loại") {
        return this.renderDonutChart(canvasId, segments, totalLabel);
    }
};
