'use client';
import { useEffect, useState } from "react";
import PageTitle from "../../components/PageTitle";
import store from "../../redux/store";
import PostCard from "../../components/PostCard";
import { saveSelectedPostConfig } from "../../redux/slices/postSlice";
import { PostConfig } from "../../utils/types";

import './index.scss'
import { useAppSelector, useAppDispatch } from "../../redux/hooks";

type TagDetailProps = {
  tag?: string;
};

export default function TagDetail({ tag }: TagDetailProps = {}) {
  // const [tagsDetail,setTagsDetail]=useState<PostConfig[]>();
  const tagsDetail=useAppSelector(state=>state.taxonomy.tagsList)[tag as string];

  // useEffect(()=>{
  //   const {tagsList}=store.getState();
  //   setTagsDetail(tagsList[tag as string]);

  //   const unsubscribe=store.subscribe(()=>{
  //     const {tagsList}=store.getState();
  //     setTagsDetail(tagsList[tag as string]);
  //   })

  //   return ()=>{
  //     unsubscribe();
  //   }

  // },[tag])

  const dispatch = useAppDispatch();
  
  const setSelectedPost=(selectedPost:PostConfig)=>{
    // console.log(selectedPost);
    dispatch(saveSelectedPostConfig(selectedPost));
  }

  const createPostCards=()=>{
    if(tagsDetail && tagsDetail.length>0){
      return tagsDetail.map((post:PostConfig)=>{
        return(
          <div 
          style={{width:"100%",marginBottom:"3vh"}} 
          onClick={()=>setSelectedPost(post)}
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

  }

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title={tag as string}/>
      </div>

      <div className="page-main-content">
        {createPostCards()}
      </div>
    </div>
  )
}