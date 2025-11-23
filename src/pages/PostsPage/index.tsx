'use client';
import Link from "next/link"
import PageTitle from "../../components/PageTitle"
import TopPostCard from "../Home/Aside/components/TopPostCard"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTag, faBookmark, } from "@fortawesome/free-solid-svg-icons"
// import { useEffect, useState } from "react"
// import store from "../../redux/store"
import { useAppSelector } from "../../redux/hooks"

import "./index.scss"
import { useEffect, useState } from "react";

// 过渡组件，可整合进menu || 整合Aside
export default function PostsPage() {
  const darkMode = useAppSelector(state => state.ui.darkMode) ?? false;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title="Posts" />
      </div>

      <div className="page-main-content">
        <div className="posts-page-btn-line">
          <div className={darkMode ? "choose-btn-dark" : "choose-btn"}>
            <Link
              style={{ textDecoration: "none", color: `${darkMode ? '#ffffffaa' : 'rgb(0, 20, 71)'}`, width: "100%" }}
              href="/tags"
            >
              <FontAwesomeIcon icon={faTag} />
            </Link>
          </div>

          <div className={darkMode ? "choose-btn-dark" : "choose-btn"}>
            <Link
              style={{ textDecoration: "none", color: `${darkMode ? '#ffffffaa' : 'rgb(0, 20, 71)'}`, width: "100%" }}
              href="/categories"
            >
              <FontAwesomeIcon icon={faBookmark} />
            </Link>
          </div>
        </div>
        <TopPostCard />
      </div>
    </div>
  )
}