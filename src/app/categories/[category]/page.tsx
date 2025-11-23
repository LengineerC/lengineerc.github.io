import CategoriesDetail from '@/pages/CategoriesDetail';
import fs from "fs";
import path from "path";
import { Categories } from '@/utils/types';

export function generateStaticParams() {
  const file = fs.readFileSync(
    path.join(process.cwd(), 'public/json/categories.json'),
    'utf-8',
  );

  const categories: Categories = JSON.parse(file);

  return Object.keys(categories).map((category) => ({
    category: encodeURIComponent(category)
  }));
}

export default async function CategoriesDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const decodeCategoty = decodeURIComponent(category);

  return <CategoriesDetail category={decodeCategoty} />;
}
