import { Link, useParams } from "react-router-dom";
import { PageIntro } from "../components/UI";
import { useContent, ContentStatus } from "../data/repository";
import type { PublicRecruitment } from "../data/public-contract.mjs";
import { NotFound } from "./Content";
import { DEFAULT_ADMIN_URL } from "../config/site";

export function RecruitmentPanel({
  recruitment: r,
}: {
  recruitment: PublicRecruitment | null;
}) {
  if (!r) return <p>正式招募資訊尚待公告，請留意最新消息。</p>;
  // YYYY-MM-DD comparison explicitly follows Taiwan calendar dates.
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
  }).format(new Date());
  const open =
    r.recruitmentStatus === "open" &&
    !!r.startDate &&
    !!r.endDate &&
    today >= r.startDate &&
    today <= r.endDate;
  return (
    <div className="managed-copy">
      <p>{r.description}</p>
      {r.startDate && (
        <p>
          招募期間：{r.startDate} 至 {r.endDate || "待公告"}（臺灣時間）
        </p>
      )}
      {open ? (
        <a
          href={r.formUrl}
          className="btn primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          前往Google Forms申請
        </a>
      ) : (
        <p>
          {r.recruitmentStatus === "announced"
            ? "錄取結果已公告"
            : r.recruitmentStatus === "closed" ||
                (r.endDate && today > r.endDate)
              ? "招募已截止"
              : "目前未開放申請"}
        </p>
      )}
      {r.resultsUrl && (
        <p>
          <a href={r.resultsUrl} target="_blank" rel="noopener noreferrer">
            查看錄取公告
          </a>
        </p>
      )}
    </div>
  );
}
export function OrganizationDetail() {
  const { id } = useParams(),
    { data, loading, error } = useContent();
  if (loading || error)
    return (
      <div className="container section">
        <h1>合作機構</h1>
        <ContentStatus />
      </div>
    );
  const o = data?.organizations.find((o) => o.id === id);
  if (!o) return <NotFound />;
  return (
    <>
      <PageIntro
        eyebrow="OUR PARTNERS"
        title={o.name}
        description={`${o.city}・${o.region}`}
      />
      <article className="container section managed-copy">
        <Link className="text-link" to="/seed">
          返回合作機構
        </Link>
        {o.logoUrl && (
          <p>
            <img
              className="organization-logo"
              src={o.logoUrl}
              alt={`${o.name} Logo`}
              referrerPolicy="no-referrer"
            />
          </p>
        )}
        <h2>機構簡介</h2>
        <p>{o.summary}</p>
        <h2>服務特色</h2>
        <p>{o.features || "資訊將陸續更新。"}</p>
        <h2>AI推動方向</h2>
        <p>{o.aiDirection || "資訊將陸續更新。"}</p>
      </article>
    </>
  );
}
export function AnnouncementDetail() {
  const { id } = useParams(),
    { data, loading, error } = useContent();
  if (loading || error)
    return (
      <div className="container section">
        <h1>計畫公告</h1>
        <ContentStatus />
      </div>
    );
  const n = data?.announcements.find((n) => n.id === id);
  if (!n) return <NotFound />;
  return (
    <>
      <PageIntro
        eyebrow="LATEST UPDATES"
        title={n.title}
        description={`${n.category}・${n.date}`}
      />
      <article className="container section managed-copy">
        <Link className="text-link" to="/">
          返回首頁
        </Link>
        <p>
          <strong>{n.summary}</strong>
        </p>
        <p>{n.content}</p>
      </article>
    </>
  );
}
export function AdminEntry() {
  const raw = (import.meta.env.VITE_ADMIN_URL ?? DEFAULT_ADMIN_URL).trim();
  const url =
    /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(raw)
      ? raw
      : "";
  return (
    <>
      <PageIntro
        eyebrow="ADMINISTRATION"
        title="計畫管理入口"
        description="使用已授權的Google帳號管理計畫內容。"
      />
      <div className="container section">
        <div className="plain-card">
          <h2>CCSA管理後台</h2>
          <p>
            管理員須列入白名單，並具有內部試算表編輯權限。Google將要求您授權，本站不接收帳號密碼。
          </p>
          {url ? (
            <a
              className="btn primary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              使用Google帳號前往管理後台
            </a>
          ) : (
            <p>管理後台部署網址尚未設定，請聯絡計畫維護人員。</p>
          )}
        </div>
      </div>
    </>
  );
}
