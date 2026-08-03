/**
 * 클립보드 복사.
 *
 * navigator.clipboard는 보안 컨텍스트(HTTPS/localhost)에서만 쓸 수 있고,
 * 카카오톡 인앱 브라우저 같은 구형 WebView에서는 아예 없는 경우가 있다.
 * 그래서 실패하면 execCommand로 한 번 더 시도한다.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 권한 거부 등 — 아래 폴백으로 넘어간다.
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // 화면 밖에 두되 display:none은 쓰지 않는다 — 선택이 불가능해진다.
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    // iOS Safari는 select()만으로 선택이 안 잡혀 범위를 직접 지정해야 한다.
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
