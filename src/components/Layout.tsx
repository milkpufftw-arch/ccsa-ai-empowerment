import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight, ArrowUp } from "lucide-react";
const links = [
  ["/about", "認識計畫"],
  ["/seed", "AI種子機構"],
  ["/courses", "培力課程與活動"],
  ["/showcase", "AI應用成果庫"],
  ["/resources", "AI學習資源"],
];
export default function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    const t = loc.pathname.startsWith("/showcase")
      ? "AI應用成果庫"
      : loc.pathname.startsWith("/courses")
        ? "培力課程與活動"
        : links.find(([p]) => p === loc.pathname)?.[1];
    document.title = `${t ? t + "｜" : ""}共創未來｜CCSA AI培力計畫`;
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true }),
    );
  }, [loc.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        跳至主要內容
      </a>
      <header>
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="共創未來 首頁">
            <span className="brand-name">
              共創<span>未來</span>
              <small>CCSA AI EMPOWERMENT</small>
            </span>
          </Link>
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? "關閉選單" : "開啟選單"}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            id="main-nav"
            className={open ? "open" : ""}
            aria-label="主要導覽"
          >
            {links.map(([p, n]) => (
              <NavLink key={p} to={p}>
                {n}
              </NavLink>
            ))}
          </nav>
          <Link className="header-cta" to="/seed">
            一起參與
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <Link to="/" className="footer-brand">
                共創未來<span>讓科技有溫度，讓成長有可能。</span>
              </Link>
              <p>
                全國安置機構AI賦能與失家兒數位培力計畫
                <br />
                2026年11月 — 2027年10月
              </p>
            </div>
            <div>
              <span className="footer-label">探索計畫</span>
              <div className="footer-links">
                {links.map(([p, n]) => (
                  <Link to={p} key={p}>
                    {n}
                  </Link>
                ))}
              </div>
            </div>
            <div className="partners">
              <span className="footer-label">一起為更好的未來</span>
              <p>
                主辦單位
                <br />
                <strong>CCSA 中華育幼機構兒童關懷協會</strong>
              </p>
              <p>
                贊助單位
                <br />
                <strong>UBS 瑞銀集團</strong>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 CCSA 中華育幼機構兒童關懷協會</span>
            <span>第一階段展示網站・不接受報名或蒐集個資</span>
            <a href="#main" aria-label="回到頁面頂端">
              <ArrowUp size={18} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
