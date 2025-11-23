'use client';
import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Tag from '@/components/Tag';
import { useAppSelector } from '@/redux/hooks';

import "./index.scss"

export default function TagsCard() {
  const tagsList = useAppSelector(state => state.taxonomy.tagsList);
  const darkMode = useAppSelector(state => state.ui.darkMode) ?? false;
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (tagsList && typeof tagsList === 'object' && !Array.isArray(tagsList)) {
      setTags(Object.keys(tagsList));
    } else if (Array.isArray(tagsList)) {
      setTags([]);
    }
  }, [tagsList])

  const createTags = () => {
    if (tags.length > 0) {
      return tags.map(tag => {
        return (
          <div className='tag-container' key={tag}>
            <Tag tag={tag} />
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
  );
}