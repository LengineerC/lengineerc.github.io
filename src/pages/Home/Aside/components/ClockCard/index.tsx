'use client';
import { useEffect, useState } from "react";
import Card from "../../../../../components/Card";
// import store from "../../../../../redux/store";
import { useAppSelector } from "../../../../../redux/hooks";
import Clock from "@/components/Clock";

import './index.scss';

export default function ClockCard() {
  const darkMode=useAppSelector(state=>state.ui.darkMode) ?? false;

  return (
    <Card
    className="aside-card"
    scale={true}
    background={
      darkMode?"rgba(20, 7, 94, 0.5)":"#BAD8F0AA"
      // 'linear-gradient(90deg,rgba(35, 9, 184, 0.5),rgba(20, 7, 94, 0.5)'
      // :"linear-gradient(90deg,rgba(27, 109, 209,0.5),rgba(177, 255, 82, 0.5))"
    }
    darkMode={darkMode}
    >
      <div className="clock-card-main">
        {/* {getFormattedDate(date)} */}
        <Clock 
          width={150}
          height={150}
        />
      </div>
    </Card>
  )
}