import Post from '@/pages/Post';

import fs from "fs";
import path from "path";
import { PostConfig } from '@/utils/types';

export function generateStaticParams() {
  const file = fs.readFileSync(
    path.join(process.cwd(), 'public/json/posts.json'),
    'utf-8',
  );

  const posts: PostConfig[] = JSON.parse(file);

  return posts.map(post => ({
    id: post.id,
  }));
}

export default async function PostDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  return <Post postId={decodedId} />;
}
