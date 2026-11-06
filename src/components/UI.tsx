import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Heart,
  Rocket,
  Sparkles,
  Sprout,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { projects, type Showcase, type Course } from "../data/content";
export function SectionTitle({
  eyebrow,
  title,
  description,
  link,
  to,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  link?: string;
  to?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && to && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <div className="container">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
export function ProjectCards() {
  const icons = [Sprout, Sparkles, Rocket, Heart];
  return (
    <div className="grid four">
      {projects.map((p, i) => {
        const Icon = icons[i];
        return (
          <Link to={p.link} className={`project-card ${p.color}`} key={p.title}>
            <div className="project-top">
              <span className="icon-box">
                <Icon size={28} />
              </span>
              <span className="number">0{i + 1}</span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <span className="card-bottom">
              一起了解更多
              <ArrowUpRight size={19} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
export function ShowcaseCard({
  item,
  index = 0,
}: {
  item: Showcase;
  index?: number;
}) {
  return (
    <article className="showcase-card">
      <Link to={`/showcase/${item.id}`} tabIndex={-1} aria-hidden="true">
        <div className={`case-art art-${index % 3}`}>
          <div className="mini-window">
            <div className="window-dots">● ● ●</div>
            <div className="window-body">
              <Sparkles size={28} />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="floating-note">
            <BookOpen size={23} />
            <span>
              讓好方法
              <br />
              持續發生
            </span>
          </div>
          <span className="art-label">
            AI ×{" "}
            {index % 3 === 0
              ? "工作日常"
              : index % 3 === 1
                ? "創意學習"
                : "生活探索"}
          </span>
        </div>
      </Link>
      <div className="card-content">
        <div className="tag-row">
          <span className="tag">{item.category}</span>
          <span className="demo-label">示範案例</span>
        </div>
        <h3>
          <Link to={`/showcase/${item.id}`}>{item.title}</Link>
        </h3>
        <p>{item.summary}</p>
        <div className="card-bottom">
          <span>{item.organization}</span>
          <Link to={`/showcase/${item.id}`} aria-label={`閱讀${item.title}`}>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CourseCard({ item }: { item: Course }) {
  const d = new Date(item.date + "T00:00:00");
  return (
    <article className="course-card">
      <div className={`course-date ${item.color}`}>
        <span>{d.getFullYear()}</span>
        <strong>
          {String(d.getMonth() + 1).padStart(2, "0")}.
          {String(d.getDate()).padStart(2, "0")}
        </strong>
        <span>
          {["週日", "週一", "週二", "週三", "週四", "週五", "週六"][d.getDay()]}
        </span>
      </div>
      <div className="course-content">
        <div className="tag-row">
          <span className="tag">{item.type}</span>
          <span className="demo-label">示範活動</span>
        </div>
        <h3>
          <Link to={`/courses/${item.id}`}>{item.title}</Link>
        </h3>
        <p>
          <MapPin size={15} />
          {item.location}
          <span className="divider">|</span>
          <CalendarDays size={15} />
          {item.time}
        </p>
      </div>
      <Link
        to={`/courses/${item.id}`}
        className="course-arrow"
        aria-label={`查看${item.title}`}
      >
        <ArrowUpRight />
      </Link>
    </article>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice">
      <Sparkles size={20} />
      <div>{children}</div>
    </div>
  );
}
