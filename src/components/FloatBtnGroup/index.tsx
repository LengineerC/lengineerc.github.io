"use client";

import { ConfigProvider, FloatButton } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { usePostContext } from '@/context/PostContext';
import { useAppSelector } from '@/redux/hooks';
import Top from '../Top';

import './index.scss';

export default function FloatBtnGroup() {
  const { inPost, setShowTOC, setShowTOCDrawer } = usePostContext();
  const pathname = usePathname();
  const showPostControls = inPost || pathname.startsWith('/post/detail/');
  const darkMode: boolean = useAppSelector(state => state.ui.darkMode);
  const handleShowTOC = () => {
    setShowTOC(v => !v);
    setShowTOCDrawer(v => !v);
  }

  const getTocBtnToken = () => {
    let colorBgElevated = darkMode ? '#46466c7b' : '#ffffff7b';
    let colorFillContent = darkMode ? '#686894bb' : '#ffffffbb';
    let colorText = '#ffffff99';
    let token: any = {
      colorBgElevated,
      colorFillContent,
    };
    if (darkMode) {
      if (!token.hasOwnProperty('colorText')) {
        token['colorText'] = colorText;
      }
    }
    return token;
  };

  return (
    <FloatButton.Group className="float-btn-group" style={{ boxShadow: 'none' }} shape='square'>
      {showPostControls && <ConfigProvider
        theme={{
          token: getTocBtnToken(),
        }}
      >
        <FloatButton
          className="float-btn"
          icon={<UnorderedListOutlined />}
          tooltip="文章目录"
          onClick={handleShowTOC}
        />
      </ConfigProvider>}
      <Top className='float-btn' darkMode={darkMode} />
    </FloatButton.Group>
  )
}
