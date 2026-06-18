# 使用 Node.js 24 作为基础镜像
FROM node:24-slim

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json ./
COPY tsconfig.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY src ./src

# 暴露端口
EXPOSE 8080

# 启动服务
CMD ["pnpm", "run", "dev"]