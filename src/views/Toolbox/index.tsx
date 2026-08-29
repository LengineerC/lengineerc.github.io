"use client";

import type { ReactNode } from 'react';
import PageTitle from '@/components/PageTitle';
import { useAppSelector } from '@/redux/hooks';
import Card from '@/components/Card';

import './index.scss';

export default function Toolbox({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  const darkMode = useAppSelector(state => state.ui.darkMode);

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title={'Toolbox ~ ' + subtitle} />
      </div>

      <div className="page-main-content">
        <Card darkMode={darkMode}>
          {/* <Suspense> */}
          {children}
          {/* </Suspense> */}
        </Card>
      </div>
    </div>
  );
}
