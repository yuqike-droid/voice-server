import express from "express";
import cors from "cors";
import multer from "multer";
import { ASRClient, LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const app = express();
const port = parseInt(process.env.PORT || "8080");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// POST /api/v1/asr/recognize - 语音识别 + 语义解析（返回结果，由前端保存）
app.post("/api/v1/asr/recognize", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "请上传音频文件" });
      return;
    }

    const audioBase64 = req.file.buffer.toString("base64");
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const asrClient = new ASRClient(config, customHeaders);

    // 1. ASR 语音识别
    const asrResult = await asrClient.recognize({
      uid: "time-tracker",
      base64Data: audioBase64,
    });

    const text = asrResult.text;
    if (!text || text.trim().length === 0) {
      res.json({ text: "", parsed: null, error: "未识别到语音内容" });
      return;
    }

    // 2. LLM 语义解析
    const llmClient = new LLMClient(config, customHeaders);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: `你是一个时间记录解析助手。用户的语音输入包含活动和时间的描述，请解析出结构化的记录信息。

当前日期：${todayStr}

请从语音文本中提取以下信息（JSON格式）：
{
  "activity": "活动名称（如：吃饭、跑步、编码、开会等，简洁2-4个字）",
  "category": "分类（工作、学习、生活、运动、休闲、社交）",
  "recorded_at": "开始时间（ISO 8601格式）",
  "end_time": "结束时间（ISO 8601格式，没有则为null）",
  "note": "备注（没有则为null）"
}

示例：
- "13点到13点半吃饭" → {"activity":"吃饭","category":"生活","recorded_at":"${todayStr}T13:00:00+08:00","end_time":"${todayStr}T13:30:00+08:00","note":null}
- "下午3点编码" → {"activity":"编码","category":"工作","recorded_at":"${todayStr}T15:00:00+08:00","end_time":null,"note":null}
- "跑步" → {"activity":"跑步","category":"运动","recorded_at":"${now.toISOString()}","end_time":null,"note":null}

注意事项：
- 用当天日期${todayStr}结合用户说的时间构造完整时间戳
- 如果用户说"X点到Y点"，recorded_at是开始时间，end_time是结束时间
- 如果只说时间没有结束，end_time为null
- 活动名称简洁明确（2-4个字）
- 只返回JSON，不要多余的文字和markdown标记`,
      },
      { role: "user", content: text },
    ];

    const llmResponse = await llmClient.invoke(llmMessages, {
      model: "doubao-seed-2-0-mini-260215",
      temperature: 0.1,
    });

    // 3. 解析LLM结果
    let parsed: any = null;
    try {
      const cleaned = llmResponse.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
      }
    }

    // 返回结果给前端，由前端保存到本地 SQLite
    res.json({
      text,
      parsed,
      error: null,
    });
  } catch (err: any) {
    console.error("语音识别失败:", err);
    res.status(500).json({ error: err.message || "语音识别失败", text: "", parsed: null });
  }
});

app.listen(port, () => {
  console.log(`Voice Server listening on port ${port}`);
});