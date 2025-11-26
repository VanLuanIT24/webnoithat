# 🚀 HƯỚNG DẪN SỬA LỖI RAILWAY

## ❌ VẤN ĐỀ
Tất cả biến môi trường đều `undefined` trên Railway → App không kết nối được MySQL

## ✅ NGUYÊN NHÂN
Railway **KHÔNG tự động đọc file `.env`** trong deployment. Bạn phải:
1. Kết nối Railway MySQL Plugin, HOẶC
2. Tự set biến môi trường trên Railway Dashboard

## 🔧 GIẢI PHÁP - CHỌN 1 TRONG 2 CÁCH

### CÁCH 1: Dùng Railway MySQL Plugin (KHUYẾN NGHỊ)

1. **Vào Railway Dashboard** → Project của bạn
2. **Click "New"** → **"Database"** → **"Add MySQL"**
3. Railway sẽ tự động tạo database và inject biến môi trường:
   - `MYSQLHOST`
   - `MYSQLUSER` 
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`
   - `MYSQL_URL`

4. **Redeploy** app

✅ **Xong!** Railway sẽ tự động kết nối

---

### CÁCH 2: Tự set biến môi trường (nếu dùng external MySQL)

1. **Vào Railway Dashboard** → Project → Service của bạn
2. **Click tab "Variables"**
3. **Thêm các biến sau:**

```
MYSQLHOST=switchback.proxy.rlwy.net
MYSQLUSER=root
MYSQLPASSWORD=YeakDPlKQyydaJjcmShgqHXyXoYOAmaS
MYSQLDATABASE=railway
MYSQLPORT=28295
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
```

4. **Click "Deploy"** để redeploy

---

## 🧪 KIỂM TRA TRÊN RAILWAY

Sau khi setup xong, kiểm tra logs:

```bash
# Xem logs deployment
railway logs

# Tìm dòng này để xác nhận biến đã được inject
🔍 Database Config: {
  host: 'switchback.proxy.rlwy.net',  ← PHẢI CÓ GIÁ TRỊ
  user: 'root',                        ← PHẢI CÓ GIÁ TRỊ
  password: '***',                     ← PHẢI CÓ GIÁ TRỊ
  database: 'railway',                 ← PHẢI CÓ GIÁ TRỊ
  port: '28295'                        ← PHẢI CÓ GIÁ TRỊ
}
```

---

## 🔍 DEBUG (nếu vẫn lỗi)

Chạy script kiểm tra:

```bash
# Local
node check-env.js

# Trên Railway (thêm vào package.json)
"scripts": {
  "check-env": "node check-env.js"
}
```

Script sẽ liệt kê **TẤT CẢ** biến môi trường có sẵn.

---

## 📝 QUAN TRỌNG

### ⚠️ File `.env` KHÔNG ĐƯỢC DEPLOY lên Railway

Railway **BỎ QUA** file `.env` (do `.gitignore`). 

Bạn PHẢI:
- ✅ Dùng Railway MySQL Plugin, HOẶC
- ✅ Set biến môi trường trên Railway Dashboard

### ✅ Code hiện tại đã support nhiều format:

```javascript
// Sẽ tự động detect:
MYSQLHOST || DB_HOST || MYSQL_HOST
MYSQLUSER || DB_USER || MYSQL_USER
MYSQLPASSWORD || DB_PASSWORD || MYSQL_PASSWORD
MYSQLDATABASE || DB_NAME || MYSQL_DATABASE
MYSQLPORT || DB_PORT || MYSQL_PORT
```

---

## 🎯 CHECKLIST

- [ ] Đã add Railway MySQL Plugin HOẶC set biến môi trường thủ công
- [ ] Đã redeploy app
- [ ] Logs hiển thị biến môi trường có giá trị (không phải `undefined`)
- [ ] App kết nối thành công MySQL (không còn lỗi `ECONNREFUSED`)

---

## 💡 TIP

Nếu dùng **Railway MySQL Plugin**, bạn không cần set gì thêm. Railway sẽ tự động:
1. Tạo MySQL instance
2. Inject biến môi trường
3. Kết nối app với database

Đơn giản nhất! 🚀
