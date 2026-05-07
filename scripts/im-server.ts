import http from "node:http";
import {
  createAgentSession,
  SessionManager,
} from "@mariozechner/pi-coding-agent";

const PORT = Number(process.env.PORT ?? 3000);

const { session } = await createAgentSession({
  cwd: process.cwd(),
  sessionManager: SessionManager.create(process.cwd()),
  thinkingLevel: "off",
});

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

function extractText(body: any): string {
  return String(
    body.text ??
      body.message ??
      body.content ??
      body.event?.message?.text ??
      body.event?.text ??
      ""
  ).trim();
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}

async function askPi(text: string): Promise<string> {
  let reply = "";

  const unsubscribe = session.subscribe((event: any) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent?.type === "text_delta"
    ) {
      reply += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(text);
    return reply.trim() || "处理完成，但没有生成文本回复。";
  } finally {
    unsubscribe();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/im/webhook") {
    sendJson(res, 404, { error: "Not Found" });
    return;
  }

  let raw = "";

  for await (const chunk of req) {
    raw += chunk;
  }

  let body: any;

  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  const text = extractText(body);

  if (!text) {
    sendJson(res, 400, { error: "Missing message text" });
    return;
  }

  try {
    const reply = await enqueue(() => askPi(text));

    sendJson(res, 200, {
      reply,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`pi-mono IM server listening on http://0.0.0.0:${PORT}`);
});