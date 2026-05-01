import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track, atrack } from "../src/client.js";

const FAKE_KEY = "test-api-key";
const FAKE_ID = "evaluation-id-123";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe("track()", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch(200, { id: FAKE_ID }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["RAG_EVAL_API_KEY"];
    delete process.env["RAG_EVAL_API_URL"];
  });

  it("APIキーがない場合はnullを返す（例外なし）", async () => {
    const result = await track({
      question: "What is RAG?",
      answer: "Retrieval-Augmented Generation.",
    });
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("APIキーを直接渡した場合はevaluation_idを返す", async () => {
    const result = await track({
      question: "What is RAG?",
      answer: "Retrieval-Augmented Generation.",
      apiKey: FAKE_KEY,
    });
    expect(result).toBe(FAKE_ID);
  });

  it("環境変数 RAG_EVAL_API_KEY からAPIキーを読む", async () => {
    process.env["RAG_EVAL_API_KEY"] = FAKE_KEY;
    const result = await track({
      question: "What is RAG?",
      answer: "Retrieval-Augmented Generation.",
    });
    expect(result).toBe(FAKE_ID);
  });

  it("正しいエンドポイントにPOSTする", async () => {
    await track({
      question: "Q",
      answer: "A",
      apiKey: FAKE_KEY,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://rag-eval.a-1ro.dev/api/track",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("カスタム apiUrl を使う", async () => {
    await track({
      question: "Q",
      answer: "A",
      apiKey: FAKE_KEY,
      apiUrl: "https://custom.example.com",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://custom.example.com/api/track",
      expect.anything()
    );
  });

  it("環境変数 RAG_EVAL_API_URL を使う", async () => {
    process.env["RAG_EVAL_API_URL"] = "https://env.example.com/";
    await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    expect(fetch).toHaveBeenCalledWith(
      "https://env.example.com/api/track",
      expect.anything()
    );
  });

  it("末尾スラッシュを除去したURLでリクエストする", async () => {
    await track({
      question: "Q",
      answer: "A",
      apiKey: FAKE_KEY,
      apiUrl: "https://custom.example.com/",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://custom.example.com/api/track",
      expect.anything()
    );
  });

  it("chunks と latencyMs をペイロードに含める", async () => {
    await track({
      question: "Q",
      answer: "A",
      apiKey: FAKE_KEY,
      chunks: [{ content: "chunk text", source: "doc.pdf" }],
      latencyMs: 350,
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);

    expect(body).toEqual({
      question: "Q",
      answer: "A",
      chunks: [{ content: "chunk text", source: "doc.pdf" }],
      latency_ms: 350,
    });
  });

  it("chunks が未指定の場合は空配列をペイロードに含める", async () => {
    await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);
    expect(body.chunks).toEqual([]);
  });

  it("X-API-Key ヘッダーを送信する", async () => {
    await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe(FAKE_KEY);
  });

  it("APIが4xxを返した場合はnullを返す（例外なし、エラーログを残す）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve('{"error":"Unauthorized"}'),
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[rag-eval\].*401.*Unauthorized/),
    );
  });

  it("ネットワークエラーが発生した場合はnullを返す（例外なし、エラーログを残す）", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[rag-eval]"),
      expect.any(Error),
    );
  });

  it("レスポンスに id がない場合はnullを返す", async () => {
    vi.stubGlobal("fetch", mockFetch(200, {}));
    const result = await track({ question: "Q", answer: "A", apiKey: FAKE_KEY });
    expect(result).toBeNull();
  });
});

describe("atrack()", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch(200, { id: FAKE_ID }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["RAG_EVAL_API_KEY"];
  });

  it("track() と同じ結果を返す", async () => {
    const result = await atrack({
      question: "What is RAG?",
      answer: "Retrieval-Augmented Generation.",
      apiKey: FAKE_KEY,
    });
    expect(result).toBe(FAKE_ID);
  });

  it("APIキーがない場合はnullを返す", async () => {
    const result = await atrack({ question: "Q", answer: "A" });
    expect(result).toBeNull();
  });

  it("失敗時に例外を投げない", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(atrack({ question: "Q", answer: "A", apiKey: FAKE_KEY })).resolves.toBeNull();
  });
});
