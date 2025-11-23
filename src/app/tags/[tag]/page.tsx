'use client';

import { useParams } from 'next/navigation';
import TagDetail from '../../../pages/TagDetail';

export default function TagDetailPage() {
  const params = useParams();
  const tag = params?.tag as string;
  
  return <TagDetail tag={tag} />;
}
