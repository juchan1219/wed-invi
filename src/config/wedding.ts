/**
 * 청첩장 콘텐츠는 전부 이 파일에 모여 있다.
 * 문구·날짜·계좌·좌표를 바꿀 때 다른 파일을 열 필요가 없도록 하는 것이 목적이다.
 *
 * ⚠️ 단 하나의 예외: **전화번호와 계좌번호는 이 파일에 적지 않는다.**
 * 이 저장소는 공개라서 숫자를 적으면 git 히스토리에 영구히 남는다.
 * 두 값만 환경변수로 받고, 나머지(이름·은행·예금주·라벨)는 여기 그대로 둔다.
 * 등록할 변수 목록과 넣는 곳은 [docs/env.md](../../docs/env.md) 를 보라.
 *
 * 값이 비어 있으면 해당 항목이 조용히 사라지는 대신 섹션이 안내 문구를 보인다
 * (`withNumber`, `ContactList`). 배포 후 실제 화면에서 눈으로 확인할 것.
 */

import { publicValue, withNumber } from "@/lib/contentEnv";

export type Person = {
  name: string;
  /** 전화번호. 비워두면 연락처 섹션에서 해당 항목이 숨겨진다. */
  phone?: string;
  /** 고인이면 true — 이름 앞에 '故'가 붙는다. */
  deceased?: boolean;
};

export type Account = {
  /** '신랑', '신랑 아버지'처럼 화면에 그대로 노출되는 라벨 */
  label: string;
  bank: string;
  number: string;
  holder: string;
  /** 카카오페이 송금 QR 링크(선택). 있으면 버튼이 하나 더 생긴다. */
  kakaopayUrl?: string;
};

