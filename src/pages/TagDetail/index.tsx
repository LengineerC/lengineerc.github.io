'use client';
import PageTitle from "../../components/PageTitle";
import PostCard from "../../components/PostCard";
import { saveSelectedPostConfig } from "../../redux/slices/postSlice";
import { PostConfig } from "../../utils/types";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";

import './index.scss'
import { useEffect } from "react";

type TagDetailProps = {
  tag?: string;
};

export default function TagDetail({ tag }: TagDetailProps = {}) {
  const tagsList = useAppSelector(state => state.taxonomy.tagsList) ?? {};
  const tagsDetail = (tagsList as Record<string, any>)[tag as string];

  const dispatch = useAppDispatch();

  useEffect(()=>{
    console.log(tag)
  },[])

  const setSelectedPost = (selectedPost: PostConfig) => {
    dispatch(saveSelectedPostConfig(selectedPost));
  };

  const createPostCards = () => {
    if (tagsDetail && tagsDetail.length > 0) {
      return tagsDetail.map((post: PostConfig) => {
        return (
          <div
            style={{ width: "100%", marginBottom: "3vh" }}
            onClick={() => setSelectedPost(post)}
            key={post.id}
          >
            <PostCard
              config={post}
              key={post.id}
              limit={250}
              showLimitContent={true}
            />
          </div>
        )
      })
    }
  };

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title={tag as string} />
      </div>

      <div className="page-main-content">
        {createPostCards()}
      </div>
    </div>
  );
}