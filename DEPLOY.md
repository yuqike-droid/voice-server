# =======================================
# 语音服务部署指南（免费云服务）
# =======================================

服务说明：仅包含语音识别(ASR) + AI语义解析(LLM)，部署到云端后，你手机上随时随地可以语音输入。

## 方式一：部署到 Railway（推荐，最简单）

1. 访问 https://railway.app/ 注册账号（GitHub登录即可）
2. 点击 "New Project" → "Deploy from GitHub"
3. 上传本目录到你的 GitHub 仓库
4. Railway 会自动检测 Dockerfile 并部署
5. 部署成功后，在 Railway Dashboard 的 Variables 中添加：
   ```
   COZE_LOOP_API_TOKEN=你的token
   COZE_LOOP_BASE_URL=https://api.coze.cn
   ```
   （你的 token 保存在：环境变量 COZE_LOOP_API_TOKEN，部署到云端时填这个值）
6. 部署完成后会得到一个域名，如 https://voice-server.up.railway.app

## 方式二：部署到 Render

1. 访问 https://render.com/ 注册
2. "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 设置 Start Command: `pnpm run dev`
5. 在 Environment Variables 中添加：
   ```
   COZE_LOOP_API_TOKEN=你的token
   COZE_LOOP_BASE_URL=https://api.coze.cn
   ```
6. 选择 Free 套餐即可

## 获取 COZE_LOOP_API_TOKEN

这个 Token 在你当前环境变量中有，在终端执行以下命令查看：
```bash
echo $COZE_LOOP_API_TOKEN
```

## 部署完成后

1. 获得你的云服务域名，如 `https://voice-server.up.railway.app`
2. 将前端的语音服务地址改为这个域名
3. 重新构建 APK 即可

## 本地测试

你也可以先本地测试：
```bash
cd server-voice
COZE_LOOP_API_TOKEN=你的token pnpm run dev
```
测试：curl http://localhost:8080/api/v1/health