/**
 * FAVORITE GENRES ONBOARDING & SELECTION MODAL (Popup chọn 5 thể loại yêu thích)
 * Cho phép người dùng chọn tối đa 5 thể loại để gợi ý sách AI cá nhân hóa.
 */

const favoriteGenresModal = {
    selectedIds: [],
    loading: false,

    async init() {
        this.selectedIds = (store.getFavoriteCategories() || []).map(String);
        this.render();
    },

    async open() {
        if (!app.requireLogin('Vui lòng đăng nhập để chọn thể loại yêu thích!')) return;

        modalManager.open('favorite-genres-modal');

        const listContainer = document.getElementById('favorite-genres-list');

        // Nếu danh mục trong store đang trống, hiển thị spinner và tự động tải lại
        let categories = store.getCategories();
        if (!categories || categories.length === 0) {
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="text-center py-8 text-muted" style="grid-column: 1 / -1; width: 100%;">
                        <div class="spinner-ring" style="margin: 0 auto;"></div>
                        <p class="mt-3 text-xs">Đang tải danh sách thể loại sách...</p>
                    </div>`;
            }
            try {
                await store.reloadCategories();
                categories = store.getCategories();
            } catch (err) {
                console.error('Không thể tải danh mục:', err);
                if (listContainer) {
                    listContainer.innerHTML = `
                        <div class="text-center py-6 text-danger" style="grid-column: 1 / -1; width: 100%;">
                            <i class="fa-solid fa-triangle-exclamation mb-2 text-xl"></i>
                            <p class="text-sm">Không thể tải danh sách thể loại.</p>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="favoriteGenresModal.open()">
                                <i class="fa-solid fa-rotate-right mr-1"></i> Thử Lại
                            </button>
                        </div>`;
                }
                return;
            }
        }

        // Tải thể loại yêu thích đã lưu nếu có
        try {
            if (!store.getFavoriteCategories() || store.getFavoriteCategories().length === 0) {
                const favCats = await ApiService.users.favoriteCategories();
                store.favoriteCategoryIds = (favCats || []).map(c => String(c.id));
            }
        } catch (e) {
            console.warn('Chưa lấy được thể loại yêu thích:', e);
        }

        this.selectedIds = (store.getFavoriteCategories() || []).map(String);
        this.render();
    },

    render() {
        const listContainer = document.getElementById('favorite-genres-list');
        if (!listContainer) return;

        const categories = store.getCategories() || [];
        if (categories.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-6 text-muted" style="grid-column: 1 / -1; width: 100%;">
                    <p class="text-sm">Không tìm thấy thể loại nào.</p>
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="favoriteGenresModal.open()">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Tải Lại
                    </button>
                </div>`;
            this.updateCounter();
            return;
        }

        listContainer.innerHTML = categories.map(cat => {
            const catIdStr = String(cat.id);
            const isSelected = this.selectedIds.includes(catIdStr);
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
        const idStr = String(catId);
        if (this.selectedIds.includes(idStr)) {
            this.selectedIds = this.selectedIds.filter(id => id !== idStr);
        } else {
            if (this.selectedIds.length >= 5) {
                appToast.warning('Bạn chỉ có thể chọn tối đa 5 thể loại yêu thích!', 'Giới Hạn');
                return;
            }
            this.selectedIds.push(idStr);
        }

        this.render();
    },

    clearAll() {
        this.selectedIds = [];
        this.render();
    },

    updateCounter() {
        const countSpan = document.getElementById('fav-selected-count');
        const progressBar = document.getElementById('fav-progress-fill');
        const saveBtn = document.getElementById('btn-save-favorites');
        const clearBtn = document.getElementById('btn-clear-all-favs');

        const count = this.selectedIds.length;
        if (countSpan) countSpan.textContent = count;
        if (progressBar) progressBar.style.width = `${(count / 5) * 100}%`;

        if (clearBtn) {
            clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';
        }

        if (saveBtn) {
            saveBtn.disabled = false;
            if (count === 0) {
                saveBtn.innerHTML = '<i class="fa-solid fa-eraser mr-1"></i> Xóa Hết & Lưu Sở Thích';
                saveBtn.classList.remove('animate-pulse');
            } else {
                saveBtn.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Lưu Sở Thích (${count}/5) & Xem Gợi Ý`;
                if (count === 5) {
                    saveBtn.classList.add('animate-pulse');
                } else {
                    saveBtn.classList.remove('animate-pulse');
                }
            }
        }
    },

    async save() {
        const count = this.selectedIds.length;
        const saveBtn = document.getElementById('btn-save-favorites');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<div class="spinner-ring spinner-ring-sm mr-1"></div> Đang lưu...';
        }

        try {
            await store.saveFavoriteCategories(this.selectedIds);
            if (count > 0) {
                appToast.success(`Đã lưu ${count} thể loại sở thích! Gợi ý sách đã được cập nhật.`, 'Thành Công');
            } else {
                appToast.info('Đã xóa hết thể loại sở thích.', 'Thông Báo');
            }
            modalManager.close('favorite-genres-modal');

            // Cập nhật lại giao diện trang hiện tại
            const hash = window.location.hash;
            if (hash.includes('recommendations') || hash === '' || hash === '#/' || hash.includes('profile')) {
                app.route();
            }
        } catch (err) {
            appToast.error(err.message || 'Không thể lưu thể loại yêu thích.');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                this.updateCounter();
            }
        }
    },

    skip() {
        modalManager.close('favorite-genres-modal');
    }
};
