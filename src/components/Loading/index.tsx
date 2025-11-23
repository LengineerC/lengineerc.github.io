'use client';
import { useEffect, useState, forwardRef } from 'react'
import { useAppSelector } from '../../redux/hooks';

import "./index.scss"

const Loading = forwardRef<HTMLDivElement>((props, ref) => {
  const darkMode = useAppSelector((s) => s.ui.darkMode);

  return (
    <div
      ref={ref}
      className={`loading-main ${darkMode && "dark"}`}
    >
      <div className={!darkMode ? 'loader' : 'loader-dark'}>
        <div className="face face1">
          <div className="circle"></div>
        </div>

        <div className="face face2">
          <div>
            <div className="circle"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

Loading.displayName = 'Loading';

export default Loading;