"use client";

import PageTitle from '../../components/PageTitle';
import PostCard from '../../components/PostCard';
import { PostConfig } from '../../utils/types';

import './index.scss';
import { useAppSelector } from '../../redux/hooks';

export default function TagDetail({ tag }: { tag: string }) {
  // const [tagsDetail,setTagsDetail]=useState<PostConfig[]>();
  const tagsDetail = useAppSelector(state => state.taxonomy.tagsList)[tag];

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

  const createPostCards = () => {
    if (tagsDetail && tagsDetail.length > 0) {
      return tagsDetail.map((post: PostConfig) => {
        return (
          <div style={{ width: '100%', marginBottom: '3vh' }} key={post.id}>
            <PostCard config={post} />
          </div>
        );
      });
    }
  };

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title={tag} />
      </div>

      <div className="page-main-content">{createPostCards()}</div>
    </div>
  );
}
