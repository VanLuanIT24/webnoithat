# Sử dụng Node.js version 18 (Alpine để nhẹ hơn)
FROM node:18-alpine

# Tạo thư mục app
WORKDIR /app

# Copy file package
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --production

# Copy toàn bộ source code
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p uploads

# Expose port (Render dùng PORT mặc định là 10000)
EXPOSE 3000

# Chạy ứng dụng
CMD ["node", "app.js"]