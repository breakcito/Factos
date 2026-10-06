# Etapa 1: Compilación de la aplicación
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias nativas para Linux
RUN npm install

# Variables de entorno en tiempo de build requeridas por Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar código fuente y generar build de producción
COPY . .
RUN npm run build

# Etapa 2: Servidor web de producción ligero
FROM nginx:alpine

# Copiar estáticos generados y configuración personalizada de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
