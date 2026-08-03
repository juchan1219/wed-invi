/**
 * 카카오톡 공유하기 (JavaScript SDK v2).
 *
 * SDK는 86KB쯤 되므로 첫 로드에 포함하지 않고, 공유 버튼을 처음 누를 때
 * 주입한다. 청첩장 방문자 대부분은 공유 버튼을 누르지 않는다.
 *
 * 사전 준비 (developers.kakao.com):
 *   1. 애플리케이션 추가 → 앱 키 → JavaScript 키를 NEXT_PUBLIC_KAKAO_JS_KEY 에 넣는다
 *   2. 플랫폼 → Web → 사이트 도메인에 배포 주소를 등록한다  ← 이걸 빼먹으면 동작하지 않는다
 * 카카오 로그인 활성화는 필요 없다(공유하기는 로그인 없이 동작).
 */

// 버전과 integrity는 함께 바꿔야 한다.
// integrity 계산:  curl -s <src> | openssl dgst -sha384 -binary | openssl base64 -A
const SDK_VERSION = "2.8.0";
const SDK_SRC = `https://t1.kakaocdn.net/kakao_js_sdk/${SDK_VERSION}/kakao.min.js`;
const SDK_INTEGRITY =
  "sha384-Lvrr4dmJLLhBimcAC4GfpNV3oEGKgfd26Mp7KkvDz8PxGrhUhUT3zoax7EirW8fu";

type KakaoShareTarget = { mobileWebUrl: string; webUrl: string };

type KakaoSdk = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (settings: {
      objectType: "feed";
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: KakaoShareTarget;
      };
      buttons?: { title: string; link: KakaoShareTarget }[];
    }) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

/** 키가 없으면 공유 버튼 자체를 숨긴다. */
export function isKakaoConfigured(): boolean {
  return KAKAO_JS_KEY.length > 0;
}

let loading: Promise<KakaoSdk> | null = null;

function loadSdk(): Promise<KakaoSdk> {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  // 동시에 여러 번 눌러도 스크립트는 한 번만 주입되게 한다.
  if (loading) return loading;

  loading = new Promise<KakaoSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      if (window.Kakao) resolve(window.Kakao);
      else reject(new Error("카카오 SDK를 불러왔지만 초기화되지 않았습니다."));
    };
    script.onerror = () => {
      loading = null; // 다음 클릭에서 다시 시도할 수 있게
      reject(new Error("카카오 SDK를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return loading;
}

async function getKakao(): Promise<KakaoSdk> {
  const kakao = await loadSdk();
  if (!kakao.isInitialized()) kakao.init(KAKAO_JS_KEY);
  return kakao;
}

export type KakaoShareInput = {
  title: string;
  description: string;
  /** 반드시 절대 URL(https)이어야 한다. 상대 경로는 미리보기가 비어 보인다. */
  imageUrl: string;
  url: string;
  buttonTitle?: string;
};

/**
 * 카카오톡 공유 메시지를 띄운다.
 * 성공하면 true. 실패 사유(키 미설정/도메인 미등록/네트워크)는 호출자가 안내한다.
 */
export async function shareToKakao(input: KakaoShareInput): Promise<boolean> {
  if (!isKakaoConfigured()) return false;

  try {
    const kakao = await getKakao();
    const link: KakaoShareTarget = { mobileWebUrl: input.url, webUrl: input.url };

    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        link,
      },
      buttons: [{ title: input.buttonTitle ?? "청첩장 보기", link }],
    });
    return true;
  } catch (error) {
    console.error("[kakao] 공유 실패", error);
    return false;
  }
}
