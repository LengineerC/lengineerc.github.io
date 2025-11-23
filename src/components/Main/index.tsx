'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Loading from '../Loading';

import './index.scss';

export default function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartTime = useRef(0);
  const minimumLoadingTime = 700; 
  const loadingNodeRef = useRef<HTMLDivElement>(null);
  const pageNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setShowLoading(true);
    loadingStartTime.current = Date.now();
  }, [pathname]);

  const handleLoadingFinish = () => {
    const elapsed = Date.now() - loadingStartTime.current;
    const remaining = Math.max(minimumLoadingTime - elapsed, 0);

    setTimeout(() => {
      setIsLoading(false);
      setShowLoading(false);
    }, remaining);
  };

  return (
    <main>
      <TransitionGroup>
        {showLoading && (
          <CSSTransition
            nodeRef={loadingNodeRef}
            in={isLoading}
            timeout={500}
            classNames="loading-transition"
            unmountOnExit
          >
            <Loading ref={loadingNodeRef} />
          </CSSTransition>
        )}

        <CSSTransition
          nodeRef={pageNodeRef}
          key={pathname}
          timeout={500}
          classNames="page-transition"
        >
          <div ref={pageNodeRef}>
            <Suspense
              fallback={
                <span style={{ display: 'none' }} />
              }
            >
              <LoadingTracker onFinish={handleLoadingFinish} />
              {children}
            </Suspense>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </main>
  );
}

type Props={
  onFinish:()=>void
}
function LoadingTracker({ onFinish }:Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }

    onFinish();
  }, [isMounted, onFinish]);

  return null;
}
