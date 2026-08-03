# 배포 가이드 (Vercel + Neon, 전부 무료)

한 번만 하면 그 뒤로는 `git push`만으로 배포됩니다.

준비물: GitHub 계정, Vercel 계정, 카카오 개발자 계정. 카드 등록 필요 없습니다.

---

## 1. Vercel에 프로젝트 만들기

1. [vercel.com/new](https://vercel.com/new) → GitHub 저장소 `wed-invi` import
2. Framework는 Next.js로 자동 인식됩니다. **여기서 바로 Deploy 하지 말고** 환경변수부터 넣으세요
   (없으면 빌드는 되지만 관리자 페이지가 뜨지 않습니다)

## 2. 데이터베이스 (Neon)

Vercel 프로젝트 → **Storage** → **Neon** 연결 → 무료 플랜 선택.

`DATABASE_URL`이 프로젝트 환경변수에 자동으로 들어갑니다.

> Neon은 5분 놀면 컴퓨트를 0으로 내렸다가 다음 요청에 ~500ms 만에 깨어납니다.
> 프로젝트가 정지되거나 수동 복구가 필요한 일은 없습니다.

## 3. 이미지 저장소 (Vercel Blob)

Storage → **Blob** → 스토어 생성. `BLOB_READ_WRITE_TOKEN`이 자동 주입됩니다.

편지 본문에 사진을 첨부할 때만 쓰입니다. 없어도 배포는 되고, 관리자 화면에서
이미지 버튼을 누르면 "이미지 저장소가 설정되지 않았습니다" 안내가 뜹니다.

## 4. 나머지 환경변수

Settings → **Environment Variables**에 네 개를 추가합니다. (Production/Preview/Development 전부 체크)

```bash
# 시크릿 두 개는 이렇게 만드세요
openssl rand -base64 32
```

| 키 | 값 |
|---|---|
| `ADMIN_PASSWORD` | 예찬·주은이 공유할 관리자 비밀번호. **20자 이상 권장** |
| `SESSION_SECRET` | `openssl rand -base64 32` 결과 |
| `TOKEN_SECRET` | `openssl rand -base64 32` 결과 (**아래 경고 참고**) |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소. 예: `https://wed-invi.vercel.app` |

> ⚠️ **`TOKEN_SECRET`은 한 번 정하면 절대 바꾸지 마세요.**
> 하객 URL이 이 값으로 만들어지기 때문에, 바꾸는 순간 이미 보낸 링크가 전부 열리지 않습니다.
> 안전한 곳에 따로 백업해 두세요.

로그인 비밀번호는 브라우저가 아니라 서버에서 검증하므로, 바꾸고 싶으면 언제든
`ADMIN_PASSWORD`만 수정하고 재배포하면 됩니다.

## 5. 첫 배포 + 마이그레이션

Deploy를 누릅니다. 빌드가 끝나면 DB 테이블을 만들어야 합니다.

로컬에서 `.env.local`의 `DATABASE_URL`을 **배포용 Neon 주소**로 잠깐 바꾸고:

```bash
npm run db:migrate
```

Neon connection string은 Vercel Storage → Neon → `.env.local` 탭에서 복사할 수 있습니다.
끝나면 로컬 주소로 되돌려 두면 됩니다.

> 스키마를 바꿨을 때도 같은 방법입니다. `npm run db:generate`로 마이그레이션 파일을 만들어
> 커밋하고, 배포 후 `npm run db:migrate`를 한 번 실행하세요.

## 6. 카카오톡 공유 설정

1. [developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → **애플리케이션 추가**
2. **앱 키** → `JavaScript 키` 복사 → Vercel 환경변수 `NEXT_PUBLIC_KAKAO_JS_KEY`에 추가
3. **플랫폼** → Web → **사이트 도메인**에 배포 주소 등록 (예: `https://wed-invi.vercel.app`)

**3번을 빼먹으면 공유 버튼이 동작하지 않습니다.** 카카오 로그인 활성화는 필요 없습니다.

키를 넣지 않으면 카카오톡 버튼만 숨겨지고, OS 공유·링크 복사는 그대로 동작합니다.

## 7. 커스텀 도메인 (선택)

Settings → Domains에서 추가. 붙였다면 **두 곳을 함께 갱신**해야 합니다.

- Vercel 환경변수 `NEXT_PUBLIC_SITE_URL`
- 카카오 개발자 → 플랫폼 → 사이트 도메인

---

## 배포 후 확인

```
https://<도메인>/           청첩장이 뜨는가
https://<도메인>/admin      로그인 화면이 뜨는가 (비밀번호로 들어가지는가)
```

1. 관리자에서 **자기 자신에게 편지를 하나 써보고** 발급된 URL을 본인 카톡으로 보내보세요
2. 링크 미리보기 이미지와 제목이 제대로 뜨는지 확인
3. [docs/todo.md](todo.md)의 **실기기 확인 목록**을 폰에서 한 번씩 눌러보세요

미리보기 이미지를 바꿨는데 카톡에 반영되지 않으면
[카카오 캐시 초기화 도구](https://developers.kakao.com/tool/clear/og)에 URL을 넣어 갱신하세요.
카카오는 링크 미리보기를 일정 시간 캐싱합니다.

---

## 그 뒤로는

`main`에 push하면 Vercel이 자동으로 배포합니다.

```bash
git add -A
git commit -m "인사말 문구 수정"
git push
```

사진을 바꿨다면 `npm run photos:prep`을 먼저 돌리고 결과물까지 함께 커밋하세요
(`src/assets/photos/`와 `public/og.jpg`는 커밋 대상입니다).

---

## 무료 티어 한도

| 항목 | 한도 | 청첩장 실사용 |
|---|---|---|
| Vercel 대역폭 | 100 GB/월 | 하객 300명 기준 여유 |
| Vercel 이미지 변환 | 5,000회/월 | 사진 40장 기준 약 500회 |
| Vercel Blob | 1 GB | 편지 이미지는 1600px로 줄여 올림 |
| Neon 스토리지 | 0.5 GB | 편지는 텍스트라 거의 안 씀 |
| Neon 컴퓨트 | 100 CU-h/월 | scale-to-zero라 실사용 미미 |

Vercel Hobby 플랜은 **개인·비상업 용도** 한정입니다. 청첩장은 여기에 해당합니다.
