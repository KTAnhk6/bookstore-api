/**
 * MODAL MANAGER COMPONENT
 * Handles opening, closing, animations, Quick View overlays, and confirm dialogs.
 */

const modalManager = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    confirm(options = {}) {
        const {
            title = 'Xác Nhận Hành Động',
            message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
            confirmText = 'Xác Nhận',
            cancelText = 'Huỷ Bỏ',
            confirmClass = 'btn-danger',
            onConfirm = () => {}
        } = options;

        const modalHtml = `
            <div id="dynamic-confirm-modal" class="modal-overlay">
                <div class="modal-dialog modal-sm">
                    <div class="modal-header">
                        <h4 class="modal-title font-bold">${title}</h4>
                        <button class="modal-close-btn" onclick="modalManager.closeDynamic('dynamic-confirm-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body text-sm">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost btn-sm" onclick="modalManager.closeDynamic('dynamic-confirm-modal')">${cancelText}</button>
                        <button class="btn ${confirmClass} btn-sm" id="btn-dynamic-confirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        // Remove old if any
        this.closeDynamic('dynamic-confirm-modal');

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml;
        document.body.appendChild(wrapper.firstElementChild);

        document.getElementById('btn-dynamic-confirm').addEventListener('click', () => {
            this.closeDynamic('dynamic-confirm-modal');
            onConfirm();
        });
    },

    closeDynamic(modalId) {
        const el = document.getElementById(modalId);
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
            document.body.style.overflow = '';
        }
    },

    openQuickView(bookId) {
        const book = store.getBook(bookId);
        if (!book) return;

        const modal = document.getElementById('quick-view-modal');
        const body = document.getElementById('quick-view-body');
        document.getElementById('quick-view-title').textContent = book.title;

        body.innerHTML = `
            <div class="d-grid" style="grid-template-columns: 280px 1fr; gap: 2rem;">
                <div class="quick-view-img-box" style="border-radius: var(--radius-md); overflow: hidden; background: var(--bg-subtle);">
                    <img src="${book.coverImage}" alt="${esc(book.title)}" style="width: 100%; height: 360px; object-fit: cover;">
                </div>
                <div class="d-flex flex-column">
                    <span class="badge badge-primary mb-2" style="width: fit-content;">${book.categoryName}</span>
                    <h3 class="text-xl font-bold mb-1">${esc(book.title)}</h3>
                    <p class="text-sm text-muted mb-3"><i class="fa-solid fa-feather mr-1"></i> Tác giả: <strong>${esc(book.authorName)}</strong> | NXB: ${esc(book.publisherName)}</p>
                    
                    <div class="d-flex items-center gap-2 mb-3">
                        <div class="star-rating">
                            <i class="fa-solid fa-star"></i>
                            <span class="font-bold text-sm ml-1">${book.rating}</span>
                        </div>
                        <span class="text-xs text-muted">(${book.reviewCount} đánh giá • ${book.soldCount} đã bán)</span>
                    </div>

                    <div class="d-flex items-baseline gap-2 mb-4">
                        <span class="text-2xl font-bold text-primary">${store.formatCurrency(book.price)}</span>
                        ${book.originalPrice ? `<span class="text-sm text-muted" style="text-decoration: line-through;">${store.formatCurrency(book.originalPrice)}</span>` : ''}
                        ${book.discountPercent ? `<span class="badge badge-danger">-${book.discountPercent}%</span>` : ''}
                    </div>

                    <p class="text-sm text-muted mb-4" style="line-height: 1.6; max-height: 100px; overflow-y: auto;">
                        ${esc(book.description) || 'Chưa có mô tả.'}
                    </p>

                    <div class="d-flex items-center gap-3 mt-auto pt-3" style="border-top: 1px solid var(--border-subtle);">
                        <div class="quantity-spinner">
                            <button class="qty-btn" onclick="const input = document.getElementById('qv-qty'); if(input.value > 1) input.value--;">-</button>
                            <input type="number" id="qv-qty" class="qty-input" value="1" min="1" max="${book.stock}">
                            <button class="qty-btn" onclick="const input = document.getElementById('qv-qty'); if(input.value < ${book.stock}) input.value++;">+</button>
                        </div>
                        <button class="btn btn-primary flex-1" onclick="
                            const qty = parseInt(document.getElementById('qv-qty').value) || 1;
                            app.addToCart('${book.id}', qty).then(ok => ok && modalManager.close('quick-view-modal'));
                        ">
                            <i class="fa-solid fa-cart-plus mr-1"></i> Thêm Giỏ Hàng
                        </button>
                        <a href="#/book/${book.id}" class="btn btn-ghost" onclick="modalManager.close('quick-view-modal')">
                            Chi tiết đầy đủ <i class="fa-solid fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        this.open('quick-view-modal');
    }
};
