# --- Этап сборки: собираем статику через Vite ---
FROM node:20-alpine AS build
WORKDIR /app

# Ставим зависимости по локу (воспроизводимо), затем собираем.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Этап раздачи: nginx отдаёт статику и проксирует API/WS на бэкенд ---
FROM nginx:1.27-alpine

# Шаблон конфига: ${BACKEND_URL} подставляется при старте контейнера (envsubst).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Адрес бэкенда по умолчанию (переопределяется переменной окружения).
ENV BACKEND_URL=http://backend:8000
EXPOSE 80
