FROM node:24-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY tsconfig.json ./

RUN pnpm config set onlyBuiltDependencies '[]' --location=project && pnpm install

COPY src ./src

EXPOSE 8080

CMD ["pnpm", "run", "dev"]
