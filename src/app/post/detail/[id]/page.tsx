'use client';

import { useParams, useRouter } from 'next/navigation';
// import { useState, useEffect } from 'react';
import Post from '../../../../pages/Post';

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  return <Post postId={id} />;
}

