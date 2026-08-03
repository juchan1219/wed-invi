import { buildICalendar } from "@/lib/date";
import { wedding } from "@/config/wedding";

/**
 * 예식 일정 .ics 다운로드.
 *
 * data: URL 대신 실제 엔드포인트를 쓰는 이유는, iOS Safari가 data: URL의
 * text/calendar를 캘린더 앱으로 넘겨주지 않기 때문이다.
 */
export function GET() {
  const filename = `${wedding.groom.name}-${wedding.bride.name}-wedding.ics`;

  return new Response(buildICalendar(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // 한글 파일명은 RFC 5987 형식으로 함께 준다.
      "Content-Disposition": `attachment; filename="wedding.ics"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
