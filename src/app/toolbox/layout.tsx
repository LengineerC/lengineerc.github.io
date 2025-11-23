'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import { useAppSelector } from '@/redux/hooks';
import Card from '@/components/Card';

import '../../pages/Toolbox/index.scss';

export default function ToolboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const darkMode = useAppSelector((state) => state.ui.darkMode) ?? false;
  const [subtitle, setSubtitle] = useState<string>('');

  const pathname = usePathname();

  useEffect(() => {
    const paths = pathname?.split('/').filter(Boolean) ?? [];
    console.log(paths);
    const lastPath = paths[paths.length - 1];
    setSubtitle(lastPath === 'toolbox' ? 'menu' : lastPath || 'menu');
  }, [pathname]);

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title={'Toolbox ~ ' + subtitle} />
      </div>

      <div className="page-main-content">
        <Card darkMode={darkMode}>
          {children}
        </Card>
      </div>
    </div>
  );
}

