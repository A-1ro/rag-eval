import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackAutoRAG } from "../src/autorag.js";

const FAKE_KEY = "test-api-key";
const FAKE_ID = "evaluation-id-123";

function mockFetchOk() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: FAKE_ID }),
  });
}

function makeAutoRagStub() {
  return {
    aiSearch: vi.fn().mockResolvedValue({
      response: "RAGとは...",
      data: [
        {
          filename: "doc1.md",
          content: [{ type: "text", text: "chunk-1" }],
        },
        {
          filename: "doc2.md",
          content: [
            { type: "text", text: "part-a" },
            { type: "text", text: "part-b" },
          ],
        },
      ],
    }),
    search: vi.fn().mockResolvedValue({ data: [] }),
    extra: "passthrough-value",
  };
}

describe("trackAutoRAG()", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchOk());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["RAG_EVAL_API_KEY"];
    delete process.env["RAG_EVAL_API_URL"];
  });

  it("aiSearchの結果をそのまま透過する", async () => {
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    const result = await wrapped.aiSearch({ query: "RAGとは?" });
    expect(result.response).toBe("RAGとは...");
    expect(result.data).toHaveLength(2);
  });

  it("aiSearchの呼び出しでtrackが発火する", async () => {
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    await wrapped.aiSearch({ query: "RAGとは?" });

    // wait microtask for fire-and-forget track promise
    await new Promise((r) => setTimeout(r, 0));

    expect(fetch).toHaveBeenCalledWith(
      "https://rag-eval.a-1ro.dev/api/track",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.question).toBe("RAGとは?");
    expect(body.answer).toBe("RAGとは...");
    expect(body.chunks).toEqual([
      { content: "chunk-1", source: "doc1.md" },
      { content: "part-a\npart-b", source: "doc2.md" },
    ]);
    expect(typeof body.latency_ms).toBe("number");
  });

  it("ctx.waitUntil が渡されたら waitUntil 経由で送信する", async () => {
    const stub = makeAutoRagStub();
    const waitUntil = vi.fn();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY, ctx: { waitUntil } });
    await wrapped.aiSearch({ query: "Q" });

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
  });

  it("aiSearch以外のメソッド・プロパティは透過する", async () => {
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });

    expect(wrapped.extra).toBe("passthrough-value");
    await wrapped.search({ query: "Q" });
    expect(stub.search).toHaveBeenCalledWith({ query: "Q" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("track送信が失敗してもaiSearchは正常に値を返す（エラーはログに残す）", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    const result = await wrapped.aiSearch({ query: "Q" });
    expect(result.response).toBe("RAGとは...");

    await new Promise((r) => setTimeout(r, 0));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[rag-eval]"),
      expect.any(Error),
    );
  });

  it("track送信がHTTPエラーを返した場合もエラーログを残す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("boom"),
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    await wrapped.aiSearch({ query: "Q" });

    await new Promise((r) => setTimeout(r, 0));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[rag-eval\].*500.*Internal Server Error.*boom/),
    );
  });

  it("APIキー未指定でもaiSearchは動く（trackは送信されない）", async () => {
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, {});
    const result = await wrapped.aiSearch({ query: "Q" });
    expect(result.response).toBe("RAGとは...");
    await new Promise((r) => setTimeout(r, 0));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("新形式レスポンス(chunks[].text / chunks[].item.key)も正しく送信する", async () => {
    const stub = {
      aiSearch: vi.fn().mockResolvedValue({
        response: "新形式の回答",
        chunks: [
          { text: "chunk-1", item: { key: "doc1.md" }, score: 0.9 },
          { text: "chunk-2", item: { key: "doc2.md" }, score: 0.8 },
        ],
      }),
    };
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    await wrapped.aiSearch({ query: "Q" });
    await new Promise((r) => setTimeout(r, 0));

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.answer).toBe("新形式の回答");
    expect(body.chunks).toEqual([
      { content: "chunk-1", source: "doc1.md" },
      { content: "chunk-2", source: "doc2.md" },
    ]);
  });

  it("chatCompletions形式(choices[0].message.content)の回答も拾える", async () => {
    const stub = {
      aiSearch: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "chat-completionsからの回答" } }],
        chunks: [{ text: "ctx-1", item: { key: "src.md" } }],
      }),
    };
    const wrapped = trackAutoRAG(stub, { apiKey: FAKE_KEY });
    await wrapped.aiSearch({ query: "Q" });
    await new Promise((r) => setTimeout(r, 0));

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.answer).toBe("chat-completionsからの回答");
    expect(body.chunks).toEqual([{ content: "ctx-1", source: "src.md" }]);
  });

  it("カスタム apiUrl を使う", async () => {
    const stub = makeAutoRagStub();
    const wrapped = trackAutoRAG(stub, {
      apiKey: FAKE_KEY,
      apiUrl: "https://custom.example.com",
    });
    await wrapped.aiSearch({ query: "Q" });
    await new Promise((r) => setTimeout(r, 0));
    expect(fetch).toHaveBeenCalledWith(
      "https://custom.example.com/api/track",
      expect.anything(),
    );
  });
});
