'use client';
import { useEffect, useState } from 'react'
import Card from '../../../../../components/Card'
import Tag from '../../../../../components/Tag';

import "./index.scss"
import { useAppSelector } from '../../../../../redux/hooks';

export default function TagsCard() {
  const tagsList = useAppSelector(state => state.taxonomy.tagsList);
  const darkMode = useAppSelector(state => state.ui.darkMode) ?? false;
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (tagsList && typeof tagsList === 'object' && !Array.isArray(tagsList)) {
      setTags(Object.keys(tagsList));
    } else if (Array.isArray(tagsList)) {
      // 如果 tagsList 是数组，可能需要不同的处理方式
      setTags([]);
    }
  }, [tagsList])

  const createTags=()=>{
    if(tags.length>0){
      return tags.map(tag=>{
        return(
          <div className='tag-container' key={tag}>
            <Tag tag={tag}/>
          </div>
        )
      })
    }
  }
  
  return (
    <Card
    className='aside-card' 
    scale={true}
    darkMode={darkMode}
    >
      <div className='tags-card-main'>
        {createTags()}
      </div>
    </Card>
  )
}