export const wedding = {
  site: {
    /**
     * 배포 도메인. OG 절대 URL과 공유 링크 생성에 쓰인다.
     *
     * `??` 가 아니라 `||` 인 이유: `??` 는 빈 문자열을 그대로 통과시킨다.
     * Vercel에서 이 변수를 **값 없이 등록**하면(import 화면이 .env.example을 읽어 만들어 준다)
     * `new URL("")` 이 터져서 `layout.tsx`의 metadataBase에서 빌드가 통째로 실패한다.
     * 실제로 그렇게 한 번 깨졌다 (2026-09-27).
     */
    url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
    title: "예찬 ♥ 주은 결혼합니다", // PLACEHOLDER
    description:
      "2026년 12월 19일 토요일 오후 12시 30분 · 잠실 아펠가모 2층 단독홀",
    /** public/ 기준 경로. 1200×630 권장. */
    ogImage: "/og.jpg",
  },

  // 전화번호는 환경변수에서만 온다 (파일 상단 주석 참고).
  // `process.env.X` 를 통째로 적어야 Next가 빌드 시 인라인한다 — 키를 변수로 돌려 읽으면 안 된다.
  groom: {
    name: "김예찬",
    /** '장남', '차남', '아들' 등 */
    relation: "차남",
    phone: publicValue(process.env.NEXT_PUBLIC_PHONE_GROOM),
    father: {
      name: "김종웅",
      phone: publicValue(process.env.NEXT_PUBLIC_PHONE_GROOM_FATHER),
    } as Person,
    mother: {
      name: "권순주",
      phone: publicValue(process.env.NEXT_PUBLIC_PHONE_GROOM_MOTHER),
    } as Person,
  },

  bride: {
    name: "이주은",
    relation: "장녀",
    phone: publicValue(process.env.NEXT_PUBLIC_PHONE_BRIDE),
    father: {
      name: "이병석",
      phone: publicValue(process.env.NEXT_PUBLIC_PHONE_BRIDE_FATHER),
    } as Person,
    mother: {
      name: "박윤경",
      phone: publicValue(process.env.NEXT_PUBLIC_PHONE_BRIDE_MOTHER),
    } as Person,
  },

  ceremony: {
    /**
     * 예식 시각. 반드시 KST 오프셋(+09:00)을 포함한 ISO 8601로 적는다.
     * 서버(UTC)와 브라우저(로컬)에서 같은 시각으로 해석되게 하기 위함.
     */
    startsAt: "2026-12-19T12:30:00+09:00",
    /** 예식 소요 시간(분). 캘린더(.ics) 종료 시각 계산에 쓰인다. */
    durationMinutes: 90,
  },

  venue: {
    name: "잠실 아펠가모",
    hall: "2층 단독홀",
    address: "서울특별시 송파구 올림픽로35길 137, 한국광고문화회관 2층",
    tel: "02-2144-0230",
    /** 지도 앱 딥링크에 쓰이는 좌표. 네이버/카카오/티맵 모두 이 값을 쓴다. */
    lat: 37.5159386,
    lng: 127.0996469,
    // 지도 썸네일은 photos/map.jpg 로 넣으면 `npm run photos:prep` 이 처리한다.
    transport: [
      {
        title: "지하철",
        lines: ["2·8호선 잠실역 7번 출구에서 도보 약 5분"],
      },
      {
        title: "버스",
        lines: ["잠실역·잠실나루역 인근 정류장 이용"],
      },
      {
        title: "주차",
        lines: ["한국광고문화회관 주차장, 하객 2시간 무료", "주차장이 협소해 대중교통 이용을 권장합니다"],
      },
    ],
  },

  greeting: {
    /** 섹션 상단의 짧은 문구 */
    title: "초대합니다",
    /**
     * 인사말 본문. 줄바꿈은 배열 항목으로 나눈다.
     * (문단 사이 여백을 CSS로 일관되게 주기 위해 문자열 개행 대신 배열을 쓴다.)
     */
    body: [
      "귀하게 만난 두 사람이",
      "여러 계절을 함께했습니다.",
      "운명처럼 시작된 인연을",
      "",
      "주어진 사랑으로 잘 가꾸고",
      "은은한 행복을 나누며",
      "이제 평생을 함께하려 합니다.",
      "",
      "소중한 분들과 이 기쁨을 나누고 싶습니다.",
    ],
  },

  // 계좌번호도 환경변수에서만 온다. 은행·예금주·라벨은 이름과 함께 이미 공개된
  // 정보라 여기 그대로 두고, 번호가 없는 항목은 `withNumber` 가 목록에서 뺀다.
  accounts: {
    groom: withNumber([
      {
        label: "신랑 김예찬",
        bank: "하나은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_GROOM),
        holder: "김예찬",
      },
      {
        label: "아버지 김종웅",
        bank: "국민은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_GROOM_FATHER),
        holder: "김종웅",
      },
      {
        label: "어머니 권순주",
        bank: "농협은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_GROOM_MOTHER),
        holder: "권순주",
      },
    ]) as Account[],
    bride: withNumber([
      {
        label: "신부 이주은",
        bank: "하나은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_BRIDE),
        holder: "이주은",
      },
      {
        label: "아버지 이병석",
        bank: "국민은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_BRIDE_FATHER),
        holder: "이병석",
      },
      {
        label: "어머니 박윤경",
        bank: "농협은행",
        number: publicValue(process.env.NEXT_PUBLIC_ACCOUNT_BRIDE_MOTHER),
        holder: "박윤경",
      },
    ]) as Account[],
  },

  gallery: {
    /**
     * 어르신용(`/big`)에서 뺄 사진 번호 (2026-10-05 사용자 선택).
     *
     * 번호는 화면에 보이는 순서이자 `photos/gallery-NN.jpg` 의 번호다 — 둘은 같다.
     * CSS로 숨기지 않고 목록에서 빼는 이유: 라이트박스가 배열 인덱스로 동작해서
     * 숨기기만 하면 크게 보기가 엉뚱한 사진을 연다.
     *
     * 기본 청첩장(`/`)은 영향을 받지 않는다.
     */
    hiddenInLargeType: [3, 11, 14, 17, 24, 25, 26, 27, 28, 29],
  },

  guestbook: {
    /**
     * 방명록('축하 메시지') 섹션을 통째로 끄고 싶으면 false.
     *
     * 2026-10-04 사용자 요청으로 **false**. 청첩장에서 섹션이 사라지고
     * `POST /api/guestbook` 은 403을 돌려준다. `GET` 은 거부가 아니라 빈 목록 200이다
     * (방명록이 죽어도 청첩장 본문은 멀쩡해야 한다는 기존 설계 — `api/guestbook/route.ts`).
     *
     * 기능을 지운 것은 아니라 다시 `true` 로 돌리면 그대로 살아난다 —
     * DB 테이블·관리자 화면(`/admin/guestbook`)·기존 글은 건드리지 않았다.
     */
    enabled: false,
    maxNameLength: 20,
    maxMessageLength: 300,
  },
} as const;

/** 예식 시각을 Date로. 서버·클라이언트 모두 같은 절대 시각을 얻는다. */
export function ceremonyDate(): Date {
  return new Date(wedding.ceremony.startsAt);
}
