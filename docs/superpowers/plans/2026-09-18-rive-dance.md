# 실제 Rive 웨딩 댄스 구현

기존 사용자 승인 설계(6포즈, 실제 관절 춤, GSAP scrub)를 현재 프로젝트에서 실행한다.
별도 서비스·유료 에셋·로그인 없이 공식 Rive CLI로 벡터 RML을 컴파일한다.

1. `scripts/dance/choreography.mjs`: 손·발 목표점과 몸통 key pose를 보간하고
   2-bone IK로 팔꿈치·무릎 각도를 계산. `scripts/dance/choreography.test.mjs`에서
   길이 보존, 연결된 손, 유한한 값, 역방향 결정성, 들어올리기를 검사한다.
2. `scripts/build-dance-rive.mjs`: 곡선 일러스트·계층 관절·의상 버텍스와
   60fps timeline을 `assets/rive/wedding-dance/scene.rml`로 생성한다.
   CLI 컴파일 산출물은 `public/story/wedding-dance/wedding-dance.riv`.
   0/16/33/50/67/84/100 및 중간 화면을 실제 Rive 렌더러로 확인한다.
3. `RiveDanceActor.tsx`, `DanceActor.tsx`: view model number 0–100를 기본
   Rive에 전달. 늦은 로딩에도 최신 진행률 복원, 실패 시 정적 그림 유지.
   모션 축소에서는 Rive를 아예 마운트하지 않는다.
4. `useDanceTimeline.ts`, CSS: 외부 흔들림 제거, 위치 이동은 transform만 사용.
   기존 개인화 편지·예식 정보·이전 비활성 스토리는 건드리지 않는다.
5. `npm run test:story`, 안무 테스트, typecheck/build와 실제 모바일 크기 브라우저
   시작/중간/끝/역스크롤 검증. iOS·카카오톡 실기기는 미검증으로 구분한다.
