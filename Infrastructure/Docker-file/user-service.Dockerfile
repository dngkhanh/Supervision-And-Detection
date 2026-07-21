# ============================================================
# user-service.Dockerfile
# Node.js ESM — Express + Mongoose
# Production image: dùng node trực tiếp, không cần nodemon
# ============================================================

FROM node:20-alpine

ENV TZ=Asia/Ho_Chi_Minh \
    NODE_ENV=production
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

# Production: chạy trực tiếp bằng node, không dùng nodemon
CMD ["node", "src/index.js"]
