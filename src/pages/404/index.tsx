'use client';
import PageTitle from '../../components/PageTitle'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Card from '../../components/Card'
import { useAppSelector } from '../../redux/hooks'

import './index.scss'

export default function ErrorPage() {
  const pathname=usePathname();
  const fromPath=pathname;
  const darkMode=useAppSelector(state=>state.ui.darkMode) ?? false;

  const createXmark=(n:number)=>{
    return Array.from({length:n},(_,index)=>(
      <div className='xmark-block' key={index}>
        <FontAwesomeIcon icon={faXmark}/>
      </div>
    ))
  }

  return (
    <div className='page-main'>
      <div className='page-main-title'>
        <PageTitle title='404 ERROR'/>
      </div>

      <div className='page-main-content'>
        
        <div className='xmark-line'>
          {/* {isMobile?createXmark(10):createXmark(20)} */}
          {createXmark(10)}
        </div>
        <Card darkMode={darkMode}>

        <div className='error-info-block'>
          <div style={{marginRight:"5px"}}><FontAwesomeIcon icon={faCircleExclamation}/>&nbsp;ErrorInfo:</div>
          <div style={{fontStyle:"italic"}}>
            path "{fromPath}" not found!
          </div>
        </div>

        <div className='return-btn-block'>
          <Link href="/" style={{textDecoration:"none"}}>
            <div className='return-click-block'>
              RETURN
            </div>
          </Link>
        </div>

        </Card>
      </div>
    </div>
  )
}