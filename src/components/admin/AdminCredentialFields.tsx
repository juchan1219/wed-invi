import type { ChangeEvent } from "react";

type AdminCredentialFieldsProps = {
  password: string;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function AdminCredentialFields({
  password,
  onPasswordChange,
}: AdminCredentialFieldsProps) {
  return (
    <>
      <label htmlFor="username" className="sr-only">
        관리자 아이디
      </label>
      <input
        id="username"
        name="username"
        type="text"
        value="admin"
        readOnly
        tabIndex={-1}
        autoComplete="username"
        className="sr-only"
      />

      <label htmlFor="password" className="sr-only">
        비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        autoComplete="current-password"
        // 모바일에서 자동 대문자/교정이 끼면 비밀번호가 틀어진다.
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="비밀번호"
        className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink outline-none focus:border-accent"
      />
    </>
  );
}
