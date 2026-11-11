// Ô chọn Tỉnh/Thành phố -> Phường/Xã từ danh sách hành chính thật (2 cấp, 34 tỉnh/thành).
// Mỗi <select> vẫn giữ giá trị đã chọn (đọc bằng .value như cũ), còn người dùng thao tác trên
// một ô gõ để lọc nhanh, không cần dấu ("ha noi" ra "Thành phố Hà Nội").
const addressPicker = {
    data: null,

    async load() {
        if (!this.data) {
            const res = await fetch('data/vn-divisions.json');
            this.data = await res.json();
        }
        return this.data;
    },

    options(placeholder, names, selected) {
        // Địa chỉ cũ lưu trước đây có thể không nằm trong danh sách: vẫn giữ để không mất dữ liệu
        const list = selected && !names.includes(selected) ? [selected, ...names] : names;
        return `<option value="">${placeholder}</option>` + list.map(n =>
            `<option value="${esc(n)}"${n === selected ? ' selected' : ''}>${esc(n)}</option>`).join('');
    },

    fold(text) {
        return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
    },

    // Từ khoá khớp khi nó mở đầu một từ của tên ("ho" ra "Hồ Chí Minh", không ra "phố").
    // Gõ không dấu thì bỏ qua dấu; đã gõ dấu thì phải khớp đúng dấu ("hồ" không ra "Hố", "Hò").
    matches(name, query) {
        const q = query.normalize('NFC').toLowerCase().trim();
        const accented = this.fold(q) !== q;
        const norm = (t) => ' ' + (accented ? t.normalize('NFC').toLowerCase() : this.fold(t));
        return norm(name).includes(' ' + (accented ? q : this.fold(q)));
    },

    // Gắn ô gõ tìm kiếm lên một <select> (chỉ làm một lần cho mỗi select); trả về hàm đồng bộ
    // lại ô gõ sau khi code đổi giá trị / trạng thái disabled của select.
    combo(select) {
        if (select._sync) return select._sync;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.autocomplete = 'off';
        const list = document.createElement('ul');
        list.className = 'combo-list';
        list.hidden = true;
        select.style.display = 'none';
        select.required = false;
        select.after(input);
        // select cũ (trang đã vẽ lại) không còn trong DOM -> dọn danh sách của nó
        document.querySelectorAll('.combo-list').forEach(l => { if (!document.contains(l._owner)) l.remove(); });
        list._owner = select;
        document.body.appendChild(list);

        let items = [];
        let active = -1;
        const label = () => select.options[select.selectedIndex]?.value ? select.value : '';

        const sync = () => {
            input.value = label();
            input.disabled = select.disabled;
            input.placeholder = select.options[0]?.text || '';
        };
        const close = () => { list.hidden = true; };
        const choose = (name) => {
            select.value = name;
            select.dispatchEvent(new Event('change'));
            sync();
            close();
        };
        const highlight = (i) => {
            active = i;
            [...list.children].forEach((li, idx) => li.classList.toggle('active', idx === i));
            list.children[i]?.scrollIntoView({ block: 'nearest' });
        };
        const open = (filter) => {
            items = [...select.options].slice(1).map(o => o.value).filter(n => this.matches(n, filter));
            list.innerHTML = items.length
                ? items.map(n => `<li data-v="${esc(n)}" class="${n === select.value ? 'selected' : ''}">${esc(n)}</li>`).join('')
                : '<li class="empty">Không tìm thấy kết quả</li>';
            const r = input.getBoundingClientRect();
            const below = window.innerHeight - r.bottom;
            list.style.left = `${r.left}px`;
            list.style.width = `${r.width}px`;
            list.style.top = below >= 200 || below >= r.top ? `${r.bottom + 4}px` : '';
            list.style.bottom = below >= 200 || below >= r.top ? '' : `${window.innerHeight - r.top + 4}px`;
            list.hidden = false;
            highlight(items.length ? Math.max(items.indexOf(select.value), 0) : -1);
        };

        input.addEventListener('focus', () => { input.select(); open(''); });
        input.addEventListener('input', () => open(input.value));
        input.addEventListener('blur', () => { sync(); close(); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (list.hidden) open('');
                else if (items.length) highlight((active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
            } else if (e.key === 'Enter') {
                e.preventDefault(); // không submit form khi đang chọn
                if (!list.hidden && items[active]) choose(items[active]);
            } else if (e.key === 'Escape') {
                close();
            }
        });
        // mousedown (không phải click) để chạy trước khi ô gõ mất focus
        list.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const li = e.target.closest('li[data-v]');
            if (li) choose(li.dataset.v);
        });
        // danh sách dùng position: fixed nên đóng lại khi trang/modal cuộn để khỏi lệch khỏi ô
        window.addEventListener('scroll', (e) => { if (e.target !== list) close(); }, true);

        select._sync = sync;
        sync();
        return sync;
    },

    // Điền hai thẻ <select>; selected = { province, ward } để chọn sẵn giá trị đã lưu
    async attach(provinceId, wardId, selected = {}) {
        const provinceEl = document.getElementById(provinceId);
        const wardEl = document.getElementById(wardId);
        if (!provinceEl || !wardEl) return;
        const data = await this.load();
        const syncProvince = this.combo(provinceEl);
        const syncWard = this.combo(wardEl);

        const fillWards = (ward) => {
            const province = data.find(p => p.n === provinceEl.value);
            wardEl.innerHTML = this.options(province ? 'Chọn phường / xã' : 'Chọn tỉnh / thành phố trước',
                province ? province.w : [], ward);
            wardEl.disabled = !province;
            syncWard();
        };

        provinceEl.innerHTML = this.options('Chọn tỉnh / thành phố', data.map(p => p.n), selected.province);
        provinceEl.onchange = () => fillWards('');
        syncProvince();
        fillWards(selected.ward);
    }
};
