/**
 * FAVORITE GENRES ONBOARDING & SELECTION MODAL (Popup chọn 5 thể loại yêu thích)
 * Allows users to choose their favorite 5 genres to customize AI book recommendations.
 */

const favoriteGenresModal = {
    selectedIds: [],

    init() {
        this.selectedIds = [...store.getFavoriteCategories()];
        this.render();
    },

    open() {
        if (!app.requireLogin('Vui lòng đăng nhập để chọn thể loại yêu thích!')) return;
        this.selectedIds = [...store.getFavoriteCategories()];
        this.render();
        modalManager.open('favorite-genres-modal');
    },

    render() {
        const listContainer = document.getElementById('favorite-genres-list');
        if (!listContainer) return;

        const categories = store.getCategories();
        listContainer.innerHTML = categories.map(cat => {
            const isSelected = this.selectedIds.includes(cat.id);
            return `
                <div class="genre-select-card ${isSelected ? 'selected' : ''}" 
                     data-cat-id="${cat.id}" 
                     onclick="favoriteGenresModal.toggleCategory('${cat.id}')">
                    <span class="check-badge"><i class="fa-solid fa-check"></i></span>
                    <div class="genre-icon"><i class="${cat.icon || 'fa-solid fa-book'}"></i></div>
                    <div class="genre-name">${esc(cat.name)}</div>
                </div>
            `;
        }).join('');

        this.updateCounter();
    },

    toggleCategory(catId) {
        if (this.selectedIds.includes(catId)) {
            this.selectedIds = this.selectedIds.filter(id => id !== catId);
        } else {
            if (this.selectedIds.length >= 5) {
                appToast.warning('Bạn chỉ có thể chọn tối đa 5 thể loại yêu thích!', 'Giới Hạn');
                return;
            }
            this.selectedIds.push(catId);
        }

        this.render();
    },

    updateCounter() {
        const countSpan = document.getElementById('fav-selected-count');
        const progressBar = document.getElementById('fav-progress-fill');
        const saveBtn = document.getElementById('btn-save-favorites');

        const count = this.selectedIds.length;
        if (countSpan) countSpan.textContent = count;
        if (progressBar) progressBar.style.width = `${(count / 5) * 100}%`;

        if (saveBtn) {
            saveBtn.disabled = count === 0;
            if (count === 5) {
                saveBtn.classList.add('animate-pulse');
            } else {
                saveBtn.classList.remove('animate-pulse');
            }
        }
    },

    async save() {
        if (this.selectedIds.length === 0) {
            appToast.warning('Vui lòng chọn ít nhất 1 thể loại bạn quan tâm!', 'Thông Báo');
            return;
        }

        try {
            await store.saveFavoriteCategories(this.selectedIds);
            appToast.success('Đã lưu 5 thể loại sở thích! Gợi ý sách đã được cập nhật.', 'Thành Công');
            modalManager.close('favorite-genres-modal');

            // If user is currently on recommendations or home page, re-render
            const hash = window.location.hash;
            if (hash.includes('recommendations') || hash === '' || hash === '#/') {
                app.route();
            }
        } catch (err) {
            appToast.error(err.message || 'Không thể lưu thể loại yêu thích.');
        }
    },

    skip() {
        modalManager.close('favorite-genres-modal');
    }
};
