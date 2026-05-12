import Card from '../../../components/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import MarkdownNavbar from './MarkdownNavBar/index';
import { ConfigProvider, Drawer } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { MOBILE_MAX_WIDTH } from '../../../utils/constants';
import { useAppSelector } from '../../../redux/hooks';

import './index.scss';

type Props = {
  markdown: string;
  showDrawer: boolean;
  callbackOnClose: Function;
};

export default function TOC({ markdown, showDrawer, callbackOnClose }: Props) {
  const [open, setOpen] = useState<boolean>(showDrawer);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(
    window.innerWidth <= MOBILE_MAX_WIDTH,
  );
  const darkMode = useAppSelector(state => state.ui.darkMode);
  const tocSource = useMemo(
    () =>
      markdown.replace(
        /[`~]{3,}[\s\S]*?[`~]{3,}/g,
        '',
      ),
    [markdown],
  );

  useEffect(() => {
    setOpen(showDrawer);
  }, [showDrawer]);

  const onClose = () => {
    setOpen(false);
    callbackOnClose();
  };

  useEffect(() => {
    // const unsubscribe=store.subscribe(()=>{
    //   const {darkMode}=store.getState();
    //   setIsDarkMode(darkMode);
    // })

    const handleResize = () => {
      setDrawerVisible(window.innerWidth <= MOBILE_MAX_WIDTH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getColorBgElevated = (): string => {
    return darkMode ? '#1c1c2c99' : '#ffffffcc';
  };

  // const onHashChange=(newHash:any, oldHash:any)=>{
  //   console.log(newHash,oldHash);

  //   window.history.replaceState(null,"",`${window.location.href}#${newHash}`);
  // }

  // const onNavItemClick=(event:any,element:any,hashValue:any)=>{
  //   // console.log(event,element,hashValue);
  //   console.log(window.location);
  //   window.history.replaceState(null,"",`${window.location.href}#${hashValue}`);
  // }

  return (
    <>
      {!drawerVisible ? (
        <Card className="aside-card" darkMode={darkMode}>
          <div className={darkMode ? 'toc-header-dark' : 'toc-header'}>
            <FontAwesomeIcon icon={faList} />
            &nbsp;目录
            <hr />
          </div>
          <div className={darkMode ? 'toc-content-dark' : 'toc-content'}>
            <MarkdownNavbar
              source={tocSource}
              // updateHashAuto={false}
              headingTopOffset={60}
              ordered={true}
            />
          </div>
        </Card>
      ) : (
        <div className="toc-drawer-block">
          <ConfigProvider
            theme={{
              token: {
                padding: 0,
                paddingLG: 0,
                paddingXS: 0,
                colorBgElevated: getColorBgElevated(),
              },
            }}
          >
            <Drawer
              className={darkMode ? 'toc-drawer-dark' : 'toc-drawer'}
              placement="right"
              open={open}
              onClose={onClose}
              width={250}
              closeIcon={null}
            // destroyOnClose  //不加此项测试运行手机端不显示目录时滑动过快报错，正式运行不影响，但性能会受损
            >
              <div className={darkMode ? 'toc-header-dark' : 'toc-header'}>
                <FontAwesomeIcon icon={faList} />
                &nbsp;目录
                <hr />
              </div>
              <div className="toc-content">
                <MarkdownNavbar
                  // onNavItemClick={(event,element,hash)=>handleClick(event,element,hash)}
                  source={tocSource}
                  // updateHashAuto={false}
                  headingTopOffset={60}
                  ordered={true}
                />
              </div>
            </Drawer>
          </ConfigProvider>
        </div>
      )}
    </>
  );
}