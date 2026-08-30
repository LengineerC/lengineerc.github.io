"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faBookmark,
  faCompass,
  faHouse,
  faLocationDot,
  faSatelliteDish,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter } from "next/navigation";
import { NavLink } from "@/components/RouterCompat";
import { useAppSelector } from "@/redux/hooks";

import "./index.scss";

export default function ErrorPage() {
  const fromPath = usePathname();
  const router = useRouter();
  const darkMode = useAppSelector((state) => state.ui.darkMode);

  let displayPath = fromPath;
  try {
    displayPath = decodeURI(fromPath);
  } catch {
    // Keep the original path if it contains malformed escape sequences.
  }

  return (
    <main className={`not-found-page ${darkMode ? "not-found-page-dark" : ""}`}>
      <section className="not-found-layout" aria-labelledby="not-found-title">
        <div className="not-found-visual" aria-hidden="true">
          <div className="signal-label">
            <FontAwesomeIcon icon={faSatelliteDish} />
            <span>SIGNAL LOST</span>
          </div>

          <div className="error-number">
            <span>4</span>
            <span className="error-zero">
              <span className="orbit orbit-outer" />
              <span className="orbit orbit-inner" />
              <FontAwesomeIcon icon={faCompass} />
            </span>
            <span>4</span>
          </div>

          <div className="coordinate-line">
            <span />
            <FontAwesomeIcon icon={faLocationDot} />
            <span />
          </div>
        </div>

        <div className="not-found-panel">
          <div className="panel-index">ERR / 404</div>
          <h1 id="not-found-title">这一页走丢了</h1>
          <p className="not-found-description">
            你到达了一个尚未存在，或已经移动的页面。
            <br />
            可以按照下面的方式继续浏览。
          </p>

          <div className="lost-path">
            <span className="lost-path-label">
              <FontAwesomeIcon icon={faLocationDot} />
              丢失坐标
            </span>
            <code>{displayPath}</code>
          </div>

          <div className="primary-actions">
            <NavLink className="error-action error-action-primary" to="/">
              <FontAwesomeIcon icon={faHouse} />
              <span>回到首页</span>
            </NavLink>
            <button
              className="error-action error-action-secondary"
              type="button"
              onClick={() => router.back()}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>返回上一页</span>
            </button>
          </div>

          <div className="route-divider">
            <span>或者重新选择</span>
          </div>

          <nav className="recovery-routes" aria-label="404 页面快捷导航">
            <NavLink to="/categories">
              <span className="route-icon">
                <FontAwesomeIcon icon={faBookmark} />
              </span>
              <span>
                <strong>分类</strong>
                <small>按主题查找</small>
              </span>
            </NavLink>
            <NavLink to="/tags">
              <span className="route-icon">
                <FontAwesomeIcon icon={faTag} />
              </span>
              <span>
                <strong>标签</strong>
                <small>发现相关文章</small>
              </span>
            </NavLink>
          </nav>

          <div className="panel-footer">
            <span className="status-dot" />
            <span>Navigation system online</span>
          </div>
        </div>
      </section>
    </main>
  );
}
