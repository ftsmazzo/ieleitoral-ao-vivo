FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY shared ./shared
COPY public ./public
RUN npm run build

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY server ./server
COPY shared ./shared
COPY data ./data
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "server/index.mjs"]
