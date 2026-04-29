require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Request Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Simple Auth Middleware
const crypto = require('crypto');
const tokens = new Map(); // token -> username

// Multer setup for image uploads (Memory storage for Vercel compatibility)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit for Vercel stability
});

async function verifyToken(req, res, next) {
    // Support both Authorization header and ?token= query param (needed for mobile direct URL navigation)
    let token = null;
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
        token = auth.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const result = await pool.query('SELECT username FROM users WHERE token = $1', [token]);
            if (result.rows.length > 0) {
                req.username = result.rows[0].username;
                return next();
            }
        } catch (err) {
            console.error('Verify Token Error:', err);
        }
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Initialize PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pZSMuW9F2aBI@ep-lingering-union-an0xpv9b.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Database pool error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log it
});

async function initDB() {
    try {
        const client = await pool.connect();
        console.log('Connected to the PostgreSQL database.');
        
        // Initialize Tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                product_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                short_desc TEXT,
                long_desc TEXT,
                price NUMERIC DEFAULT 0,
                image_path TEXT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS records (
                id SERIAL PRIMARY KEY,
                username TEXT,
                items_json JSONB DEFAULT '[]',
                description TEXT DEFAULT '',
                date TEXT NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);

        // Seed default product info
        await Promise.all([
            client.query(`INSERT INTO settings (key, value) VALUES ('id1', '001') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('name1', '基本套裝') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('short_desc1', '入門級科技配件') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('long_desc1', '包含基本配件、高品質連接線以及一年原廠保固。適合初學者。') ON CONFLICT DO NOTHING;`),
            
            client.query(`INSERT INTO settings (key, value) VALUES ('id2', '002') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('name2', '進階套裝') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('short_desc2', '專業級效能提升') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('long_desc2', '升級為高效能處理核心，具備多重傳輸介面。適合開發者與專業技術人員。') ON CONFLICT DO NOTHING;`),
            
            client.query(`INSERT INTO settings (key, value) VALUES ('id3', '003') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('name3', '旗艦套裝') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('short_desc3', '頂規旗艦硬體') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('long_desc3', '全鋁合金外殼設計，內建高速儲存空間，並包含全套雲端協作服務。') ON CONFLICT DO NOTHING;`),
            client.query(`INSERT INTO settings (key, value) VALUES ('form_title', '購物需求申請') ON CONFLICT DO NOTHING;`)
        ]);

        // Seed initial products if none exist
        const prodCount = await client.query('SELECT COUNT(*) FROM products');
        if (parseInt(prodCount.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO products (product_id, name, short_desc, long_desc, price, image_path)
                VALUES 
                ('001', '基本套裝', '入門級科技配件', '包含基本配件、高品質連接線以及一年原廠保固。適合初學者。', 1500, 'images/product1.png'),
                ('002', '進階套裝', '專業級效能提升', '升級為高效能處理核心，具備多重傳輸介面。適合開發者與專業技術人員。', 3500, 'images/product2.png'),
                ('003', '旗艦套裝', '頂規旗艦硬體', '全鋁合金外殼設計，內建高速儲存空間，並包含全套雲端協作服務。', 8800, 'images/product3.png')
                ON CONFLICT DO NOTHING;
            `);
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                gender TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                token TEXT
            );
        `);

        // Migration: Ensure token column exists
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS token TEXT;`);

        // Migration: Ensure price and items_json exists
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;`);
        await client.query(`ALTER TABLE records ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[]';`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`);

        // Seed the admin user
        await client.query(`
            INSERT INTO users (username, password, gender, is_admin)
            VALUES ('Stanley', '1231', '男', TRUE)
            ON CONFLICT (username) DO NOTHING;
        `);

        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        // Retry connection after a delay
        setTimeout(initDB, 5000);
    }
}

initDB();

app.post('/api/register', async (req, res) => {
    const { username, password, gender } = req.body;
    if (!username || !password || !gender) {
        return res.status(400).json({ error: '請填寫所有欄位' });
    }
    
    try {
        const sql = 'INSERT INTO users (username, password, gender) VALUES ($1, $2, $3)';
        await pool.query(sql, [username, password, gender]);
        res.json({ message: '註冊成功' });
    } catch (err) {
        return res.status(400).json({ error: '使用者名稱已被註冊！' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }
        const token = crypto.randomBytes(16).toString('hex');
        await pool.query('UPDATE users SET token = $1 WHERE username = $2', [token, username]);
        res.json({ token, username, isAdmin: result.rows[0].is_admin });
    } catch (err) {
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create or update product (Admin only)
app.post('/api/products', verifyToken, async (req, res) => {
    const { id, product_id, name, short_desc, long_desc, price, image_path } = req.body;
    const numericPrice = parseFloat(price) || 0;
    const intId = id ? parseInt(id) : null;
    
    console.log(`Saving Product - ID: ${intId}, PID: ${product_id}, Price: ${numericPrice}`);
    
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        if (!userRes.rows[0]?.is_admin) return res.status(403).json({ error: '權限不足' });

        if (intId) {
            const result = await pool.query(
                'UPDATE products SET product_id = $1, name = $2, short_desc = $3, long_desc = $4, price = $5, image_path = $6 WHERE id = $7 RETURNING *',
                [product_id, name, short_desc, long_desc, numericPrice, image_path, intId]
            );
            if (result.rows.length === 0) {
                console.warn('Update failed: No product found with ID', intId);
                return res.status(404).json({ error: '找不到該產品' });
            }
            console.log('Update Success:', result.rows[0]);
        } else {
            const result = await pool.query(
                'INSERT INTO products (product_id, name, short_desc, long_desc, price, image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [product_id, name, short_desc, long_desc, numericPrice, image_path]
            );
            console.log('Insert Success:', result.rows[0]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', verifyToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        if (!userRes.rows[0]?.is_admin) return res.status(403).json({ error: '權限不足' });

        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/records', verifyToken, async (req, res) => {
    const { items, description } = req.body;
    try {
        const date = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        await pool.query(
            'INSERT INTO records (username, items_json, description, date) VALUES ($1, $2, $3, $4)',
            [req.username, JSON.stringify(items), description || '', date]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/records', verifyToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        const isAdmin = userRes.rows[0]?.is_admin;

        let result;
        if (isAdmin) {
            result = await pool.query('SELECT * FROM records ORDER BY id DESC');
        } else {
            result = await pool.query('SELECT * FROM records WHERE username = $1 ORDER BY id DESC', [req.username]);
        }
        res.json({ data: result.rows, isAdmin });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/records/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { items, description } = req.body;

    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        const isAdmin = userRes.rows[0]?.is_admin;

        if (isAdmin) {
            await pool.query('UPDATE records SET items_json = $1, description = $2 WHERE id = $3', [JSON.stringify(items), description, id]);
        } else {
            await pool.query('UPDATE records SET items_json = $1 WHERE id = $2 AND username = $3', [JSON.stringify(items), id, req.username]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/records/:id', verifyToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        const isAdmin = userRes.rows[0]?.is_admin;

        if (isAdmin) {
            await pool.query('DELETE FROM records WHERE id = $1', [req.params.id]);
        } else {
            await pool.query('DELETE FROM records WHERE id = $1 AND username = $2', [req.params.id, req.username]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload product image with custom error handling
app.post('/api/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Multer Error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '檔案太大，請限制在 3MB 以內' });
            }
            return res.status(500).json({ error: '圖片解析失敗: ' + err.message });
        }
        next();
    });
}, verifyToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        if (!userRes.rows[0]?.is_admin) return res.status(403).json({ error: '權限不足' });
        if (!req.file) return res.status(400).json({ error: '未提供圖片' });

        console.log('Converting buffer to base64, size:', req.file.size);
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

        res.json({ success: true, path: dataUri });
    } catch (err) {
        console.error('Upload API Catch Error:', err);
        res.status(500).json({ error: '伺服器上傳處理失敗: ' + err.message });
    }
});

// API endpoint to delete a record
app.delete('/api/records/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if user is admin
        const userResult = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        const isAdmin = userResult.rows.length > 0 && userResult.rows[0].is_admin;
        
        // Verify ownership
        const recordResult = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
        if (recordResult.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        const record = recordResult.rows[0];
        if (record.username !== req.username && !isAdmin) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own records.' });
        }

        await pool.query('DELETE FROM records WHERE id = $1', [id]);
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get global settings
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings');
        const settings = {};
        result.rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update global settings (Admin only)
app.post('/api/settings', verifyToken, async (req, res) => {
    const { key, value } = req.body;
    console.log(`Updating setting - Key: ${key}, Value: ${value}`);
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        if (!userRes.rows[0]?.is_admin) return res.status(403).json({ error: '權限不足' });

        await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
        console.log('Setting updated successfully');
        res.json({ success: true });
    } catch (err) {
        console.error('Settings Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Export Excel (works on all browsers including iOS Safari)
app.get('/api/export-excel', verifyToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT is_admin FROM users WHERE username = $1', [req.username]);
        const isAdmin = userRes.rows[0]?.is_admin;

        let result;
        if (isAdmin) {
            result = await pool.query('SELECT * FROM records ORDER BY id DESC');
        } else {
            result = await pool.query('SELECT * FROM records WHERE username = $1 ORDER BY id DESC', [req.username]);
        }

        const records = result.rows;

        // Fetch products for name lookup
        const prodResult = await pool.query('SELECT * FROM products');
        const products = prodResult.rows;

        const exportData = records.map(rec => {
            let names = '無';
            let idsWithQty = '無';
            let totalPrice = 0;

            if (rec.items_json && Array.isArray(rec.items_json)) {
                const itemData = rec.items_json.map(i => {
                    const prod = products.find(p => p.product_id === i.product_id);
                    const unitPrice = parseFloat(i.price_at_purchase) || 0;
                    totalPrice += unitPrice * i.quantity;
                    return {
                        name: prod ? prod.name : '未知品項',
                        idQty: `${i.product_id}(x${i.quantity})`
                    };
                });
                names = itemData.map(d => d.name).join(', ');
                idsWithQty = itemData.map(d => d.idQty).join(', ');
            }

            return {
                '申請時間': rec.date,
                '申請人': rec.username,
                '品名': names,
                '編號(數量)': idsWithQty,
                '總價': totalPrice,
                '備註': rec.description || ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 30 },
            { wch: 20 }, { wch: 10 }, { wch: 30 }
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '購物清單');

        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `shopping_list_${dateStr}.xlsx`;

        const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent('購物清單_' + dateStr + '.xlsx')}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        console.error('Export Excel Error:', err);
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
