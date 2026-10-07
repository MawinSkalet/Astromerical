FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build
FROM nginx:1.27-alpine
ARG API_UPSTREAM=api:8000
COPY nginx.conf /tmp/default.conf.template
RUN sed "s|__API_UPSTREAM__|${API_UPSTREAM}|g" /tmp/default.conf.template > /etc/nginx/conf.d/default.conf \
    && rm /tmp/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
