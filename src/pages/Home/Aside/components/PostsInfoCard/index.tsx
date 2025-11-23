'use client';
import Card from "@/components/Card"
import { Divider } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBook, faTag, faBookmark } from "@fortawesome/free-solid-svg-icons"
import { useAppSelector } from "@/redux/hooks";
import Link from "next/link"

import "./index.scss"

export default function PostsInfoCard() {
  const postsCount = useAppSelector(state => state.post.postList)?.length ?? 0;
  const tagsCount = Object.keys(useAppSelector(state => state.taxonomy.tagsList) ?? {}).length;
  const categoriesCount = Object.keys(useAppSelector(state => state.taxonomy.categoriesList) ?? {}).length;

  const darkMode = useAppSelector(state => state.ui.darkMode) ?? false;

  return (
    <Card
      className='aside-card'
      scale={true}
      darkMode={darkMode}
    >
      <div className="post-info-card-main">

        <div className="post-info-card-col-1">
          <div className={darkMode ? 'post-info-card-col-header-dark' : "post-info-card-col-header"}>
            <FontAwesomeIcon icon={faBook} /> 文章
          </div>
          <div className={darkMode ? 'post-info-card-col-content-dark' : "post-info-card-col-content"}>
            {postsCount}
          </div>
        </div>

        <Divider type="vertical" />

        <div className="post-info-card-col-2">
          <div className={darkMode ? 'post-info-card-col-header-dark' : "post-info-card-col-header"}>
            <FontAwesomeIcon icon={faTag} /> 标签
          </div>
          <div className={darkMode ? 'post-info-card-col-content-dark' : "post-info-card-col-content"}>
            <Link href="/tags" >
              {tagsCount}
            </Link>
          </div>
        </div>

        <Divider type="vertical" />

        <div className="post-info-card-col-3">
          <div className={darkMode ? 'post-info-card-col-header-dark' : "post-info-card-col-header"}>
            <FontAwesomeIcon icon={faBookmark} /> 分类
          </div>
          <div className={darkMode ? 'post-info-card-col-content-dark' : "post-info-card-col-content"}>
            <Link href="/categories" >
              {categoriesCount}
            </Link>
          </div>
        </div>

      </div>
    </Card>
  )
}