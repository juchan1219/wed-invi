import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * 편지 본문(마크다운) 렌더러.
 *
 * 청첩장과 관리자 에디터의 미리보기가 **이 컴포넌트 하나를 공유**한다.
 * 그래야 "쓰면서 본 모습 = 하객이 보는 모습"이 코드 레벨에서 보장된다.
 *
 * rehype-sanitize를 반드시 통과시킨다. 편지는 관리자만 쓰지만,
 * 마크다운 안의 raw HTML을 그대로 렌더하면 XSS 경로가 생긴다.
 */
export function LetterMarkdown({ body }: { body: string }) {
  return (
    <div className="text-[0.94rem] leading-8 text-ink-soft">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h3 className="mt-6 mb-3 font-serif text-lg text-ink first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="mt-6 mb-3 font-serif text-base text-ink first:mt-0">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="mt-5 mb-2 text-sm font-medium text-ink first:mt-0">{children}</h5>
          ),
          p: ({ children }) => <p className="my-4 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-normal text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-4 list-disc space-y-1 pl-5 marker:text-accent-soft">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 list-decimal space-y-1 pl-5 marker:text-accent-soft">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-accent-soft pl-4 text-ink-faint italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-7 border-0 border-t border-line" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-paper-deep px-1.5 py-0.5 text-[0.85em]">{children}</code>
          ),
          img: ({ src, alt }) => <LetterImage src={src} alt={alt ?? ""} />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

/**
 * 업로드한 이미지는 파일명에 크기가 박혀 있다 (`...-1200x900.jpg`).
 * 그 값으로 next/image에 width/height를 넘겨 최적화와 레이아웃 안정성을 함께 얻는다.
 * 크기를 못 읽으면(외부에서 붙여넣은 주소 등) 평범한 <img>로 떨어진다.
 */
function LetterImage({ src, alt }: { src?: string | Blob; alt: string }) {
  if (typeof src !== "string" || src.length === 0) return null;

  const size = parseSizeFromFilename(src);

  if (size) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        sizes="(max-width: 416px) 100vw, 416px"
        className="my-5 h-auto w-full rounded-lg"
        loading="lazy"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 크기를 모르는 외부 이미지 폴백
    <img src={src} alt={alt} loading="lazy" className="my-5 h-auto w-full rounded-lg" />
  );
}

function parseSizeFromFilename(src: string): { width: number; height: number } | null {
  const match = /-(\d{1,5})x(\d{1,5})\.[a-z]+$/i.exec(new URL(src, "https://x.invalid").pathname);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}
