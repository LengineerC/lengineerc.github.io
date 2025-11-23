'use client';
import axios from 'axios'
import { useEffect, useState } from 'react'
import { HITOKOTO_GET_ENABLE, SUB_TITLE_ENABLE, SUB_TITLE_TEXTS } from '../../utils/constants';
import './index.scss'
import { genRandomInt } from '@/utils/functions';

const jinrishici = require('jinrishici');
export default function Hitokoto() {
  // 使用固定的默认值，避免服务端和客户端渲染不一致
  const [sentence, setSentence] = useState<string>(SUB_TITLE_TEXTS[0]);

  useEffect(() => {
    // 仅在客户端设置随机值或从 API 获取
    if (HITOKOTO_GET_ENABLE && SUB_TITLE_ENABLE) {
      axios.get('https://v1.hitokoto.cn')
        .then(({ data }) => {
          setSentence(data.hitokoto);
        })
        .catch(e => {
          console.log("hitokoto获取失败", e);
          console.log("获取今日诗词");
          jinrishici.load((result: any) => {
            setSentence(result.data.content);
          }, (errData: any) => {
            console.log(errData);
          });
        })
    } else if (SUB_TITLE_ENABLE) {
      // 如果未启用 API，则在客户端设置随机值
      setSentence(SUB_TITLE_TEXTS[genRandomInt(0, SUB_TITLE_TEXTS.length - 1)]);
    }

  }, [])

  return (
    <div className='hitokoto' style={{ '--sentence-length': `${sentence.length}ch` } as React.CSSProperties}>
      {sentence}
    </div>
  )
}