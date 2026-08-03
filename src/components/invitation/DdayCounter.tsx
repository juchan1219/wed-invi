"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/config/wedding";
import { daysUntilCeremony } from "@/lib/date";

/**
 * 남은 날짜는 "오늘"에 따라 달라지므로 서버에서 계산하면 캐시된 순간에 굳어버린다.
 * 페이지를 정적으로 유지하기 위해 브라우저에서 계산한다.
 * (첫 페인트에는 자리만 잡아두고 값은 마운트 후 채운다.)
 */
export function DdayCounter() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(daysUntilCeremony());
  }, []);

  const groom = wedding.groom.name;
  const bride = wedding.bride.name;

  // 자리 높이를 미리 잡아 값이 들어올 때 레이아웃이 밀리지 않게 한다.
  if (days === null) return <p className="h-5" aria-hidden />;

  if (days > 0) {
    return (
      <p className="text-sm text-ink-soft">
        {groom}, {bride}의 결혼식이{" "}
        <strong className="font-normal text-accent">{days}일</strong> 남았습니다.
      </p>
    );
  }
  if (days === 0) {
    return (
      <p className="text-sm text-accent">
        오늘은 {groom}, {bride}의 결혼식입니다.
      </p>
    );
  }
  return (
    <p className="text-sm text-ink-soft">
      {groom}, {bride}의 결혼식이 {Math.abs(days)}일 지났습니다.
    </p>
  );
}
