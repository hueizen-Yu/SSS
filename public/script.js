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

    // State
    let products = [];
    let records = []; // Global records storage
    let selectedItems = {}; // { product_id: quantity }
    let currentPage = 1;
    const itemsPerPage = 5;

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

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            const settings = await res.json();
            if (settings.form_title) {
                formTitleH1.innerHTML = settings.form_title.replace(/\|/g, '<br>');
                setFormTitleInput.value = settings.form_title;
                document.title = settings.form_title.replace(/\|/g, '');
            }
            const ogDescInput = document.getElementById('set-og-description');
            if (ogDescInput && settings.og_description !== undefined) {
                ogDescInput.value = settings.og_description || '';
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    }

    saveSettingsBtn.addEventListener('click', async () => {
        const newTitle = setFormTitleInput.value;
        console.log('Attempting to save new title:', newTitle);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ key: 'form_title', value: newTitle })
            });
            if (res.ok) {
                alert('設定已儲存！');
                fetchSettings();
            }
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

            const card = document.createElement('div');
            card.className = `product-item ${isChecked ? 'selected' : ''}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="check-${prod.product_id}" ${isChecked ? 'checked' : ''}>
                        <span class="product-id">${prod.product_id}</span>
                        <span class="product-name">${prod.name}</span>
                    </div>
                    <img src="${prod.image_path || 'images/placeholder.png'}" alt="${prod.name}" class="view-detail-btn" data-id="${prod.id}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                </div>
                <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 4px 28px; line-height: 1.4;">${prod.short_desc || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-left: 28px;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 12px; color: var(--text-muted);">數量:</span>
                        <input type="number" id="qty-${prod.product_id}" value="${qty}" min="1" class="qty-input" style="width: 50px; padding: 3px 6px; font-size: 13px;">
                    </div>
                    <span style="color: var(--primary); font-weight: 600; font-size: 14px;">$${Number(prod.price || 0).toLocaleString()}</span>
                </div>
            `;

            // Event: Card Selection
            const checkbox = card.querySelector('input[type="checkbox"]');
            const qtyInput = card.querySelector('.qty-input');

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedItems[prod.product_id] = parseInt(qtyInput.value) || 1;
                    card.classList.add('selected');
                } else {
                    delete selectedItems[prod.product_id];
                    card.classList.remove('selected');
                }
            });

            qtyInput.addEventListener('input', () => {
                if (checkbox.checked) {
                    selectedItems[prod.product_id] = parseInt(qtyInput.value) || 1;
                }
            });

            // Detail button
            card.querySelector('.view-detail-btn').addEventListener('click', () => {
                showProductDetail(prod);
            });

            productContainer.appendChild(card);
        });

        // Update Pagination Info
        document.getElementById('page-info').textContent = `第 ${currentPage} / ${totalPages} 頁`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function showProductDetail(prod) {
        document.getElementById('detail-id').textContent = prod.product_id;
        document.getElementById('detail-name').textContent = prod.name;
        document.getElementById('detail-price').textContent = `$${Number(prod.price || 0).toLocaleString()}`;
        document.getElementById('detail-description').textContent = prod.long_desc || '暫無詳細描述。';
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
        document.getElementById('prod-short-desc').value = prod ? prod.short_desc : '';
        document.getElementById('prod-long-desc').value = prod ? prod.long_desc : '';
        document.getElementById('prod-image').value = '';
        productModal.classList.remove('hidden');
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-db-id').value;
        const product_id = document.getElementById('prod-id').value;
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const short_desc = document.getElementById('prod-short-desc').value;
        const long_desc = document.getElementById('prod-long-desc').value;
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
                    image_path
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
        products.forEach(prod => {
            const itemInRec = (rec.items_json || []).find(i => i.product_id === prod.product_id);
            const isChecked = !!itemInRec;
            const qty = isChecked ? itemInRec.quantity : 1;

            const div = document.createElement('div');
            div.style = "display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px;";
            div.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" class="edit-prod-check" data-pid="${prod.product_id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <span>${prod.product_id} - ${prod.name}</span>
                </label>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>數量:</span>
                    <input type="number" class="edit-prod-qty" value="${qty}" min="0" style="width: 60px; padding: 4px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);">
                </div>
            `;
            editItemsContainer.appendChild(div);
        });

        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        document.getElementById('edit-description').readOnly = !isAdmin;
        editModal.classList.remove('hidden');
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const description = document.getElementById('edit-description').value;
        const items = [];
        
        document.querySelectorAll('.edit-prod-check').forEach(check => {
            if (check.checked) {
                const pid = check.getAttribute('data-pid');
                const qty = parseInt(check.closest('div').querySelector('.edit-prod-qty').value) || 0;
                items.push({ product_id: pid, quantity: qty });
            }
        });

        try {
            const res = await fetch(`/api/records/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ items, description })
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
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('isAdmin', data.isAdmin);
            applyLoginState(data.username, data.isAdmin);
            showPage(formPage);
            fetchProducts();
            fetchSettings();
        } else {
            alert('登入失敗，請確認帳號與密碼');
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
            alert('註冊成功！請登入');
            showPage(loginPage);
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

    document.getElementById('go-to-register').addEventListener('click', (e) => { e.preventDefault(); showPage(registerPage); });
    document.getElementById('go-to-login').addEventListener('click', (e) => { e.preventDefault(); showPage(loginPage); });
    viewRecordsBtn.addEventListener('click', () => { showPage(listPage); fetchRecords(); });
    backBtn.addEventListener('click', () => showPage(formPage));
    backToFormBtn.addEventListener('click', () => showPage(formPage));

    // Auto-login check
    if (sessionStorage.getItem('token')) {
        const username = sessionStorage.getItem('username');
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        applyLoginState(username, isAdmin);
        fetchProducts();
        fetchSettings();
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
                tr.innerHTML = `
                    <td data-label="帳號">${u.username}</td>
                    <td data-label="姓名">${(u.last_name || '') + (u.first_name || '') || '-'}</td>
                    <td data-label="稱謂">${u.gender || '-'}</td>
                    <td data-label="電話">${u.phone || '-'}</td>
                    <td data-label="Email">${u.email || '-'}</td>
                    <td data-label="縣市">${u.city || '-'}</td>
                    <td data-label="地址">${u.address || '-'}</td>
                    <td data-label="身份">
                        <button class="btn-small toggle-admin-btn" data-username="${u.username}" style="background: ${u.is_admin ? '#f59e0b' : '#6b7280'}; font-size: 12px; padding: 4px 10px;">
                            ${u.is_admin ? '🔑 管理者' : '👤 一般'}
                        </button>
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
