# Scroll Wedding Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예찬과 주은의 11샷 이야기를 모바일 청첩장 첫 화면에 역재생 가능한 스크롤 애니메이션으로 구현한다.

**Architecture:** `WeddingStory`만 Client Component로 두고, 진행률 계산은 순수 함수로 분리한다. 장면은 정적 일러스트 레이어와 CSS 변수로 표현하며 React 재렌더 없이 requestAnimationFrame에서 진행률을 갱신한다. 기존 청첩장 기능과 개인화 편지는 서버 컴포넌트 구조를 유지한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, CSS transforms, node:test via tsx, Next Image/static assets

**Spec:** `docs/superpowers/specs/2026-08-13-scroll-wedding-story-design.md`

## Global Constraints

- 전체 11샷, 보통 속도 스크롤 기준 45~60초다.
- 예식은 2026년 12월 19일 오후 12시 30분 잠실 아펠가모다.
- `/`와 `/i/[token]`은 계속 같은 `Invitation` 컴포넌트를 사용한다.
- 개인화 URL을 공유 버튼이나 OG 태그에 넣지 않는다.
- reduced motion에서는 일반 세로 콘텐츠로 대체한다.
- `Reveal`의 `rootMargin`은 변경하지 않는다.

---

### Task 1: 스크롤 진행률 계약

**Files:**
- Create: `src/components/invitation/story/scrollMath.ts`
- Test: `src/components/invitation/story/scrollMath.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `clamp01(value: number): number`, `progressBetween(progress: number, start: number, end: number): number`, `storyProgress(scrollY: number, top: number, height: number, viewportHeight: number): number`

- [ ] 실패 테스트에서 시작/중간/끝/역방향과 0 높이 컨테이너를 정의한다.
- [ ] `npx tsx --test src/components/invitation/story/scrollMath.test.ts`로 의도한 실패를 확인한다.
- [ ] 세 순수 함수를 최소 구현한다.
- [ ] 같은 명령으로 통과를 확인하고 `test:story` 스크립트를 추가한다.

### Task 2: 일러스트 자산 제작과 최적화

**Files:**
- Create: `public/story/*.webp`
- Create: `public/story/assets.ts`

**Interfaces:**
- Produces: 11샷에서 재사용할 세로형 배경/인물 합성 이미지와 각 이미지의 고정 크기 메타데이터

- [ ] 제공 사진 세 장을 인물 기준으로, 오토바이·제주·T타워 사진을 사물/장소 기준으로 분류한다.
- [ ] 텍스트가 없는 2D 구아슈 동화책 스타일의 핵심 장면을 생성한다.
- [ ] 장면별 인상착의, 손가락·바퀴·건물 형태, 텍스트 혼입 여부를 시각 검수한다.
- [ ] 선택본을 `public/story/`로 복사하고 WebP로 최적화한다.

### Task 3: 11샷 고정 무대

**Files:**
- Create: `src/components/invitation/story/WeddingStory.tsx`
- Create: `src/components/invitation/story/WeddingStory.module.css`
- Create: `src/components/invitation/story/storyCopy.ts`
- Modify: `src/components/invitation/Invitation.tsx`

**Interfaces:**
- Consumes: Task 1 진행률 함수, Task 2 이미지 경로
- Produces: `<WeddingStory contentTargetId: string />`

- [ ] 카피 배열이 정확히 11개이며 예식 정보가 일치하는 테스트를 먼저 추가한다.
- [ ] 테스트 실패를 확인한다.
- [ ] JS 없이 첫 장면과 핵심 문구가 보이는 시맨틱 마크업을 작성한다.
- [ ] 진행률로 활성 장면, CSS 변수, 진행도 ARIA 값을 갱신하는 rAF 루프를 연결한다.
- [ ] 장면별 크로스페이드, 줌, 패럴랙스, 이름 화살표, 종이 엽서, 의상 매치컷, 꽃가루 효과를 구현한다.
- [ ] 빠른 점프 스크롤과 위로 스크롤했을 때 화면이 비지 않는지 확인한다.

### Task 4: 접근성·본문 전환·성능

**Files:**
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/Invitation.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `contentTargetId`
- Produces: 건너뛰기, reduced-motion 대체, 본문 시작 앵커

- [ ] 편지 유무와 관계없이 유효한 본문 앵커를 만든다.
- [ ] `prefers-reduced-motion`에서 4개 대표 장면이 순서대로 읽히도록 한다.
- [ ] 첫 이미지 우선 로딩, 나머지 지연 로딩, 명시적 이미지 크기를 적용한다.
- [ ] 320px, 390×844, 430px, 데스크톱 카드 폭에서 오버플로와 글자 겹침을 검수한다.

### Task 5: 회귀 검증과 문서 매핑

**Files:**
- Modify: `docs/todo.md`
- Modify: `docs/requirements.md`

**Interfaces:**
- Consumes: 완성된 스토리와 기존 Invitation 기능
- Produces: 요구사항-구현 매핑과 검증 기록

- [ ] `npm run test:story`와 `npm run typecheck`를 실행한다.
- [ ] `npm run build`를 실행한다.
- [ ] `/`, `/i/<잘못된 토큰>`, `/admin/login`이 정상 응답하는지 확인한다.
- [ ] 모바일 브라우저에서 아래/위/점프 스크롤, 건너뛰기, reduced motion을 확인한다.
- [ ] `docs/todo.md`와 `docs/requirements.md`에 구현 상태와 파일 매핑을 반영한다.
