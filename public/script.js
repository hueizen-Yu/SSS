document.addEventListener('DOMContentLoaded', () => {
    // Pages
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    const formPage = document.getElementById('form-page');
    const listPage = document.getElementById('list-page');
    const detailPage = document.getElementById('detail-page');
    const managePage = document.getElementById('manage-page');
    const usersPage = document.getElementById('users-page');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const healthForm = document.getElementById('health-form');
    const productForm = document.getElementById('product-form');
    const editForm = document.getElementById('edit-form');

    // Containers
    const productContainer = document.getElementById('product-container');
    const manageProductsBody = document.getElementById('manage-products-body');
    const recordsBody = document.getElementById('records-body');
    const editItemsContainer = document.getElementById('edit-items-container');

    // Modals
    const productModal = document.getElementById('product-modal');
    const editModal = document.getElementById('edit-modal');

    // Buttons
    const viewRecordsBtn = document.getElementById('view-records-btn');
    const submitBtn      = document.getElementById('submit-btn');
    const backBtn = document.getElementById('back-btn');
    const backToFormBtn = document.getElementById('back-to-form-btn');
    const adminManageBtn = document.getElementById('admin-manage-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const backToFormFromManage = document.getElementById('back-to-form-from-manage');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const setFormTitleInput = document.getElementById('set-form-title');
    const formTitleH1 = document.getElementById('form-title');
    const guestLoginBtn  = document.getElementById('guest-login-btn');
    const userNav        = document.getElementById('user-nav');
    const userDisplayName = document.getElementById('user-display-name');

    const logoutBtns = [
        document.getElementById('logout-btn-form')
    ];

    // Profile & Users
    const profileModal = document.getElementById('profile-modal');
    const profileForm  = document.getElementById('profile-form');
    const userDisplayBtn = document.getElementById('user-display');
    const viewUsersBtn = document.getElementById('view-users-btn');
    const backToManageBtn = document.getElementById('back-to-manage-btn');
    const exportUsersExcelBtn = document.getElementById('export-users-excel-btn');

    // Detect In-App Browsers for Google Login
    const googleLoginBtns = document.querySelectorAll('a[href="/api/auth/google"]');
    googleLoginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            // Check for FB, IG, LINE, Messenger
            const isInApp = (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1) || (ua.indexOf('Instagram') > -1) || (ua.indexOf('Line') > -1);
            if (isInApp) {
                e.preventDefault();
                alert('⚠️ 系統偵測到您正在使用 APP 內建瀏覽器。\n\n由於 Google 安全政策限制，無法在此環境登入 (錯誤 403)。\n\n👉 請點擊畫面右上角或右下角的「選單」按鈕，選擇「以預設瀏覽器開啟」或「在 Safari / Chrome 開啟」，即可正常登入！');
                
                // For LINE, try forcing external browser param
                if (ua.indexOf('Line') > -1 && window.location.search.indexOf('openExternalBrowser=1') === -1) {
                    window.location.href = window.location.href + (window.location.href.indexOf('?') > -1 ? '&' : '?') + 'openExternalBrowser=1';
                }
            }
        });
    });

    // State
    let products = [];
    let records = []; // Global records storage
    let selectedItems = {}; // { product_id: quantity }
    let currentPage = 1;
    const itemsPerPage = 5;

    // Helper: Hex to RGBA
    function hexToRgba(hex, alpha) {
        if (!hex || hex[0] !== '#') return `rgba(0,0,0,${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Helper: Show Page
    function showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        page.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Helper: Get Auth Headers
    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        };
    }

    function showVerificationUI() {
        showPage(registerPage);
        const regForm = document.getElementById('register-form');
        const verifySection = document.getElementById('verify-code-section');
        if (regForm) regForm.style.display = 'none';
        if (verifySection) verifySection.style.display = 'block';
        const regFooter = document.getElementById('register-footer-links');
        const verifyFooter = document.getElementById('verify-footer-links');
        if (regFooter) regFooter.style.display = 'none';
        if (verifyFooter) verifyFooter.style.display = 'block';
    }

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            const settings = await res.json();
            if (settings.form_title) {
                const cleanTitle = settings.form_title.replace(/[|\n]/g, '');
                const htmlTitle  = settings.form_title.replace(/[|\n]/g, '<br>');
                
                formTitleH1.innerHTML = htmlTitle;
                setFormTitleInput.value = settings.form_title;
                document.title = cleanTitle;
                
                const loginTitle = document.getElementById('login-title');
                const registerTitle = document.getElementById('register-title');
                if (loginTitle) loginTitle.innerHTML = htmlTitle;
                if (registerTitle) registerTitle.innerHTML = htmlTitle;
            }
            if (settings.form_title_color) {
                formTitleH1.style.color = settings.form_title_color;
                formTitleH1.style.textShadow = `0 0 10px ${settings.form_title_color}66`;
                document.getElementById('set-form-title-color').value = settings.form_title_color;
            }
            if (settings.site_bg_color) {
                document.documentElement.style.setProperty('--bg-dark', settings.site_bg_color);
                document.getElementById('set-site-bg-color').value = settings.site_bg_color;
            }
            if (settings.card_bg_color) {
                const rgbaValue = hexToRgba(settings.card_bg_color, 0.75);
                document.documentElement.style.setProperty('--glass-bg', rgbaValue);
                document.getElementById('set-card-bg-color').value = settings.card_bg_color;
            }
            if (settings.subtitle_color) {
                document.documentElement.style.setProperty('--subtitle-color', settings.subtitle_color);
                document.getElementById('set-subtitle-color').value = settings.subtitle_color;
            }
            if (settings.table_th_color) {
                document.documentElement.style.setProperty('--table-th-color', settings.table_th_color);
                document.getElementById('set-table-th-color').value = settings.table_th_color;
            }
            if (settings.table_td_color) {
                document.documentElement.style.setProperty('--table-td-color', settings.table_td_color);
                document.getElementById('set-table-td-color').value = settings.table_td_color;
            }
            if (settings.text_general_color) {
                document.documentElement.style.setProperty('--text-general', settings.text_general_color);
                document.getElementById('set-text-general-color').value = settings.text_general_color;
            }
            if (settings.btn_text_color) {
                document.documentElement.style.setProperty('--btn-text-color', settings.btn_text_color);
                document.getElementById('set-btn-text-color').value = settings.btn_text_color;
            }
            if (settings.btn_hover_text_color) {
                document.documentElement.style.setProperty('--btn-hover-text-color', settings.btn_hover_text_color);
                document.getElementById('set-btn-hover-text-color').value = settings.btn_hover_text_color;
            }
            if (settings.form_title_size) {
                document.documentElement.style.setProperty('--title-size-desktop', settings.form_title_size);
                document.getElementById('set-form-title-size').value = settings.form_title_size;
            }
            if (settings.form_title_size_mobile) {
                document.documentElement.style.setProperty('--title-size-mobile', settings.form_title_size_mobile);
                document.getElementById('set-form-title-size-mobile').value = settings.form_title_size_mobile;
            }
            if (settings.form_title_bold === 'true') {
                formTitleH1.style.fontWeight = 'bold';
                document.getElementById('set-form-title-bold').checked = true;
            } else if (settings.form_title_bold === 'false') {
                formTitleH1.style.fontWeight = 'normal';
                document.getElementById('set-form-title-bold').checked = false;
            }
            if (settings.form_title_italic === 'true') {
                formTitleH1.style.fontStyle = 'italic';
                document.getElementById('set-form-title-italic').checked = true;
            } else if (settings.form_title_italic === 'false') {
                formTitleH1.style.fontStyle = 'normal';
                document.getElementById('set-form-title-italic').checked = false;
            }

            const ogDescInput = document.getElementById('set-og-description');
            if (ogDescInput && settings.og_description !== undefined) {
                ogDescInput.value = settings.og_description || '';
            }
            const qtyLimitInput = document.getElementById('set-quantity-limit');
            if (qtyLimitInput && settings.quantity_limit !== undefined) {
                qtyLimitInput.value = settings.quantity_limit || '0';
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    }

    saveSettingsBtn.addEventListener('click', async () => {
        const newTitle = setFormTitleInput.value;
        const color = document.getElementById('set-form-title-color').value;
        const subtitleColor = document.getElementById('set-subtitle-color').value;
        const thColor = document.getElementById('set-table-th-color').value;
        const tdColor = document.getElementById('set-table-td-color').value;
        const siteBg = document.getElementById('set-site-bg-color').value;
        const cardBg = document.getElementById('set-card-bg-color').value;
        const sizeDesktop = document.getElementById('set-form-title-size').value;
        const sizeMobile = document.getElementById('set-form-title-size-mobile').value;
        const bold = document.getElementById('set-form-title-bold').checked ? 'true' : 'false';
        const italic = document.getElementById('set-form-title-italic').checked ? 'true' : 'false';
        const btnTextColor = document.getElementById('set-btn-text-color').value;
        const btnHoverColor = document.getElementById('set-btn-hover-text-color').value;
        const textGeneralColor = document.getElementById('set-text-general-color').value;
        console.log('Attempting to save new title:', newTitle);
        try {
            await Promise.all([
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title', value: newTitle }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title_color', value: color }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'subtitle_color', value: subtitleColor }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'table_th_color', value: thColor }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'table_td_color', value: tdColor }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'site_bg_color', value: siteBg }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'card_bg_color', value: cardBg }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title_size', value: sizeDesktop }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title_size_mobile', value: sizeMobile }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title_bold', value: bold }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'form_title_italic', value: italic }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'btn_text_color', value: btnTextColor }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'btn_hover_text_color', value: btnHoverColor }) }),
                fetch('/api/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key: 'text_general_color', value: textGeneralColor }) })
            ]);
            alert('設定已儲存！');
            fetchSettings();
        } catch (err) {
            alert('儲存設定失敗');
        }
    });

    document.getElementById('save-og-desc-btn')?.addEventListener('click', async () => {
        const newDesc = document.getElementById('set-og-description').value;
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ key: 'og_description', value: newDesc })
            });
            if (res.ok) {
                alert('描述已儲存！請重新分享連結以更新預覽。');
            }
        } catch (err) {
            alert('儲存失敗');
        }
    });

    document.getElementById('save-quantity-limit-btn')?.addEventListener('click', async () => {
        const newLimit = document.getElementById('set-quantity-limit').value;
        if (newLimit === '' || isNaN(parseInt(newLimit)) || parseInt(newLimit) < 0) {
            alert('請輸入有效的數字（0 表示無限制）');
            return;
        }
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ key: 'quantity_limit', value: String(parseInt(newLimit)) })
            });
            if (res.ok) {
                alert('數量上限已儲存！');
            } else {
                const d = await res.json();
                alert('儲存失敗：' + (d.error || '未知錯誤'));
            }
        } catch (err) {
            alert('儲存失敗');
        }
    });

    // --- Product Fetch & Render ---

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            products = await res.json();
            renderProducts();
            if (sessionStorage.getItem('isAdmin') === 'true') {
                renderManageProducts();
            }
        } catch (err) {
            console.error('Failed to fetch products', err);
        }
    }

    function renderProducts() {
        productContainer.innerHTML = '';
        const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageProducts = products.slice(start, end);

        pageProducts.forEach(prod => {
            const isChecked = !!selectedItems[prod.product_id];
            const qty = selectedItems[prod.product_id] || 1;
            const maxQtyNum = prod.max_qty && prod.max_qty > 0 ? prod.max_qty : null;
            const limitHint = maxQtyNum ? `<div style="font-size: 11px; color: #f59e0b; margin-top: 4px; text-align: center; width: 100%;">訂購上限 ${maxQtyNum}</div>` : '';

            const card = document.createElement('div');
            card.className = `product-item ${isChecked ? 'selected' : ''}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 200px;">
                        <input type="checkbox" id="check-${prod.product_id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; flex-shrink: 0; accent-color: var(--primary);">
                        <img src="${prod.image_path || 'images/placeholder.png'}" alt="${prod.name}" class="view-detail-btn" data-id="${prod.id}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span class="product-name view-detail-text" style="font-size: 1.2rem; font-weight: 600; cursor: pointer; color: ${prod.name_color || '#fff'};" data-id="${prod.id}" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='${prod.name_color || '#fff'}'">${prod.name}</span>
                            <span style="font-size: 0.9rem; color: ${prod.short_desc_color || 'var(--text-muted)'}; display: block; margin-top: 4px; max-width: 300px; white-space: normal;">${prod.short_desc || ''}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px; width: 100%; max-width: 260px;">
                        <div style="display: flex; align-items: center; gap: 15px; justify-content: flex-end; width: 100%;">
                            <div style="display: flex; align-items: center; gap: 6px; width: 130px;">
                                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; width: 100%;">
                                    <button type="button" class="qty-btn qty-minus" style="width: 32px; height: 32px; background: transparent; border: none; color: #fff; cursor: pointer; transition: background 0.15s; font-size: 1.1rem; flex-shrink: 0;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">−</button>
                                    <input type="number" id="qty-${prod.product_id}" value="${qty}" min="1" ${maxQtyNum ? `max="${maxQtyNum}"` : ''} class="qty-input" style="flex: 1; min-width: 30px; text-align: center; background: transparent; border: none; color: #fff; font-size: 1rem; font-weight: 600; padding: 0; -moz-appearance: textfield;" oninvalid="this.setCustomValidity('超過訂購上限')" oninput="this.setCustomValidity('')">
                                    <button type="button" class="qty-btn qty-plus" style="width: 32px; height: 32px; background: transparent; border: none; color: #fff; cursor: pointer; transition: background 0.15s; font-size: 1.1rem; flex-shrink: 0;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">+</button>
                                </div>
                            </div>
                            <span style="color: ${prod.price_color || 'var(--primary)'}; font-weight: 700; font-size: 1.3rem; width: 100px; text-align: right; text-shadow: 0 0 5px rgba(0, 240, 255, 0.3); flex-shrink: 0;">$${Number(prod.price || 0).toLocaleString()}</span>
                        </div>
                        ${limitHint}
                    </div>
                </div>
            `;

            // Event: Card Selection
            const checkbox = card.querySelector('input[type="checkbox"]');
            const qtyInput = card.querySelector('.qty-input');
            const minusBtn = card.querySelector('.qty-minus');
            const plusBtn  = card.querySelector('.qty-plus');

            function getClampedVal() {
                let val = parseInt(qtyInput.value) || 1;
                if (val < 1) val = 1;
                if (maxQtyNum && val > maxQtyNum) val = maxQtyNum;
                return val;
            }

            function updatePlusBtn() {
                if (maxQtyNum) {
                    const cur = getClampedVal();
                    plusBtn.disabled = cur >= maxQtyNum;
                    plusBtn.style.opacity = cur >= maxQtyNum ? '0.35' : '1';
                    plusBtn.style.cursor  = cur >= maxQtyNum ? 'not-allowed' : 'pointer';
                }
            }

            function syncSelected() {
                const val = getClampedVal();
                qtyInput.value = val;
                if (checkbox.checked) selectedItems[prod.product_id] = val;
                updatePlusBtn();
            }

            minusBtn.addEventListener('click', () => {
                let val = (parseInt(qtyInput.value) || 1) - 1;
                if (val < 1) val = 1;
                qtyInput.value = val;
                syncSelected();
            });

            plusBtn.addEventListener('click', () => {
                let val = (parseInt(qtyInput.value) || 1) + 1;
                if (maxQtyNum && val > maxQtyNum) val = maxQtyNum;
                qtyInput.value = val;
                syncSelected();
            });

            // Direct input: always clamp immediately regardless of checkbox state
            qtyInput.addEventListener('input', () => { syncSelected(); });

            // Checkbox: clamp when checking
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    const val = getClampedVal();
                    qtyInput.value = val;
                    selectedItems[prod.product_id] = val;
                    card.classList.add('selected');
                } else {
                    delete selectedItems[prod.product_id];
                    card.classList.remove('selected');
                }
                updatePlusBtn();
            });

            // Detail button (image and text)
            card.querySelectorAll('.view-detail-btn, .view-detail-text').forEach(btn => {
                btn.addEventListener('click', () => { showProductDetail(prod); });
            });

            updatePlusBtn();
            productContainer.appendChild(card);
        });

        // Update Pagination Info
        document.getElementById('page-info').textContent = `第 ${currentPage} / ${totalPages} 頁`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function showProductDetail(prod) {
        document.getElementById('detail-id').textContent = prod.product_id;
        document.getElementById('detail-id').style.color = prod.id_color || '#64748b';
        document.getElementById('detail-name').textContent = prod.name;
        document.getElementById('detail-name').style.color = prod.name_color || '#fff';
        document.getElementById('detail-price').textContent = `$${Number(prod.price || 0).toLocaleString()}`;
        document.getElementById('detail-price').style.color = prod.price_color || 'var(--primary)';
        const rawDesc = prod.long_desc || '暫無詳細描述。';
        const detailDescEl = document.getElementById('detail-description');
        detailDescEl.style.color = prod.long_desc_color || '#cbd5e1';
        // Render as Markdown if marked is available, else plain text
        if (typeof marked !== 'undefined') {
            detailDescEl.innerHTML = marked.parse(rawDesc);
        } else {
            detailDescEl.textContent = rawDesc;
        }
        document.getElementById('detail-image').src = prod.image_path || 'images/placeholder.png';
        showPage(detailPage);
    }

    // --- Pagination Events ---
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(products.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    });

    // --- Admin: Manage Products ---

    function renderManageProducts() {
        manageProductsBody.innerHTML = '';
        products.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.product_id}</td>
                <td>${prod.name}</td>
                <td>${prod.short_desc || ''}</td>
                <td>
                    <button class="btn-small prod-edit-btn" data-id="${prod.id}">編輯</button>
                    <button class="btn-small prod-delete-btn" data-id="${prod.id}" style="background: #ef4444;">刪除</button>
                </td>
            `;
            
            tr.querySelector('.prod-edit-btn').addEventListener('click', () => {
                openProductModal(prod);
            });

            tr.querySelector('.prod-delete-btn').addEventListener('click', async () => {
                if (confirm('確定要刪除此品項嗎？')) {
                    const res = await fetch(`/api/products/${prod.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    if (res.ok) fetchProducts();
                }
            });

            manageProductsBody.appendChild(tr);
        });
    }

    function openProductModal(prod = null) {
        document.getElementById('product-modal-title').textContent = prod ? '編輯產品資訊' : '新增產品品項';
        document.getElementById('product-db-id').value = prod ? prod.id : '';
        document.getElementById('prod-id').value = prod ? prod.product_id : '';
        document.getElementById('prod-name').value = prod ? prod.name : '';
        document.getElementById('prod-price').value = prod ? prod.price : '';
        document.getElementById('prod-max-qty').value = prod ? (prod.max_qty || 0) : 0;
        document.getElementById('prod-short-desc').value = prod ? prod.short_desc : '';
        document.getElementById('prod-long-desc').value = prod ? prod.long_desc : '';
        document.getElementById('prod-id-color').value = prod ? (prod.id_color || '#64748b') : '#64748b';
        document.getElementById('prod-name-color').value = prod ? (prod.name_color || '#ffffff') : '#ffffff';
        document.getElementById('prod-price-color').value = prod ? (prod.price_color || '#00f0ff') : '#00f0ff';
        document.getElementById('prod-max-qty-color').value = prod ? (prod.max_qty_color || '#94a3b8') : '#94a3b8';
        document.getElementById('prod-short-desc-color').value = prod ? (prod.short_desc_color || '#cbd5e1') : '#cbd5e1';
        document.getElementById('prod-long-desc-color').value = prod ? (prod.long_desc_color || '#cbd5e1') : '#cbd5e1';
        document.getElementById('prod-image').value = '';
        productModal.classList.remove('hidden');
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-db-id').value;
        const product_id = document.getElementById('prod-id').value;
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const max_qty = document.getElementById('prod-max-qty').value;
        const short_desc = document.getElementById('prod-short-desc').value;
        const long_desc = document.getElementById('prod-long-desc').value;
        const id_color = document.getElementById('prod-id-color').value;
        const name_color = document.getElementById('prod-name-color').value;
        const price_color = document.getElementById('prod-price-color').value;
        const max_qty_color = document.getElementById('prod-max-qty-color').value;
        const short_desc_color = document.getElementById('prod-short-desc-color').value;
        const long_desc_color = document.getElementById('prod-long-desc-color').value;
        const imageFile = document.getElementById('prod-image').files[0];
        
        console.log('Sending Product Data:', { id, product_id, name, price, short_desc });

        let image_path = products.find(p => p.id == id)?.image_path || 'images/placeholder.png';

        try {
            console.log('Start saving product...');
            // 1. Upload image if selected
            if (imageFile) {
                // Client-side size check (3MB limit for Vercel)
                if (imageFile.size > 3 * 1024 * 1024) {
                    alert('圖片檔案太大了！請選擇小於 3MB 的檔案。');
                    return;
                }

                const formData = new FormData();
                formData.append('product_id', product_id);
                formData.append('image', imageFile);
                formData.append('token', sessionStorage.getItem('token'));
                
                console.log('Uploading image...');
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') },
                    body: formData
                });
                
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    image_path = data.path;
                    console.log('Image upload success!');
                } else {
                    const errorData = await uploadRes.json();
                    throw new Error('圖片上傳失敗：' + (errorData.error || '未知原因'));
                }
            }

            // 2. Save product
            console.log('Saving product data...');
            const max_qty = document.getElementById('prod-max-qty').value;
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    token: sessionStorage.getItem('token'),
                    id: id || null,
                    product_id,
                    name,
                    short_desc,
                    long_desc,
                    price,
                    max_qty,
                    image_path,
                    id_color: document.getElementById('prod-id-color').value,
                    name_color: document.getElementById('prod-name-color').value,
                    price_color: document.getElementById('prod-price-color').value,
                    max_qty_color: document.getElementById('prod-max-qty-color').value,
                    short_desc_color: document.getElementById('prod-short-desc-color').value,
                    long_desc_color: document.getElementById('prod-long-desc-color').value
                })
            });

            if (res.ok) {
                alert('產品資訊已成功儲存！');
                productModal.classList.add('hidden');
                fetchProducts();
            } else {
                const data = await res.json();
                alert('儲存失敗：' + (data.error || '未知錯誤'));
            }
        } catch (err) {
            console.error('Save Error:', err);
            alert('發生錯誤：' + err.message);
        }
    });

    document.getElementById('cancel-product-btn').addEventListener('click', () => productModal.classList.add('hidden'));
    addProductBtn.addEventListener('click', () => openProductModal());
    adminManageBtn.addEventListener('click', () => showPage(managePage));
    backToFormFromManage.addEventListener('click', () => showPage(formPage));

    // --- Shopping Records ---

    healthForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const items = [];
        for (const [pid, qty] of Object.entries(selectedItems)) {
            const prod = products.find(p => p.product_id === pid);
            items.push({ 
                product_id: pid, 
                quantity: qty, 
                price_at_purchase: prod ? prod.price : 0 
            });
        }

        if (items.length === 0) {
            alert('請至少勾選一項產品！');
            return;
        }

        // Client-side quantity limit validation
        for (const item of items) {
            const prod = products.find(p => p.product_id === item.product_id);
            if (prod && prod.max_qty > 0 && item.quantity > prod.max_qty) {
                alert(`「${prod.name}」每次最多只能申請 ${prod.max_qty} 個！`);
                return;
            }
        }

        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    token: sessionStorage.getItem('token'),
                    items,
                    description: ''
                })
            });

            if (res.ok) {
                alert('需求清單已送出！');
                selectedItems = {};
                currentPage = 1;
                fetchProducts();
                showPage(listPage);
                fetchRecords();
            } else {
                const data = await res.json();
                alert('送出失敗：' + (data.error || '未知錯誤'));
            }
        } catch (err) {
            alert('無法連接到伺服器');
        }
    });

    async function fetchRecords() {
        const recordsTable = document.getElementById('records-table');
        const loadingIndicator = document.getElementById('loading-indicator');
        const emptyState = document.getElementById('empty-state');

        loadingIndicator.classList.remove('hidden');
        emptyState.classList.add('hidden');
        recordsBody.innerHTML = '';
        
        try {
            const res = await fetch('/api/records', { headers: getAuthHeaders() });
            const result = await res.json();
            records = result.data;
            const isAdmin = result.isAdmin;

            loadingIndicator.classList.add('hidden');
            
            if (!records || records.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }
            emptyState.classList.add('hidden');

            records.forEach(rec => {
                const tr = document.createElement('tr');
                
                // Parse items from JSONB
                let names = '無';
                let idsWithQty = '無';
                let unitPrices = '無';
                let totalPrice = 0;

                if (rec.items_json && Array.isArray(rec.items_json)) {
                    const itemData = rec.items_json.map(i => {
                        const prod = products.find(p => p.product_id === i.product_id);
                        const name = prod ? prod.name : '未知品項';
                        const unitPrice = i.price_at_purchase || 0;
                        const subtotal = unitPrice * i.quantity;
                        totalPrice += subtotal;
                        return { name, idQty: `${i.product_id} (x${i.quantity})`, price: `$${unitPrice}` };
                    });

                    names = itemData.map(d => d.name).join('<br>');
                    idsWithQty = itemData.map(d => d.idQty).join('<br>');
                    unitPrices = itemData.map(d => d.price).join('<br>');
                }

                tr.innerHTML = `
                    <td data-label="申請時間">${rec.date}</td>
                    <td data-label="申請人">${rec.username}</td>
                    <td data-label="品名" style="font-size: 13px;">${names}</td>
                    <td data-label="編號(數量)" style="font-size: 13px;">${idsWithQty}</td>
                    <td data-label="單價" style="font-size: 13px;">${unitPrices}</td>
                    <td data-label="總價" style="color: var(--primary); font-weight: 600;">$${totalPrice.toLocaleString()}</td>
                    <td data-label="訂單狀態" style="font-weight: bold; color: ${rec.status === '未完成' ? '#ef4444' : rec.status === '已確認' ? '#10b981' : rec.status === '待出貨' ? '#f59e0b' : rec.status === '已出貨' ? '#8b5cf6' : '#3b82f6'};">${rec.status || '進行中'}</td>
                    <td data-label="操作">
                        <button class="btn-small edit-btn" data-id="${rec.id}">編輯</button>
                        <button class="btn-small delete-btn" data-id="${rec.id}" style="background: #ef4444;">刪除</button>
                    </td>
                `;

                tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(rec));
                tr.querySelector('.delete-btn').addEventListener('click', async () => {
                    if (confirm('確定刪除？')) {
                        const delRes = await fetch(`/api/records/${rec.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                        if (delRes.ok) fetchRecords();
                    }
                });

                recordsBody.appendChild(tr);
            });
        } catch (err) {
            loadingIndicator.classList.add('hidden');
            console.error('Records fetch failed', err);
        }
    }

    function openEditModal(rec) {
        document.getElementById('edit-id').value = rec.id;
        document.getElementById('edit-description').value = rec.description || '';
        
        // Populate edit items
        editItemsContainer.innerHTML = '';
        const lockItems = ['已確認', '待出貨', '已出貨'].includes(rec.status);
        if (lockItems) {
            const hint = document.createElement('div');
            hint.style = "color: #f59e0b; font-size: 13px; margin-bottom: 10px; text-align: center; font-weight: bold;";
            hint.textContent = "⚠️ 訂單狀態為「" + rec.status + "」，無法再修改訂購品項與數量。";
            editItemsContainer.appendChild(hint);
        }

        products.forEach(prod => {
            const itemInRec = (rec.items_json || []).find(i => i.product_id === prod.product_id);
            const isChecked = !!itemInRec;
            const qty = isChecked ? itemInRec.quantity : 1;

            const div = document.createElement('div');
            div.style = "display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px;";
            const disabledAttr = lockItems ? 'disabled' : '';
            const maxQty = prod.max_qty && prod.max_qty > 0 ? prod.max_qty : null;
            const maxAttrEdit = maxQty ? `max="${maxQty}"` : '';
            const limitHintEdit = maxQty ? `<span style="font-size: 11px; color: #f59e0b; margin-left: 2px;">(訂購上限 ${maxQty})</span>` : '';
            div.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: ${lockItems ? 'not-allowed' : 'pointer'};">
                    <input type="checkbox" class="edit-prod-check" data-pid="${prod.product_id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;" ${disabledAttr}>
                    <span>${prod.product_id} - ${prod.name}</span>
                </label>
                <div style="display: flex; align-items: center; gap: 5px; ${lockItems ? 'opacity: 0.7;' : ''}">
                    <span>數量:</span>
                    <input type="number" class="edit-prod-qty" value="${qty}" min="0" ${maxAttrEdit} style="width: 60px; padding: 4px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);" oninvalid="this.setCustomValidity('超過訂購上限')" oninput="this.setCustomValidity('')" ${disabledAttr}>
                    ${limitHintEdit}
                </div>
            `;
            // Clamp edit modal qty on input
            const editQtyInput = div.querySelector('.edit-prod-qty');
            if (maxQty) {
                editQtyInput.addEventListener('input', () => {
                    let val = parseInt(editQtyInput.value);
                    if (!isNaN(val) && val > maxQty) {
                        editQtyInput.value = maxQty;
                    }
                });
            }
            editItemsContainer.appendChild(div);
        });

        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        document.getElementById('edit-description').disabled = isAdmin;
        document.getElementById('edit-admin-note').value = rec.admin_note || '';
        document.getElementById('edit-admin-note').disabled = !isAdmin;
        document.getElementById('edit-status').value = rec.status || '進行中';
        document.getElementById('edit-status').disabled = !isAdmin;
        editModal.classList.remove('hidden');
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const description = document.getElementById('edit-description').value;
        const admin_note = document.getElementById('edit-admin-note').value;
        const status = document.getElementById('edit-status').value;
        const items = [];
        
        document.querySelectorAll('.edit-prod-check').forEach(check => {
            if (check.checked) {
                const pid = check.getAttribute('data-pid');
                const qty = parseInt(check.closest('div').querySelector('.edit-prod-qty').value) || 0;
                
                // Find original price if it exists, otherwise use current product price
                const rec = records.find(r => r.id == id);
                const originalItem = (rec?.items_json || []).find(i => i.product_id === pid);
                const currentProd = products.find(p => p.product_id === pid);
                
                const price = originalItem ? (originalItem.price_at_purchase || 0) : (currentProd ? currentProd.price : 0);
                
                items.push({ 
                    product_id: pid, 
                    quantity: qty,
                    price_at_purchase: price
                });
            }
        });


        try {
            const res = await fetch(`/api/records/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ items, description, admin_note, status })
            });

            if (res.ok) {
                editModal.classList.add('hidden');
                fetchRecords();
            } else {
                const data = await res.json();
                alert('更新失敗：' + (data.error || '未知錯誤'));
            }
        } catch (err) {
            alert('發生錯誤');
        }
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => editModal.classList.add('hidden'));

    // --- Auth & Initial State ---

    // --- Helper: Update UI based on login state ---
    function applyLoginState(username, isAdmin) {
        // Show/hide guest login button
        guestLoginBtn.style.display = 'none';
        // Show user nav
        userNav.style.display = 'flex';
        userDisplayName.textContent = username;
        // Admin button
        adminManageBtn.style.display = isAdmin ? 'inline-block' : 'none';
        // Hide submit container for admins
        const submitContainer = document.getElementById('submit-container');
        if (submitContainer) {
            submitContainer.style.display = isAdmin ? 'none' : 'block';
        }
        // Unlock action buttons
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        viewRecordsBtn.disabled = false;
        viewRecordsBtn.style.opacity = '1';
        viewRecordsBtn.style.cursor = 'pointer';
        document.getElementById('submit-lock-hint').style.display = 'none';
        document.getElementById('records-lock-hint').style.display = 'none';
    }

    function applyGuestState() {
        guestLoginBtn.style.display = 'inline-flex';
        userNav.style.display = 'none';
        adminManageBtn.style.display = 'none';
        const submitContainer = document.getElementById('submit-container');
        if (submitContainer) submitContainer.style.display = 'block';
        // Lock action buttons
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.4';
        submitBtn.style.cursor = 'not-allowed';
        viewRecordsBtn.disabled = true;
        viewRecordsBtn.style.opacity = '0.4';
        viewRecordsBtn.style.cursor = 'not-allowed';
        document.getElementById('submit-lock-hint').style.display = 'block';
        document.getElementById('records-lock-hint').style.display = 'block';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('resend-verify-btn').style.display = 'none';
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
            // Await profile to get the definitive is_admin from DB
            try {
                const profileRes = await fetch('/api/profile', {
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.token }
                });
                const profile = profileRes.ok ? await profileRes.json() : null;
                const isAdmin = profile ? !!profile.is_admin : !!data.isAdmin;
                sessionStorage.setItem('isAdmin', isAdmin);
                applyLoginState(data.username, isAdmin);
            } catch {
                sessionStorage.setItem('isAdmin', data.isAdmin);
                applyLoginState(data.username, data.isAdmin);
            }
            showPage(formPage);
            fetchProducts();
            fetchSettings();
        } else {
            const data = await res.json();
            if (data.code === 'UNVERIFIED') {
                alert(data.error);
                document.getElementById('resend-verify-btn').style.display = 'inline-block';
                document.getElementById('go-to-verify-btn').style.display = 'inline-block';
                const vBr = document.getElementById('verify-br');
                if (vBr) vBr.style.display = 'block';
                sessionStorage.setItem('temp_unverified_username', username);
            } else {
                alert(data.error || '登入失敗，請確認帳號與密碼');
            }
        }

    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const last_name  = document.getElementById('reg-lastname').value.trim();
        const first_name = document.getElementById('reg-firstname').value.trim();
        const gender     = document.getElementById('reg-title').value;
        const username   = document.getElementById('reg-username').value.trim();
        const password   = document.getElementById('reg-password').value;
        const phone      = document.getElementById('reg-phone').value.trim();
        const email      = document.getElementById('reg-email').value.trim();
        const city       = document.getElementById('reg-city').value;
        const address    = document.getElementById('reg-address').value.trim();

        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, gender, last_name, first_name, phone, email, city, address })
        });

        if (res.ok) {
            const data = await res.json();
            alert(data.message || '註冊成功！請前往信箱收取驗證碼');
            sessionStorage.setItem('temp_unverified_username', username);
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('verify-code-section').style.display = 'block';
            document.getElementById('register-footer-links').style.display = 'none';
            document.getElementById('verify-footer-links').style.display = 'block';
        } else {
            const data = await res.json();
            if (data.code === 'DUPLICATE_USERNAME') {
                alert('帳號名稱已被使用，請更換帳號名稱後再試！');
            } else {
                alert('註冊失敗：' + (data.error || '未知錯誤'));
            }
        }
    });

    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sessionStorage.clear();
            applyGuestState();
            showPage(formPage);
        });
    });

    // Guest login button → go to login page
    guestLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showPage(loginPage); });

    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('verify-code-section').style.display = 'none';
        document.getElementById('register-footer-links').style.display = 'block';
        document.getElementById('verify-footer-links').style.display = 'none';
        showPage(registerPage);
    });


    document.getElementById('go-to-login').addEventListener('click', (e) => { e.preventDefault(); showPage(loginPage); });
    document.getElementById('verify-back-to-login')?.addEventListener('click', (e) => { e.preventDefault(); showPage(loginPage); });
    
    document.getElementById('go-to-verify-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showVerificationUI();
    });

    document.querySelectorAll('.back-to-home-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(formPage);
        });
    });


    viewRecordsBtn.addEventListener('click', () => { showPage(listPage); fetchRecords(); });
    backBtn.addEventListener('click', () => showPage(formPage));
    backToFormBtn.addEventListener('click', () => showPage(formPage));

    const resendVerifyBtn = document.getElementById('resend-verify-btn');
    if (resendVerifyBtn) {
        resendVerifyBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = sessionStorage.getItem('temp_unverified_username');
            if (!username) {
                alert('無法取得帳號名稱，請重新輸入帳號並嘗試登入');
                return;
            }
            
            try {
                const res = await fetch('/api/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    document.getElementById('resend-verify-btn').style.display = 'none';
                    document.getElementById('go-to-verify-btn').style.display = 'none';
                    const vBr = document.getElementById('verify-br');
                    if (vBr) vBr.style.display = 'none';
                    showVerificationUI();
                } else {
                    alert('重發失敗：' + (data.error || '未知錯誤'));
                }
            } catch (err) {
                alert('無法連接伺服器');
            }

        });
    }

    const verifyCodeBtn = document.getElementById('verify-code-btn');
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', async () => {
            const code = document.getElementById('verify-code-input').value.trim();
            const username = sessionStorage.getItem('temp_unverified_username');
            if (!code || code.length !== 6) {
                alert('請輸入 6 位數驗證碼');
                return;
            }
            if (!username) {
                alert('無法取得帳號資訊，請重新登入或註冊');
                return;
            }

            try {
                const res = await fetch('/api/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, code })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('驗證成功！請登入。');
                    document.getElementById('register-form').reset();
                    document.getElementById('register-form').style.display = 'block';
                    document.getElementById('verify-code-section').style.display = 'none';
                    document.getElementById('register-footer-links').style.display = 'block';
                    document.getElementById('verify-code-input').value = '';
                    showPage(loginPage);
                } else {
                    alert(data.error || '驗證失敗');
                }
            } catch (err) {
                alert('無法連接伺服器');
            }
        });
    }

    const resendVerifyCodeBtn = document.getElementById('resend-verify-code-btn');
    if (resendVerifyCodeBtn) {
        resendVerifyCodeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = sessionStorage.getItem('temp_unverified_username');
            if (!username) return alert('無法取得帳號資訊');
            try {
                const res = await fetch('/api/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('驗證碼已重新發送！');
                } else {
                    alert('重發失敗：' + (data.error || '未知錯誤'));
                }
            } catch (err) {
                alert('無法連接伺服器');
            }
        });
    }

    // OAuth Login Check
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('oauth_token');
    const oauthUsername = urlParams.get('username');
    if (oauthToken && oauthUsername) {
        sessionStorage.setItem('token', oauthToken);
        sessionStorage.setItem('username', oauthUsername);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Auto-login check
    if (sessionStorage.getItem('token')) {
        const username = sessionStorage.getItem('username');
        // Initial state from storage
        const isAdminFromStorage = sessionStorage.getItem('isAdmin') === 'true';
        applyLoginState(username, isAdminFromStorage);
        fetchProducts();
        fetchSettings();

        // Refresh isAdmin state from server to catch role changes (like S33 promotion)
        fetch('/api/profile', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    const latestIsAdmin = !!data.is_admin;
                    sessionStorage.setItem('isAdmin', latestIsAdmin);
                    applyLoginState(data.username, latestIsAdmin);
                }
            })
            .catch(err => console.error('Failed to sync profile', err));
    } else {
        applyGuestState();
        fetchProducts();
        fetchSettings();
    }
    exportExcelBtn.addEventListener('click', () => {
        const token = sessionStorage.getItem('token');
        if (!token) { alert('請先登入'); return; }
        window.location.href = `/api/export-excel?token=${encodeURIComponent(token)}`;
    });

    // --- Profile Modal ---
    userDisplayBtn.addEventListener('click', async () => {
        const token = sessionStorage.getItem('token');
        const res = await fetch('/api/profile', { headers: getAuthHeaders() });
        if (!res.ok) { alert('無法載入個人資料'); return; }
        const data = await res.json();
        document.getElementById('profile-username').value  = data.username || '';
        document.getElementById('profile-lastname').value  = data.last_name || '';
        document.getElementById('profile-firstname').value = data.first_name || '';
        document.getElementById('profile-title').value     = data.gender || '';
        document.getElementById('profile-password').value  = '';
        document.getElementById('profile-phone').value     = data.phone || '';
        document.getElementById('profile-email').value     = data.email || '';
        document.getElementById('profile-city').value      = data.city || '';
        document.getElementById('profile-address').value   = data.address || '';
        profileModal.classList.remove('hidden');
    });

    document.getElementById('cancel-profile-btn').addEventListener('click', () => {
        profileModal.classList.add('hidden');
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            last_name:  document.getElementById('profile-lastname').value.trim(),
            first_name: document.getElementById('profile-firstname').value.trim(),
            gender:     document.getElementById('profile-title').value,
            phone:      document.getElementById('profile-phone').value.trim(),
            email:      document.getElementById('profile-email').value.trim(),
            city:       document.getElementById('profile-city').value,
            address:    document.getElementById('profile-address').value.trim(),
        };
        const newPassword = document.getElementById('profile-password').value;
        if (newPassword) payload.password = newPassword;

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('個人資料已更新！');
            profileModal.classList.add('hidden');
        } else {
            const d = await res.json();
            alert('更新失敗：' + (d.error || '未知錯誤'));
        }
    });

    // --- Users List (Admin) ---
    async function fetchUsers() {
        const usersBody   = document.getElementById('users-body');
        const usersLoading = document.getElementById('users-loading');
        const usersEmpty  = document.getElementById('users-empty');
        usersLoading.classList.remove('hidden');
        usersEmpty.classList.add('hidden');
        usersBody.innerHTML = '';
        try {
            const res = await fetch('/api/users', { headers: getAuthHeaders() });
            const users = await res.json();
            usersLoading.classList.add('hidden');
            if (!users || users.length === 0) { usersEmpty.classList.remove('hidden'); return; }
            users.forEach(u => {
                const tr = document.createElement('tr');
                const regTime = u.created_at
                    ? new Date(u.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '-';
                tr.innerHTML = `
                    <td data-label="註冊時間" style="font-size: 12px; color: var(--text-muted);">${regTime}</td>
                    <td data-label="帳號">${u.username}</td>
                    <td data-label="姓名">${(u.last_name || '') + (u.first_name || '') || '-'}</td>
                    <td data-label="稱謂">${u.gender || '-'}</td>
                    <td data-label="電話">${u.phone || '-'}</td>
                    <td data-label="Email">${u.email || '-'}</td>
                    <td data-label="縣市">${u.city || '-'}</td>
                    <td data-label="地址">${u.address || '-'}</td>
                    <td data-label="身份">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <button class="btn-small toggle-admin-btn" data-username="${u.username}" ${u.username === 'Stanley' ? 'disabled style="background: #6b7280; font-size: 12px; padding: 4px 10px; cursor: not-allowed; opacity: 0.5;"' : `style="background: ${u.is_admin ? '#f59e0b' : '#6b7280'}; font-size: 12px; padding: 4px 10px;"`}>
                                ${u.is_admin ? '🔑 管理者' : '👤 一般'}
                            </button>
                            ${!u.is_verified ? '<span style="color: #ef4444; font-size: 11px; font-weight: bold; text-align: center;">⚠️ 未驗證</span>' : ''}
                        </div>
                    </td>

                    <td data-label="操作">
                        <button class="btn-small delete-user-btn" data-username="${u.username}" ${u.username === 'Stanley' ? 'disabled style="background: #ef4444; font-size: 12px; padding: 4px 10px; cursor: not-allowed; opacity: 0.5;"' : 'style="background: #ef4444; font-size: 12px; padding: 4px 10px;"'}>刪除</button>
                    </td>
                `;

                tr.querySelector('.toggle-admin-btn').addEventListener('click', async () => {
                    const targetUser = u.username;
                    const newStatus = !u.is_admin;
                    const actionText = newStatus ? '設為管理者' : '取消管理者權限';
                    if (!confirm(`確定要將「${targetUser}」${actionText}嗎？`)) return;
                    try {
                        const toggleRes = await fetch('/api/users/toggle-admin', {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ username: targetUser, is_admin: newStatus })
                        });
                        if (toggleRes.ok) {
                            alert(`已成功${actionText}！`);
                            fetchUsers();
                        } else {
                            const d = await toggleRes.json();
                            alert('操作失敗：' + (d.error || '未知錯誤'));
                        }
                    } catch (err) {
                        alert('操作失敗');
                    }
                });

                tr.querySelector('.delete-user-btn').addEventListener('click', async () => {
                    const targetUser = u.username;
                    if (!confirm(`確定要刪除使用者「${targetUser}」嗎？這個操作無法復原！`)) return;
                    try {
                        const delRes = await fetch(`/api/users/${targetUser}`, {
                            method: 'DELETE',
                            headers: getAuthHeaders()
                        });
                        if (delRes.ok) {
                            alert(`已成功刪除使用者「${targetUser}」！`);
                            fetchUsers();
                        } else {
                            const d = await delRes.json();
                            alert('刪除失敗：' + (d.error || '未知錯誤'));
                        }
                    } catch (err) {
                        alert('操作失敗');
                    }
                });

                usersBody.appendChild(tr);
            });
        } catch (err) {
            usersLoading.classList.add('hidden');
            console.error('Fetch users failed', err);
        }
    }

    viewUsersBtn.addEventListener('click', () => { showPage(usersPage); fetchUsers(); });
    backToManageBtn.addEventListener('click', () => showPage(managePage));

    exportUsersExcelBtn.addEventListener('click', () => {
        const token = sessionStorage.getItem('token');
        if (!token) { alert('請先登入'); return; }
        window.location.href = `/api/export-users-excel?token=${encodeURIComponent(token)}`;
    });
});
