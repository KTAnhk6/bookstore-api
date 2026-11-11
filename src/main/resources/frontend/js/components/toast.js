/**
 * TOAST NOTIFICATION COMPONENT
 * Beautiful, floating glassmorphic alerts with auto-dismiss and progress timers.
 */

const appToast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
    },

    show(message, type = 'info', title = '', duration = 4000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;

        const icons = {
            success: 'fa-solid fa-circle-check',
            error: 'fa-solid fa-circle-exclamation',
            warning: 'fa-solid fa-triangle-exclamation',
            info: 'fa-solid fa-circle-info'
        };

        const defaultTitles = {
            success: 'Thành Công',
            error: 'Đã Có Lỗi',
            warning: 'Lưu Ý',
            info: 'Thông Báo'
        };

        const displayTitle = title || defaultTitles[type] || 'Thông Báo';

        toast.innerHTML = `
            <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${displayTitle}</div>
                <div class="toast-msg">${message}</div>
            </div>
            <button class="toast-close" title="Đóng"><i class="fa-solid fa-xmark"></i></button>
            <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        this.container.appendChild(toast);

        // Auto dismiss after duration
        const timer = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        toast.dataset.timerId = timer;
    },

    dismiss(toastElement) {
        if (!toastElement) return;
        toastElement.classList.add('toast-leave');
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    },

    success(msg, title) { this.show(msg, 'success', title); },
    error(msg, title) { this.show(msg, 'error', title); },
    warning(msg, title) { this.show(msg, 'warning', title); },
    info(msg, title) { this.show(msg, 'info', title); }
};
