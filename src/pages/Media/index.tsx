'use client';
import { useEffect, useRef, useState } from 'react';
import Card from '../../components/Card';
import PageTitle from '../../components/PageTitle';
import { BILIBILI_VIDEO_URL, MUSIC_URL } from '../../utils/constants';
import { useAppSelector } from '../../redux/hooks';

import './index.scss';

export default function Media() {
  const aplayerRef=useRef(null);
  const effectRan=useRef<boolean>(false);
  const darkMode=useAppSelector(state=>state.ui.darkMode) ?? false;
  const [isMounted, setIsMounted] = useState(false);

  // 确保只在客户端渲染 meting-js，避免 hydration 错误
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if(!isMounted || effectRan.current) return;

    let aplayerInstance:any=null;
    const checkAPlayerInstance = () => {
      if (aplayerRef.current && (aplayerRef as any).current.aplayer) {
        aplayerInstance = (aplayerRef as any).current.aplayer;
        
      } else {
        setTimeout(checkAPlayerInstance, 100);
      }
    };

    checkAPlayerInstance();
    effectRan.current=true;

    return () => {
      if(aplayerInstance){
        (aplayerInstance as any).destroy();
      }
      effectRan.current=false;
    };
  }, [isMounted]);

  return (
    <div className="page-main">
      <div className="page-main-title">
        <PageTitle title="Media" />
      </div>
      <div className="page-main-content">
        <Card darkMode={darkMode}>
          <div className="media-card-main">
            <div className={darkMode?'media-title-dark':'media-title'}>
              🎶穢れなき音楽室
            </div>
            <div className={darkMode?'media-card-main-player-dark':"media-card-main-player"}>
              {isMounted && (
                <meting-js 
                  ref={aplayerRef}
                  auto={MUSIC_URL}
                  theme="#67abff"
                  volume={0.5}
                  // IrcType={IRC_TYPE}
                />
              )}
            </div>

            <div className={darkMode?'media-title-dark':'media-title'}>
              📺远古视频
            </div>
            <div className='media-card-main-video'>
              <iframe 
                src={BILIBILI_VIDEO_URL}
                scrolling="no" 
                frameBorder="no" 
                allowFullScreen={true}
                >
              </iframe>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
