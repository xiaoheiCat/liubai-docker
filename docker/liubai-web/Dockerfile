# syntax=docker/dockerfile:1

FROM oven/bun:1.3 AS builder

WORKDIR /app/liubai-frontends/liubai-web

COPY liubai-frontends/liubai-web/package.json ./

RUN bun install

COPY liubai-frontends/liubai-web ./

ARG VITE_API_DOMAIN=
ENV VITE_API_DOMAIN=${VITE_API_DOMAIN}

RUN bun run build

FROM nginx:1.27-alpine

COPY docker/liubai-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/liubai-frontends/liubai-web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
