export interface Chunk {
  content: string;
  source?: string;
}

export interface TrackOptions {
  /** ユーザーの質問 */
  question: string;
  /** RAGの回答 */
  answer: string;
  /** 取得されたチャンクのリスト */
  chunks?: Chunk[];
  /** APIキー（未指定の場合は RAG_EVAL_API_KEY 環境変数を使用） */
  apiKey?: string;
  /** APIのURL（未指定の場合はデフォルトのSaaS URLを使用） */
  apiUrl?: string;
  /** RAGの応答時間（ミリ秒） */
  latencyMs?: number;
}

export interface TrackPayload {
  question: string;
  answer: string;
  chunks: Chunk[];
  latency_ms?: number;
}
