/**
 * HD CANVAS CHART RENDERER (Pure Vanilla JS)
 * Renders smooth curved Area/Line Charts and Donut Charts for Admin Dashboard.
 */

const chartRenderer = {
    renderRevenueLineChart(canvasId, dataPoints = []) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 500;
        const height = 260;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 30, right: 20, bottom: 40, left: 45 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        const values = dataPoints.length ? dataPoints : [45, 52, 60, 58, 72, 85, 94, 110, 105, 118, 124, 138];
        const maxVal = Math.max(...values) * 1.15;

        // Draw horizontal grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';

        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const yVal = (maxVal / gridSteps) * i;
            const yPos = padding.top + chartHeight - (chartHeight / gridSteps) * i;

            ctx.beginPath();
            ctx.moveTo(padding.left, yPos);
            ctx.lineTo(width - padding.right, yPos);
            ctx.stroke();

            ctx.fillText(Math.round(yVal) + ' tr', padding.left - 8, yPos + 4);
        }

        // Calculate Points
        const points = values.map((val, index) => {
            const x = padding.left + (chartWidth / (values.length - 1)) * index;
            const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
            return { x, y, val, month: months[index] };
        });

        // Area Gradient
        const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        areaGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        areaGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        // Draw Area Fill
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Draw Smooth Line
        ctx.beginPath();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Draw Dots and Labels
        ctx.textAlign = 'center';
        points.forEach((p, idx) => {
            // Dot Outer
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Month Label
            ctx.fillStyle = '#64748b';
            ctx.fillText(p.month, p.x, height - 12);
        });
    },

    renderCategoryDonutChart(canvasId, segments = []) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 300;
        const height = 260;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = (height - 40) / 2;
        const outerRadius = 80;
        const innerRadius = 50;

        const defaultSegments = [
            { label: "Công Nghệ IT", percent: 35, color: "#4f46e5" },
            { label: "Tâm Lý Kỹ Năng", percent: 25, color: "#06b6d4" },
            { label: "Kinh Tế", percent: 20, color: "#f59e0b" },
            { label: "Văn Học", percent: 12, color: "#10b981" },
            { label: "Khác", percent: 8, color: "#8b5cf6" }
        ];

        const data = segments.length ? segments : defaultSegments;
        let startAngle = -Math.PI / 2;

        data.forEach(item => {
            const sliceAngle = (item.percent / 100) * (Math.PI * 2);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = item.color;
            ctx.fill();

            startAngle += sliceAngle;
        });

        // Center Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('100%', centerX, centerY - 8);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Cơ Cấu', centerX, centerY + 10);
    },

    renderOrderStatusDonutChart(canvasId, segments = [], totalLabel = 'Đơn') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 300;
        const height = 260;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = (height - 40) / 2;
        const outerRadius = 80;
        const innerRadius = 50;

        const data = segments.filter(s => s.percent > 0);
        if (!data.length) {
            ctx.fillStyle = '#94a3b8';
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

            ctx.fillStyle = item.color;
            ctx.fill();

            startAngle += sliceAngle;
        });

        // Center Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(totalLabel, centerX, centerY - 6);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Tỷ Lệ', centerX, centerY + 12);
    }
};
