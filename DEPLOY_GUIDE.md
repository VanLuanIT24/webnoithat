# 🚀 Hướng Dẫn Deploy Lên Railway

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. Fix MemoryStore Warning
- ❌ **Trước**: Sử dụng MemoryStore mặc định (không phù hợp production)
- ✅ **Sau**: Sử dụng MySQL Session Store với Railway MySQL

### 2. Cải Thiện Error Handling
- Thêm error handler cho session store
- Thêm error handler cho toàn bộ app
- Thêm error handler cho server startup

### 3. Thêm Health Check
- Endpoint `/health` để Railway kiểm tra app status
- Trả về status, timestamp, và uptime

## 📋 Checklist Trước Khi Deploy

- [x] Cài đặt `express-mysql-session`: `npm install express-mysql-session`
- [x] Cập nhật `app.js` với MySQL session store
- [x] Thêm error handling
- [x] Thêm health check endpoint
- [ ] Đảm bảo file `.env` có đủ biến môi trường
- [ ] Commit và push code lên GitHub

## 🔧 Biến Môi Trường Cần Thiết Trên Railway

```env
# Database (Railway MySQL)
DB_HOST=switchback.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=YeakDPlKQyydaJjcmShgqHXyXoYOAmaS
DB_NAME=railway
DB_PORT=28295

# App Config
PORT=3000
NODE_ENV=production
SESSION_SECRET=railway-secret-key-change-this-to-random-string

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

## 🚀 Cách Deploy

### 1. Commit Changes
```bash
git add .
git commit -m "Fix: Use MySQL session store and improve error handling"
git push origin main
```

### 2. Railway Sẽ Tự Động Deploy
- Railway sẽ detect thay đổi và tự động build + deploy
- Kiểm tra logs để đảm bảo không có lỗi

### 3. Kiểm Tra Health Check
```bash
curl https://your-app-url.railway.app/health
```

## 🔍 Debug Nếu Có Lỗi

### Kiểm tra Railway Logs
1. Vào Railway Dashboard
2. Click vào project
3. Xem tab "Deployments" → Click vào deployment mới nhất
4. Xem "View Logs"

### Các Log Cần Tìm
- ✅ `🚀 Server is running on port...`
- ✅ `✅ MySQL connected successfully!`
- ✅ `📊 Environment: production`
- ❌ Bất kỳ error nào liên quan đến database connection
- ❌ Bất kỳ error nào liên quan đến session store

## 📊 Test Local Trước Khi Deploy

```bash
# Test database connection
node test-railway-connection.js

# Test app startup
node test-app-startup.js

# Run app
npm start
```

## 🆘 Troubleshooting

### Lỗi: "Application failed to respond"
**Nguyên nhân**: App không khởi động được hoặc crash ngay sau khi start

**Giải pháp**:
1. Kiểm tra Railway logs để xem lỗi cụ thể
2. Đảm bảo tất cả dependencies đã được cài đặt
3. Kiểm tra database connection
4. Kiểm tra biến môi trường

### Lỗi: "Session store error"
**Nguyên nhân**: Không kết nối được MySQL để lưu session

**Giải pháp**:
1. Kiểm tra DB credentials trong Railway
2. Đảm bảo MySQL service đang chạy
3. Kiểm tra network/firewall settings

### Lỗi: "ECONNREFUSED"
**Nguyên nhân**: Không kết nối được database

**Giải pháp**:
1. Kiểm tra DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
2. Đảm bảo MySQL service đang active trên Railway
3. Test connection bằng `node test-railway-connection.js`

## 📝 Notes

- Session data giờ được lưu vào MySQL, persist qua các lần restart
- Bảng `sessions` sẽ tự động được tạo khi app chạy lần đầu
- Session cũ sẽ tự động được xóa mỗi 15 phút
- Session timeout: 24 giờ
