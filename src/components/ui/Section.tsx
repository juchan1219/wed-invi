import { Reveal } from "./Reveal";

/**
 * 청첩장의 모든 섹션이 공유하는 껍데기.
 * 제목 조판(작은 영문 라벨 + 한글 제목)과 세로 여백을 한곳에서 관리한다.
 */
export function Section({
  label,
  title,
  children,
  className = "",
  id,
}: {
  /** 제목 위에 들어가는 작은 영문 라벨. 예: "INVITATION" */
  label?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-7 py-16 ${className}`}>
      {(label || title) && (
        <Reveal className="mb-10 text-center">
          {label && (
            <p className="text-[0.65rem] tracking-[0.3em] text-accent uppercase">
              {label}
            </p>
          )}
          {title && (
            <h2 className="mt-3 font-serif text-xl text-ink">{title}</h2>
          )}
        </Reveal>
      )}
      {children}
    </section>
  );
}

/** 섹션 사이를 나누는 가는 선. 장식 요소라 스크린리더에서는 숨긴다. */
export function Divider() {
  return (
    <div aria-hidden className="mx-auto h-px w-16 bg-line" />
  );
}
