/**
 * PWA 전용 당겨서 새로고침 훅
 * - display-mode: standalone (또는 iOS navigator.standalone) 일 때만 활성화
 * - 브라우저에서는 isPWA === false 로 리스너가 등록되지 않아 동작 없음
 * - window 최상단(scrollY === 0)에서 아래로 당길 때 콜백 호출
 */
"use client";

import { useEffect, useRef, useState } from "react";

/** 새로고침을 트리거할 최소 당김 거리 (px) */
const PULL_THRESHOLD = 60;
/** 당김 인디케이터의 최대 표시 높이 (px) */
const MAX_PULL = 80;

interface PullToRefreshResult {
  /** 현재 당김 거리 (0 ~ MAX_PULL) */
  pullDistance: number;
  /** 새로고침 진행 중 여부 */
  isRefreshing: boolean;
  /** PWA(standalone) 모드 여부 */
  isPWA: boolean;
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  disabled = false
): PullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // stale closure 방지: ref 로 현재 값을 동기 추적
  const touchStartY = useRef(0);
  const currentPull = useRef(0);
  const isPulling = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  // PWA 모드 감지 (클라이언트 전용)
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const ios = (navigator as { standalone?: boolean }).standalone === true;
    setIsPWA(mq.matches || ios);

    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches || ios);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 터치 리스너: PWA 모드이고 disabled 가 아닐 때만 등록
  useEffect(() => {
    if (!isPWA || disabled) return;

    function handleTouchStart(e: TouchEvent) {
      // 스크롤 최상단이 아니면 무시
      if (window.scrollY > 0 || isRefreshingRef.current) return;
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = false;
      currentPull.current = 0;
    }

    function handleTouchMove(e: TouchEvent) {
      if (window.scrollY > 0 || isRefreshingRef.current) return;

      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY <= 0) {
        if (isPulling.current) {
          isPulling.current = false;
          currentPull.current = 0;
          setPullDistance(0);
        }
        return;
      }

      isPulling.current = true;
      // 저항감(0.5배) + 최대 높이 제한
      const distance = Math.min(deltaY * 0.5, MAX_PULL);
      currentPull.current = distance;
      setPullDistance(distance);

      // 네이티브 오버스크롤(고무줄 효과) 차단
      e.preventDefault();
    }

    async function handleTouchEnd() {
      if (!isPulling.current) return;
      isPulling.current = false;

      const distance = currentPull.current;
      currentPull.current = 0;
      setPullDistance(0);

      if (distance >= PULL_THRESHOLD) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    }

    // touchmove 는 { passive: false } 로 등록해야 preventDefault() 가 동작
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPWA, disabled]);

  return { pullDistance, isRefreshing, isPWA };
}
