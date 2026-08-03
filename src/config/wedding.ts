/**
 * 청첩장 콘텐츠는 전부 이 파일에 모여 있다.
 * 문구·날짜·계좌·좌표를 바꿀 때 다른 파일을 열 필요가 없도록 하는 것이 목적이다.
 *
 * TODO(사용자): 아래 값들을 실제 정보로 교체하세요. `PLACEHOLDER` 주석이 붙은 곳이 필수입니다.
 */

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
    /** 배포 도메인. OG 절대 URL과 공유 링크 생성에 쓰인다. */
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    title: "예찬 ♥ 주은 결혼합니다", // PLACEHOLDER
    description: "2026년 10월 17일 토요일 오후 1시", // PLACEHOLDER
    /** public/ 기준 경로. 1200×630 권장. */
    ogImage: "/og.jpg",
  },

  groom: {
    name: "김예찬", // PLACEHOLDER
    /** '장남', '차남', '아들' 등 */
    relation: "장남",
    phone: "010-0000-0000", // PLACEHOLDER
    father: { name: "김아버지", phone: "010-0000-0000" } as Person, // PLACEHOLDER
    mother: { name: "이어머니", phone: "010-0000-0000" } as Person, // PLACEHOLDER
  },

  bride: {
    name: "박주은", // PLACEHOLDER
    relation: "장녀",
    phone: "010-0000-0000", // PLACEHOLDER
    father: { name: "박아버지", phone: "010-0000-0000" } as Person, // PLACEHOLDER
    mother: { name: "최어머니", phone: "010-0000-0000" } as Person, // PLACEHOLDER
  },

  ceremony: {
    /**
     * 예식 시각. 반드시 KST 오프셋(+09:00)을 포함한 ISO 8601로 적는다.
     * 서버(UTC)와 브라우저(로컬)에서 같은 시각으로 해석되게 하기 위함.
     */
    startsAt: "2026-10-17T13:00:00+09:00", // PLACEHOLDER
    /** 예식 소요 시간(분). 캘린더(.ics) 종료 시각 계산에 쓰인다. */
    durationMinutes: 90,
  },

  venue: {
    name: "○○웨딩홀", // PLACEHOLDER
    hall: "3층 그랜드홀", // PLACEHOLDER
    address: "서울특별시 강남구 테헤란로 123", // PLACEHOLDER
    tel: "02-000-0000", // PLACEHOLDER
    /** 지도 앱 딥링크에 쓰이는 좌표. 네이버/카카오/티맵 모두 이 값을 쓴다. */
    lat: 37.4979, // PLACEHOLDER
    lng: 127.0276, // PLACEHOLDER
    // 지도 썸네일은 photos/map.jpg 로 넣으면 `npm run photos:prep` 이 처리한다.
    transport: [
      {
        title: "지하철",
        lines: ["2호선 강남역 3번 출구에서 도보 5분"], // PLACEHOLDER
      },
      {
        title: "버스",
        lines: ["간선 140, 401 / 지선 3412 — ○○사거리 하차"], // PLACEHOLDER
      },
      {
        title: "주차",
        lines: ["건물 지하 1~4층, 2시간 무료", "만차 시 인근 공영주차장 이용"], // PLACEHOLDER
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
      "서로가 마주 보며 다져온 사랑을",
      "이제 함께 한곳을 바라보며",
      "걸어갈 수 있는 큰 사랑으로 키우고자 합니다.",
      "",
      "저희 두 사람이 새로운 시작을 하는 날,",
      "귀한 걸음 하시어 축복해 주시면",
      "더없는 기쁨으로 간직하겠습니다.",
    ],
  },

  accounts: {
    groom: [
      {
        label: "신랑 김예찬",
        bank: "국민은행",
        number: "000000-00-000000",
        holder: "김예찬",
      },
      {
        label: "아버지 김아버지",
        bank: "신한은행",
        number: "000-000-000000",
        holder: "김아버지",
      },
    ] as Account[], // PLACEHOLDER
    bride: [
      {
        label: "신부 박주은",
        bank: "카카오뱅크",
        number: "0000-00-0000000",
        holder: "박주은",
      },
      {
        label: "아버지 박아버지",
        bank: "우리은행",
        number: "0000-000-000000",
        holder: "박아버지",
      },
    ] as Account[], // PLACEHOLDER
  },

  guestbook: {
    /** 방명록 섹션을 통째로 끄고 싶으면 false */
    enabled: true,
    maxNameLength: 20,
    maxMessageLength: 300,
  },
} as const;

/** 예식 시각을 Date로. 서버·클라이언트 모두 같은 절대 시각을 얻는다. */
export function ceremonyDate(): Date {
  return new Date(wedding.ceremony.startsAt);
}
