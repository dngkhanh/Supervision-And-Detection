# ============================================================
# frontend.Dockerfile
# React + Vite (dev server — HMR enabled)
# Port: 5173 (Vite default)
# Dev: vite --host để expose ra khỏi container
# ============================================================

FROM node:20-alpine

ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0 bắt buộc để Docker expose port ra ngoài container
CMD ["npx", "vite", "--host", "0.0.0.0"]
