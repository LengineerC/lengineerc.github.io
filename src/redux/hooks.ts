'use client';
import { ReactReduxContext } from 'react-redux';
import { useContext, useMemo, useRef, useEffect, useState } from 'react';
import type { RootState, AppDispatch } from './store';

// 包装 useDispatch 以处理 SSR
export function useAppDispatch(): AppDispatch {
  const contextValue = useContext(ReactReduxContext);
  
  // 使用 useMemo 来避免违反 hooks 规则
  return useMemo(() => {
    // 如果 context 或 store 不存在（SSR 场景），返回一个 noop 函数
    if (!contextValue || !contextValue.store) {
      return (() => {}) as AppDispatch;
    }
    
    // 正常情况，直接使用 store 的 dispatch
    return contextValue.store.dispatch as AppDispatch;
  }, [contextValue]);
}

// 包装 useSelector 以处理 SSR
export function useAppSelector<TSelected = unknown>(
  selector: (state: RootState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected {
  const contextValue = useContext(ReactReduxContext);
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  const [, forceUpdate] = useState({});
  const previousSelectedRef = useRef<TSelected | undefined>(undefined);
  
  // 更新 refs（必须在所有条件之前调用 hooks）
  useEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  });
  
  // 使用 useMemo 来计算 selected 值
  const selected = useMemo(() => {
    // 如果 context 或 store 不存在（SSR 场景），返回 undefined
    if (!contextValue || !contextValue.store) {
      return undefined as TSelected;
    }
    
    // 正常情况，使用 selector 从 store 中获取值
    const store = contextValue.store;
    const state = store.getState() as RootState;
    return selectorRef.current(state);
  }, [contextValue, selector]);
  
  // 设置订阅以在 store 更新时重新渲染
  useEffect(() => {
    // 如果 context 或 store 不存在，不设置订阅
    if (!contextValue || !contextValue.store) {
      return;
    }
    
    const store = contextValue.store;
    
    // 订阅 store 更新
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState() as RootState;
      const currentSelected = selectorRef.current(currentState);
      
      // 使用 equalityFn 比较（如果提供）
      const isEqual = equalityFnRef.current
        ? equalityFnRef.current(previousSelectedRef.current as TSelected, currentSelected)
        : previousSelectedRef.current === currentSelected;
      
      if (!isEqual) {
        previousSelectedRef.current = currentSelected;
        forceUpdate({});
      }
    });
    
    return unsubscribe;
  }, [contextValue, forceUpdate]);
  
  // 更新 previousSelectedRef
  if (selected !== undefined) {
    previousSelectedRef.current = selected;
  }
  
  return selected;
}

