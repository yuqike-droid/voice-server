FROM node:24-slim

WORKDIR /app

COPY package.json ./

RUN npm install

COPY src ./src
COPY tsconfig.json ./

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]
