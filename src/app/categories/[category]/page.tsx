'use client';

import { useParams } from 'next/navigation';
import CategoriesDetail from '../../../pages/CategoriesDetail';

export default function CategoriesDetailPage() {
  const params = useParams();
  const category = params?.category as string;
  
  return <CategoriesDetail category={category} />;
}

