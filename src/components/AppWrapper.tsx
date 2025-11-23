'use client';

import { lazy, useEffect, useState } from 'react'
import Nav from './Nav';
import Main from './Main';
import { MenuOutlined, SunFilled, MoonFilled } from '@ant-design/icons';
import { setDarkModeOFF, setDarkModeON } from '../redux/slices/uiSlice';
import { savePostList } from '../redux/slices/postSlice';
import { saveTagsList, saveCategoriesList } from '../redux/slices/taxonomySlice';
import Footer from './Footer';
import Top from './Top';
import axios from 'axios';
import APlayer from './APlayer';
import { SHOW_APLAYER } from '../utils/constants';
import { BACKGROUND_IMG } from '../utils/constants';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { Dispatch } from 'redux';
import '../App.scss';
import ReduxProvider from '@/redux/Provider';

const MobileMenu = lazy(() => import('./MobileMenu/index'));

function App({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const darkMode: boolean = useAppSelector(state => state.ui.darkMode) ?? false;
  const dispatch: Dispatch = useAppDispatch();

  const getBodyStyleInnerHtml = (isDarkMode: boolean): string => {
    return isDarkMode ? (`
      body::-webkit-scrollbar {
        width: 12px;
      }
      body::-webkit-scrollbar-track {
        background: linear-gradient(#9191a7, #8888a7);
        border-radius: 100px;
      }
      body::-webkit-scrollbar-thumb {
        background: linear-gradient(#686894, #46466c);
        border-radius: 50px;
      }
      body::-webkit-scrollbar-thumb:active {
        background: linear-gradient(#7c7ca5, #61618f);
      }
    `) : (`
      body::-webkit-scrollbar {
        width: 12px;
      }
      body::-webkit-scrollbar-track {
        background: linear-gradient(#b7f9ff, #a3c8db);
        border-radius: 100px;
      }
      body::-webkit-scrollbar-thumb {
        background: linear-gradient(rgb(103, 171, 255), rgb(62, 125, 202));
        border-radius: 50px;
      }
      body::-webkit-scrollbar-thumb:active {
        background: linear-gradient(rgb(123, 182, 255), rgb(82, 145, 223));
      }
    `);
  };

  useEffect(() => {
    const bodyStyle = document.querySelector('#bodyStyle') as HTMLElement;
    if (bodyStyle) {
      bodyStyle.innerHTML = getBodyStyleInnerHtml(darkMode);
    }

    //获取文章列表
    axios.get('/json/posts.json')
      .then(response => {
        const { data } = response;
        dispatch(savePostList(data));
      }).catch(err => {
        console.log("文章列表获取失败", err);
      })

    // 获取Tags数据
    axios.get('/json/tags.json')
      .then(response => {
        const { data } = response;
        dispatch(saveTagsList(data));
      })
      .catch(err => {
        console.log("获取Tags列表失败", err);
      })

    // 获取Categories数据
    axios.get('/json/categories.json')
      .then(response => {
        const { data } = response;
        dispatch(saveCategoriesList(data));
      })
      .catch(err => {
        console.log("获取Categories列表失败", err);
      })

    let localStorageDarkMode = localStorage.getItem('darkMode') || 'false';

    if (localStorageDarkMode === 'false') {
      dispatch(setDarkModeOFF());
    } else {
      dispatch(setDarkModeON());
    }
  }, []);

  useEffect(() => {
    const bodyStyle = document.querySelector('#bodyStyle') as HTMLElement;
    if (bodyStyle) {
      bodyStyle.innerHTML = getBodyStyleInnerHtml(darkMode);
    }
  }, [darkMode]);

  const changeDarkMode = () => {
    if (darkMode) {
      dispatch(setDarkModeOFF());
      localStorage.setItem('darkMode', 'false');
    } else {
      dispatch(setDarkModeON());
      localStorage.setItem('darkMode', 'true');
    }
  };

  // 处理移动端菜单按钮
  const handleMenuOpen = () => {
    setShowMenu(true);
  };
  const handleMenuClose = () => {
    setShowMenu(false);
  };

  return (
    <div
      className="App"
      style={{
        '--bgImg': `url(${darkMode ? (typeof BACKGROUND_IMG.DARK === 'string' ? BACKGROUND_IMG.DARK : BACKGROUND_IMG.DARK.src) : (typeof BACKGROUND_IMG.LIGHT === 'string' ? BACKGROUND_IMG.LIGHT : BACKGROUND_IMG.LIGHT.src)})`
      } as React.CSSProperties}
    >
      <MobileMenu open={showMenu} handleMenuClose={handleMenuClose} />

      <div className='mobile-toolbar'>

        <div className='icon-container'>
          <div className='icon-block' onClick={handleMenuOpen}>
            <MenuOutlined />
          </div>
        </div>

        <div className='icon-container' style={{ "justifyContent": "flex-end" }}>
          <div className='icon-block' onClick={changeDarkMode}>
            {!darkMode ? <MoonFilled /> : <SunFilled />}
          </div>
        </div>

      </div>
      <Nav />
      <Main>{children}</Main>/
      <Top darkMode={darkMode} />
      <Footer />

      {
        SHOW_APLAYER &&
        <APlayer className={darkMode ? "aplayer-container-dark" : "aplayer-container"} />
      }

    </div>
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <App>
        {children}
      </App>
    </ReduxProvider>
  );
}
