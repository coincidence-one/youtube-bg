"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SleepTimerOption = 0 | 15 | 30 | 45 | 60 | 90;

export interface SleepTimerState {
  /** 남은 분 (0이면 비활성) */
  remaining: number;
  /** 선택된 타이머 값 */
  selected: SleepTimerOption;
  /** 활성 상태 */
  active: boolean;
}

export function useSleepTimer(onTimerEnd: () => void) {
  const [timerState, setTimerState] = useState<SleepTimerState>({
    remaining: 0,
    selected: 0,
    active: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState({ remaining: 0, selected: 0, active: false });
  }, []);

  const setTimer = useCallback(
    (minutes: SleepTimerOption) => {
      // 끄기
      if (minutes === 0) {
        clearTimer();
        return;
      }

      endTimeRef.current = Date.now() + minutes * 60 * 1000;
      setTimerState({ remaining: minutes, selected: minutes, active: true });

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        const remainMs = endTimeRef.current - Date.now();
        if (remainMs <= 0) {
          clearTimer();
          onTimerEnd();
        } else {
          setTimerState((prev) => ({
            ...prev,
            remaining: Math.ceil(remainMs / 60000),
          }));
        }
      }, 10000); // 10초마다 체크
    },
    [clearTimer, onTimerEnd]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { timerState, setTimer, clearTimer };
}
