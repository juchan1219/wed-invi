# 배포 가이드 — 그대로 따라 하면 됩니다

Vercel + Neon + Blob, 전부 무료. 카드 등록 필요 없습니다. 처음이면 **30분쯤** 걸립니다.

준비물: GitHub 계정, [Vercel 계정](https://vercel.com/signup), [카카오 개발자 계정](https://developers.kakao.com)

전체 순서는 이렇습니다.

```
1. Vercel에 프로젝트 올리기        ← 환경변수 없이도 배포는 성공합니다
2. Neon(DB) 연결                   → DATABASE_URL 자동 주입
3. Blob(이미지 저장소) 만들기       → BLOB_READ_WRITE_TOKEN 자동 주입  ⚠️ Public 필수
4. 나머지 환경변수 4개 직접 등록
5. 재배포
6. DB 테이블 만들기 (마이그레이션)
7. 카카오톡 공유 설정
8. 확인
```

---

## 1. Vercel에 프로젝트 올리기

1. [vercel.com/new](https://vercel.com/new) 접속
2. **Import Git Repository** 에서 `juchan1219/wed-invi` 옆 **Import** 클릭
   - 목록에 없으면 **Adjust GitHub App Permissions** → 저장소 접근 허용
3. Framework Preset이 **Next.js** 로 자동 인식됩니다. 나머지는 건드리지 말고 **Deploy**
4. 2~3분 뒤 배포 완료. 축하 화면의 주소(`https://wed-invi-xxxx.vercel.app`)를 열어보면
   **청첩장이 이미 보입니다**

> 이 시점엔 DB가 없어서 `/admin`은 아직 동작하지 않습니다. 정상입니다.
> 배포 주소는 나중에 계속 쓰니 메모해 두세요.

---

## 2. Neon 연결 (데이터베이스)

편지·방명록이 저장될 곳입니다.

1. Vercel 프로젝트 화면 상단 **Storage** 탭 클릭
2. **Create Database** → **Neon** 선택 (Marketplace 항목에 있습니다)
3. **Install** → 약관 동의
4. 설정 화면에서:
   - **Region**: `Singapore` 또는 `Tokyo` 등 아시아 리전 (한국에서 가장 가깝습니다)
   - **Plan**: **Free** 선택
   - **Database name**: 아무거나 (예: `wed-invi`)
5. **Create** → 프로젝트에 연결(Connect)

연결이 끝나면 Vercel 환경변수에 아래가 **자동으로** 들어갑니다. 직접 입력할 필요 없습니다.

```
DATABASE_URL            ← 이 프로젝트가 쓰는 값
DATABASE_URL_UNPOOLED
PGHOST / PGUSER / PGPASSWORD / PGDATABASE
POSTGRES_* (레거시 호환용)
```

**Settings → Environment Variables** 에서 `DATABASE_URL` 이 보이면 성공입니다.

---

## 3. Blob 만들기 (편지에 넣을 이미지 저장소)

1. 다시 **Storage** 탭 → **Create Database** → **Blob**
2. **Store Name**: 아무거나 (예: `wed-invi-images`)
3. **Access mode**: ⚠️ **반드시 `Public` 을 선택하세요**
4. **Region**: 2번에서 고른 것과 같은 아시아 리전
5. 환경 선택: **Production / Preview / Development 전부 체크**
6. **Create** → 프로젝트에 연결

> ### ⚠️ Public을 꼭 골라야 하는 이유
> 편지 속 이미지는 하객이 로그인 없이 봐야 해서 코드가 `access: "public"` 으로 업로드합니다.
> **Private 스토어는 생성 후 Public으로 바꿀 수 없습니다.** 잘못 만들었다면 지우고 다시 만드세요.

`BLOB_READ_WRITE_TOKEN` 이 자동으로 등록됩니다.

> Blob을 건너뛰어도 됩니다. 그 경우 편지에 이미지만 못 넣고 나머지는 전부 정상 동작합니다
> (관리자 화면에서 이미지 버튼을 누르면 안내 문구가 뜹니다).

---

## 4. 나머지 환경변수 4개 등록

터미널에서 시크릿 두 개를 먼저 만듭니다.

```bash
openssl rand -base64 32   # 첫 번째 → SESSION_SECRET
openssl rand -base64 32   # 두 번째 → TOKEN_SECRET
```

Vercel 프로젝트 → **Settings** → **Environment Variables** → 하나씩 **Add** 합니다.
Environment는 전부 **Production / Preview / Development 모두 체크**하세요.

| Key | Value | 설명 |
|---|---|---|
| `ADMIN_PASSWORD` | 직접 정한 긴 비밀번호 | 예찬·주은이 `/admin` 로그인에 씁니다. **20자 이상** |
| `SESSION_SECRET` | `openssl` 결과 1 | 로그인 쿠키 서명용 |
| `TOKEN_SECRET` | `openssl` 결과 2 | **하객 URL 생성용 (아래 경고)** |
| `NEXT_PUBLIC_SITE_URL` | `https://wed-invi-xxxx.vercel.app` | 1번에서 받은 배포 주소. **끝에 `/` 없이** |

> ### ⚠️ `TOKEN_SECRET` 은 한 번 정하면 절대 바꾸지 마세요
> 하객 URL(`/i/<토큰>`)이 이 값으로 만들어집니다. 바꾸는 순간 **이미 카톡으로 보낸 링크가 전부
> 열리지 않습니다.** 비밀번호 관리 앱 같은 곳에 따로 백업해 두세요.
>
> `ADMIN_PASSWORD`는 반대로 언제든 바꿔도 됩니다. 바꾸고 재배포하면 끝입니다.

---

## 5. 재배포

환경변수는 **다음 배포부터** 적용됩니다. 지금 배포된 것에는 반영이 안 돼 있습니다.

1. **Deployments** 탭 → 맨 위 배포의 오른쪽 **⋯** → **Redeploy**
2. **Use existing Build Cache** 체크 해제하고 **Redeploy**

---

## 6. DB 테이블 만들기 (마이그레이션)

배포된 DB는 아직 **비어 있습니다.** 테이블을 만들어야 관리자 페이지가 동작합니다.
로컬 터미널에서 딱 한 번 실행하면 됩니다.

```bash
# Vercel CLI 설치 (한 번만)
npm i -g vercel

# 프로젝트 폴더에서
cd ~/IdeaProjects/wed-invi
vercel login
vercel link                                   # 물어보면 기존 프로젝트(wed-invi) 선택
vercel env pull .env.production.local          # 배포 환경변수를 파일로 받아옴

npm run db:migrate -- .env.production.local
```

이렇게 나오면 성공입니다.

```
  env : .env.production.local
  대상: ep-xxxx.ap-southeast-1.aws.neon.tech
✓ 마이그레이션 적용 완료
```

**`대상:` 에 표시된 호스트가 Neon 주소인지 꼭 확인하세요.** `db.localtest.me` 가 나오면
로컬 DB에 적용한 것이라 배포본에는 반영되지 않습니다.

> `.env.production.local` 에는 실제 비밀번호가 들어 있습니다. `.gitignore` 에 걸려 있어
> 커밋되지 않지만, 작업이 끝나면 지워도 됩니다.

> 나중에 스키마를 바꿨을 때도 같은 방법입니다.
> `npm run db:generate` 로 마이그레이션 파일을 만들어 커밋 → 배포 → 위 명령 한 번.

---

## 7. 카카오톡 공유 설정

1. [developers.kakao.com](https://developers.kakao.com) 로그인 → 우상단 **내 애플리케이션**
2. **애플리케이션 추가하기**
   - 앱 이름: `예찬♥주은 청첩장`
   - 사업자명: 본인 이름
3. 만든 앱 클릭 → 왼쪽 메뉴 **앱 키** → **JavaScript 키** 복사
4. Vercel → Settings → Environment Variables → **Add**
   - Key: `NEXT_PUBLIC_KAKAO_JS_KEY`
   - Value: 복사한 JavaScript 키
   - Environment: 전부 체크
5. 카카오 앱 화면으로 돌아와 왼쪽 메뉴 **플랫폼** → **Web 플랫폼 등록**
   - 사이트 도메인: `https://wed-invi-xxxx.vercel.app` (1번의 배포 주소)
6. Vercel에서 **다시 Redeploy** (5번과 같은 방법)

> ### ⚠️ 5번(도메인 등록)을 빼먹으면 공유 버튼이 동작하지 않습니다
> 가장 흔한 실수입니다. 키만 넣고 도메인을 등록 안 하면 버튼을 눌러도 아무 일도 안 일어납니다.

카카오 **로그인 활성화는 필요 없습니다.** 공유하기는 로그인 없이 동작합니다.

키를 안 넣으면 카카오톡 버튼만 숨겨지고, OS 공유·링크 복사는 그대로 씁니다.

---

## 8. 확인

브라우저에서:

| 주소 | 기대 결과 |
|---|---|
| `https://<도메인>/` | 청첩장이 보인다 |
| `https://<도메인>/admin` | 로그인 화면 → `ADMIN_PASSWORD` 로 들어가진다 |

그다음 **자기 자신에게 편지를 하나 써보세요.**

1. `/admin` → **편지 쓰기** → 본인 이름 + 본인 번호 뒷 4자리 → 아무 내용
2. **저장** → 발급된 URL을 **카카오톡 나에게 보내기**로 전송
3. 확인할 것: 링크 미리보기 이미지·제목이 뜨는가 / 링크를 열면 편지가 보이는가

마지막으로 [todo.md](todo.md) 의 **실기기 확인 목록**을 폰에서 한 번씩 눌러보세요.
지도 버튼과 복사 기능은 실제 폰에서만 검증됩니다.

---

## 9. 커스텀 도메인 (선택)

`wed-invi-xxxx.vercel.app` 대신 `yechan-jueun.com` 같은 주소를 쓰고 싶다면.

1. 도메인 구입 (가비아, Cloudflare 등)
2. Vercel → Settings → **Domains** → 도메인 입력 → 안내대로 DNS 레코드 추가
3. **연결 후 두 곳을 반드시 함께 갱신:**
   - Vercel 환경변수 `NEXT_PUBLIC_SITE_URL` → 새 도메인
   - 카카오 개발자 → 플랫폼 → Web → **사이트 도메인에 새 도메인 추가**
4. Redeploy

---

## 그 뒤로는

`main` 브랜치에 push하면 Vercel이 알아서 배포합니다.

```bash
git add -A
git commit -m "인사말 문구 수정"
git push
```

사진을 바꿨다면 `npm run photos:prep` 을 먼저 돌리고, 생성물까지 함께 커밋하세요
(`src/assets/photos/` 와 `public/og.jpg` 는 커밋 대상입니다).

---

## 안 될 때

| 증상 | 원인과 해결 |
|---|---|
| `/admin` 에서 500 에러 | 마이그레이션(6번)을 안 했거나 로컬 DB에 실행했습니다. `대상:` 호스트를 확인하고 다시 실행 |
| 로그인이 안 됨 | `ADMIN_PASSWORD` 등록 후 **재배포(5번)** 를 안 했을 가능성. 환경변수는 다음 배포부터 적용됩니다 |
| 카카오톡 버튼이 안 보임 | `NEXT_PUBLIC_KAKAO_JS_KEY` 미등록. 키가 없으면 버튼을 아예 숨깁니다 |
| 카카오톡 버튼을 눌러도 반응 없음 | 카카오 개발자 → 플랫폼 → **사이트 도메인 미등록** (7-5번) |
| 카톡 링크 미리보기 이미지가 안 뜸 | [캐시 초기화 도구](https://developers.kakao.com/tool/clear/og)에 URL 입력. 카카오는 미리보기를 일정 시간 캐싱합니다 |
| 미리보기에 옛날 이미지가 뜸 | 위와 동일. `og.jpg` 를 바꿨다면 캐시 초기화가 필요합니다 |
| 편지 이미지 업로드 실패 | Blob 스토어가 **Private** 로 만들어졌을 수 있습니다(3번). 지우고 Public으로 다시 생성 |
| 하객 URL이 갑자기 안 열림 | `TOKEN_SECRET` 이 바뀌었습니다. 백업해 둔 원래 값으로 되돌리세요 |

---

## 무료 티어 한도

| 항목 | 한도 | 청첩장 실사용 |
|---|---|---|
| Vercel 대역폭 | 100 GB/월 | 하객 300명 기준 여유 |
| Vercel 이미지 변환 | 5,000회/월 | 사진 40장 기준 약 500회 |
| Vercel Blob | 1 GB 저장 | 편지 이미지는 업로드 전 1600px로 줄입니다 |
| Neon 스토리지 | 0.5 GB | 편지는 텍스트라 거의 안 씁니다 |
| Neon 컴퓨트 | 100 CU-h/월 | 5분 놀면 0으로 내려가 실사용 미미 |

Vercel Hobby 플랜은 **개인·비상업 용도** 한정입니다. 청첩장은 여기에 해당합니다.

Neon 무료 플랜은 브랜치를 10개까지 만들 수 있는데, Vercel 연동이 **Preview 배포마다 브랜치를
하나씩** 만듭니다. 한도에 걸리면 Neon 콘솔에서 오래된 브랜치를 지우면 됩니다.
