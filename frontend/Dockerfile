ARG BACKEND_URL

# Stage 1: Build the static site with rsbuild
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN echo "PUBLIC_BACKEND_URL=${BACKEND_URL}" > .env

RUN npm run build

# STAGE 2: Serve the built static site using Nginx
FROM nginx:stable-alpine AS server

COPY --from=builder /app/dist/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]