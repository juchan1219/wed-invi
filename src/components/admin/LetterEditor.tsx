"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import { adminLabel, type AdminId } from "@/config/admins";
import { copyText } from "@/lib/clipboard";
import { resizeImage } from "@/lib/resize-image";
import { LetterMarkdown } from "@/components/letter/LetterMarkdown";
import { useToast } from "@/components/ui/Toast";
import { useAuthor } from "./AuthorChip";
import { ShareButtons } from "./ShareButtons";

export type LetterDraft = {
  token: string;
  name: string;
  phoneLast4: string;
  author: AdminId;
  body: string;
};

type Tab = "write" | "preview";

export function LetterEditor({ initial }: { initial?: LetterDraft }) {
  const router = useRouter();
  const toast = useToast();
  const { author, setAuthor } = useAuthor();

  const [name, setName] = useState(initial?.name ?? "");
  const [phoneLast4, setPhoneLast4] = useState(initial?.phoneLast4 ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tab, setTab] = useState<Tab>("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(initial?.token ?? null);

  // 토큰이 정해진 뒤에는 이름·뒷자리를 잠근다.
  // 잠그지 않으면 저장 직후 이름만 고쳐 다시 저장했을 때
  // 토큰이 달라져 하객이 한 명 더 생겨버린다.
  const isEditing = savedToken !== null;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 수정 화면에 들어오면 chip을 그 편지의 작성자로 맞춘다.
  useEffect(() => {
    if (initial) setAuthor(initial.author);
    // 최초 진입 시 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 작성 중 내용이 날아가지 않게 브라우저에 임시 보관한다.
  const draftKey = `wedinvi_draft_${savedToken ?? "new"}_${author}`;
  useEffect(() => {
    if (body.length === 0) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftKey, body);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [body, draftKey]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneLast4, author, body }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      window.localStorage.removeItem(draftKey);
      setSavedToken(data.token);
      toast("편지를 저장했습니다");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!savedToken) return;
    if (!window.confirm(`${name}님에게 쓴 ${adminLabel(author)}님의 편지를 지울까요?`)) return;

    const res = await fetch(
      `/api/admin/letters?token=${encodeURIComponent(savedToken)}&author=${author}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      toast("삭제에 실패했습니다");
      return;
    }
    window.localStorage.removeItem(draftKey);
    toast("편지를 지웠습니다");
    router.replace("/admin");
    router.refresh();
  }

  /** 커서 위치에 텍스트를 끼워 넣는다. 툴바와 이미지 업로드가 함께 쓴다. */
  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + text);
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const next = body.slice(0, selectionStart) + text + body.slice(selectionEnd);
    setBody(next);
    // setState 반영 후에 커서를 옮겨야 한다.
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = selectionStart + text.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  /** 선택 영역을 마크다운 기호로 감싼다. 선택이 없으면 기호만 넣는다. */
  function wrapSelection(prefix: string, suffix = prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = body.slice(selectionStart, selectionEnd);
    insertAtCursor(`${prefix}${selected}${suffix}`);
  }

  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다.
    event.target.value = "";
    if (!file) return;

    toast("이미지를 올리는 중...");
    try {
      const resized = await resizeImage(file);
      const form = new FormData();
      form.append("file", resized.file);
      form.append("width", String(resized.width));
      form.append("height", String(resized.height));

      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "이미지 업로드에 실패했습니다");
        return;
      }
      insertAtCursor(`\n\n![](${data.url})\n\n`);
      toast("이미지를 넣었습니다");
    } catch {
      toast("이미지를 처리하지 못했습니다");
    }
  }

  const url = savedToken ? `${wedding.site.url}/i/${savedToken}` : null;

  return (
    <div className="pt-5">
      <h1 className="text-sm text-ink">
        {isEditing ? "편지 수정" : "편지 쓰기"}
        <span className="ml-2 text-xs text-ink-faint">
          작성자 · {adminLabel(author)} (위 chip으로 변경)
        </span>
      </h1>

      <div className="mt-4 grid grid-cols-[1fr_7rem] gap-2">
        <label className="block">
          <span className="text-xs text-ink-faint">받는 분 이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={isEditing}
            placeholder="홍길동"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none read-only:bg-paper-deep read-only:text-ink-faint focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-faint">뒷 4자리</span>
          <input
            value={phoneLast4}
            onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            readOnly={isEditing}
            inputMode="numeric"
            placeholder="1234"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none read-only:bg-paper-deep read-only:text-ink-faint focus:border-accent"
          />
        </label>
      </div>

      {isEditing ? (
        <p className="mt-2 text-xs text-ink-faint">
          이름·뒷자리를 바꾸면 URL이 달라집니다. 바꿔야 한다면 이 편지를 지우고 새로 써주세요.
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">
          이름과 뒷 4자리로 URL이 만들어집니다. 같은 값이면 항상 같은 주소가 나옵니다.
        </p>
      )}

      <div className="mt-5 flex items-center justify-between border-b border-line">
        <div className="flex">
          <TabButton active={tab === "write"} onClick={() => setTab("write")}>
            작성
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            미리보기
          </TabButton>
        </div>
        <span className="pb-2 text-xs text-ink-faint">{body.length}자</span>
      </div>

      {tab === "write" ? (
        <>
          <Toolbar
            onBold={() => wrapSelection("**")}
            onItalic={() => wrapSelection("_")}
            onHeading={() => insertAtCursor("\n## ")}
            onQuote={() => insertAtCursor("\n> ")}
            onList={() => insertAtCursor("\n- ")}
            onLink={() => wrapSelection("[", "](https://)")}
            onImage={() => fileInputRef.current?.click()}
          />
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            placeholder={"편지를 마크다운으로 쓸 수 있어요.\n\n**굵게**, _기울임_, > 인용, - 목록, 그리고 이미지까지."}
            className="mt-2 w-full resize-y rounded-lg border border-line bg-paper px-4 py-3 text-base leading-7 outline-none focus:border-accent"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleImagePick}
            className="hidden"
          />
        </>
      ) : (
        // 하객이 보는 화면과 같은 폭·같은 컴포넌트로 그린다.
        <div className="mt-4 rounded-lg bg-paper-deep p-4">
          <div className="mx-auto max-w-sheet rounded-lg bg-paper px-6 py-7">
            {body.trim().length === 0 ? (
              <p className="text-sm text-ink-faint">아직 쓴 내용이 없습니다.</p>
            ) : (
              <>
                <LetterMarkdown body={body} />
                <p className="mt-7 text-right font-serif text-sm text-ink-faint">
                  {adminLabel(author)} 드림
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || name.length === 0 || phoneLast4.length !== 4 || body.trim().length === 0}
          className="flex-1 rounded-lg bg-ink py-3 text-sm text-paper disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-line px-5 py-3 text-sm text-ink-soft"
          >
            삭제
          </button>
        )}
      </div>

      {url && (
        <div className="mt-6 rounded-lg border border-line p-4">
          <p className="text-xs text-ink-faint">발급된 주소</p>
          <button
            type="button"
            onClick={async () => toast((await copyText(url)) ? "링크를 복사했습니다" : "복사 실패")}
            className="mt-1 block w-full truncate text-left text-sm text-accent underline underline-offset-4"
          >
            {url}
          </button>
          <div className="mt-3">
            <ShareButtons token={savedToken!} name={name} />
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`-mb-px border-b-2 px-4 pb-2 text-sm ${
        active ? "border-ink text-ink" : "border-transparent text-ink-faint"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar(props: {
  onBold: () => void;
  onItalic: () => void;
  onHeading: () => void;
  onQuote: () => void;
  onList: () => void;
  onLink: () => void;
  onImage: () => void;
}) {
  const items: [string, () => void][] = [
    ["굵게", props.onBold],
    ["기울임", props.onItalic],
    ["제목", props.onHeading],
    ["인용", props.onQuote],
    ["목록", props.onList],
    ["링크", props.onLink],
    ["이미지", props.onImage],
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map(([label, onClick]) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft active:bg-paper-deep"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
