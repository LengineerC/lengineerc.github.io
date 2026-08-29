"use client";

import { MenuOutlined, MoonFilled, SunFilled } from "@ant-design/icons";
import { ConfigProvider } from "antd";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Provider } from "react-redux";
import APlayer from "@/components/APlayer";
import DarkModeAnimation from "@/components/DarkModeAnimation";
import Footer from "@/components/Footer";
import MobileMenu from "@/components/MobileMenu";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import { PostProvider } from "@/context/PostContext";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import store from "@/redux/store";
import { setDarkModeOFF, setDarkModeON } from "@/redux/slices/uiSlice";
import {
  BACKGROUND_IMG,
  CUSTOM_FONT_FAMILY,
  SHOW_APLAYER,
  SHOW_SCROLLBAR,
} from "@/utils/constants";
import { withBasePath } from "@/utils/basePath";

import "@/App.scss";

function getScrollbarStyles(darkMode: boolean) {
  if (!SHOW_SCROLLBAR) return "body::-webkit-scrollbar { display: none; }";
  return darkMode
    ? `body::-webkit-scrollbar{width:12px}body::-webkit-scrollbar-track{background:linear-gradient(#9191a7,#8888a7);border-radius:100px}body::-webkit-scrollbar-thumb{background:linear-gradient(#686894,#46466c);border-radius:50px}`
    : `body::-webkit-scrollbar{width:12px}body::-webkit-scrollbar-track{background:linear-gradient(#b7f9ff,#a3c8db);border-radius:100px}body::-webkit-scrollbar-thumb{background:linear-gradient(rgb(103,171,255),rgb(62,125,202));border-radius:50px}`;
}

function Shell({ children }: { children: ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const darkMode = useAppSelector((state) => state.ui.darkMode);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedMode = window.localStorage.getItem("darkMode");
    dispatch(storedMode === "true" ? setDarkModeON() : setDarkModeOFF());
  }, [dispatch]);

  useEffect(() => {
    const bodyStyle = document.querySelector<HTMLStyleElement>("#bodyStyle");
    if (bodyStyle) bodyStyle.textContent = getScrollbarStyles(darkMode);
  }, [darkMode]);

  const changeDarkMode = () => {
    setShowAnimation(true);
    window.setTimeout(() => {
      const nextDarkMode = !darkMode;
      dispatch(nextDarkMode ? setDarkModeON() : setDarkModeOFF());
      window.localStorage.setItem("darkMode", String(nextDarkMode));
    }, 500);
  };

  return (
    <div
      className={`App ${darkMode ? "dark" : ""}`}
      style={
        {
          "--bgImg": `url(${withBasePath(darkMode ? BACKGROUND_IMG.DARK.src : BACKGROUND_IMG.LIGHT.src)})`,
        } as CSSProperties
      }
    >
      <AnimatePresence>
        {showAnimation ? (
          <DarkModeAnimation
            key="dark-animation"
            darkMode={darkMode}
            onFinish={() => setShowAnimation(false)}
          />
        ) : null}
      </AnimatePresence>

      <MobileMenu open={showMenu} handleMenuClose={() => setShowMenu(false)} />
      <div className="mobile-toolbar">
        <div className="icon-container">
          <button className="icon-block" type="button" aria-label="打开菜单" onClick={() => setShowMenu(true)}>
            <MenuOutlined />
          </button>
        </div>
        <div className="icon-container" style={{ justifyContent: "flex-end" }}>
          <button className="icon-block" type="button" aria-label="切换主题" onClick={changeDarkMode}>
            {darkMode ? <SunFilled /> : <MoonFilled />}
          </button>
        </div>
      </div>

      <Nav toggleDarkMode={changeDarkMode} />
      <PageTransition>{children}</PageTransition>
      <Footer />

      {SHOW_APLAYER ? (
        <div className={darkMode ? "aplayer-container-dark" : "aplayer-container"}>
          <APlayer />
        </div>
      ) : null}
    </div>
  );
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { fontFamily: CUSTOM_FONT_FAMILY } }}>
      <Provider store={store}>
        <PostProvider>
          <Shell>{children}</Shell>
        </PostProvider>
      </Provider>
    </ConfigProvider>
  );
}
