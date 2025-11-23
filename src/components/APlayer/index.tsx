'use client';
import { useEffect, useRef } from 'react';
import { IRC_TYPE, MUSIC_URL } from "../../utils/constants";

interface Props {
  className?: string;
};

export default function APlayer({ className }: Props) {
  const metingRef = useRef<any>(null);
  const effectRan = useRef<any>(null);

  useEffect(() => {
    if (effectRan.current) return;

    const checkAPlayerInstance = () => {
      if (metingRef.current && metingRef.current.aplayer) {
        const aplayerInstance = metingRef.current.aplayer;

        if (aplayerInstance) {
          console.log("Aplayer created successfully");

          if (!IRC_TYPE) {
            aplayerInstance.lrc.hide();
          }
        }
      } else {
        setTimeout(checkAPlayerInstance, 100);
      }
    };

    checkAPlayerInstance();
    effectRan.current = true;

    return () => {
      clearTimeout(checkAPlayerInstance as any);
    };
  }, []);

  return (
    <meting-js
      ref={metingRef}
      auto={MUSIC_URL}
      fixed={'true'}
      className={className}
      volume={0.5}
      IrcType={IRC_TYPE}
    />
  )
}