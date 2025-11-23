import TagDetail from '@/pages/TagDetail';
import fs from "fs";
import path from "path";
import { Tags } from '@/utils/types';

export function generateStaticParams() {
  const file = fs.readFileSync(
    path.join(process.cwd(), 'public/json/tags.json'),
    'utf-8',
  );

  const tags: Tags = JSON.parse(file);

  return Object.keys(tags).map((tag) => ({
    tag: encodeURIComponent(tag)
  }));
}

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodeTag = decodeURIComponent(tag);

  return <TagDetail tag={decodeTag} />;
}
