import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <Link
        to="/login"
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          display: "inline-block",
          marginBottom: 32,
        }}
      >
        ← ログインに戻る
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        プライバシーポリシー
      </h1>
      <p
        style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 40 }}
      >
        最終更新日：2026年4月30日
      </p>

      <Section title="1. 事業者情報">
        <p>
          本サービス「RAG評価ダッシュボード」（以下「本サービス」）は、入口英一郎（以下「運営者」）が提供するサービスです。
        </p>
      </Section>

      <Section title="2. 収集する情報">
        <p>本サービスでは、以下の情報を収集します。</p>
        <ul>
          <li>メールアドレス（アカウント登録・認証のため）</li>
          <li>パスワード（PBKDF2でハッシュ化して保存。平文では保存しません）</li>
          <li>RAGアプリから送信される質問・回答・チャンクデータ（評価ログ）</li>
          <li>アクセスログ（IPアドレス、ブラウザ情報等）</li>
        </ul>
      </Section>

      <Section title="3. 利用目的">
        <p>収集した情報は以下の目的にのみ使用します。</p>
        <ul>
          <li>アカウントの認証・管理</li>
          <li>RAG評価スコアの算出・表示</li>
          <li>サービスの品質改善・障害対応</li>
          <li>法令に基づく対応</li>
        </ul>
      </Section>

      <Section title="4. 第三者への提供">
        <p>
          運営者は、以下の場合を除き、個人情報を第三者に提供しません。
        </p>
        <ul>
          <li>ご本人の同意がある場合</li>
          <li>法令に基づく場合</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          本サービスは以下のインフラを利用しており、データは各社のサーバーに保管・処理されます。
        </p>
        <ul>
          <li>
            <strong>Cloudflare, Inc.</strong>
            （ホスティング・データベース [D1]・LLM推論
            [Workers AI]）— 質問・回答データを評価スコア算出のため Workers AI
            に送信します。{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              プライバシーポリシー
            </a>
          </li>
        </ul>
      </Section>

      <Section title="5. データの保管・削除">
        <p>
          収集したデータはサービス提供に必要な期間保管します。アカウントの削除をご希望の場合は、
          下記の問い合わせ先までご連絡ください。アカウントおよび関連データを削除いたします。
        </p>
      </Section>

      <Section title="6. Cookie・ローカルストレージ">
        <p>
          本サービスはセッション管理のためにローカルストレージにJWTトークンを保管します。
          ブラウザの設定により無効化できますが、ログイン状態が維持できなくなります。
        </p>
      </Section>

      <Section title="7. 個人情報の開示・訂正・削除">
        <p>
          ご自身の個人情報の開示・訂正・削除をご希望の場合は、下記の問い合わせ先までご連絡ください。
          合理的な期間内に対応いたします。
        </p>
      </Section>

      <Section title="8. 問い合わせ先">
        <p>
          本ポリシーに関するお問い合わせは、GitHubのIssueよりご連絡ください。
        </p>
        <p style={{ marginTop: 8 }}>
          <a
            href="https://github.com/A-1ro/rag-eval/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/A-1ro/rag-eval/issues
          </a>
        </p>
      </Section>

      <Section title="9. ポリシーの変更">
        <p>
          本ポリシーは予告なく変更する場合があります。変更後はこのページに掲載し、最終更新日を更新します。
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 12,
          color: "var(--text)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          color: "var(--text)",
          lineHeight: 1.8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {children}
      </div>
      <style>{`
        section ul { padding-left: 20px; }
        section li { margin-bottom: 4px; }
      `}</style>
    </section>
  );
}
