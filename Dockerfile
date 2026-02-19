FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration=production

FROM nginx:1.25-alpine
LABEL maintainer="Ecossistema Digital <dev@embaixada-angola.site>"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sgc-frontend/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
