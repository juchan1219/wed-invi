# Wedding dance — 실제 Rive 소스

사용자가 제공한 2×3 웨딩 커플 그림을 시계방향으로 읽은 여섯 포즈가 레퍼런스다.
원본 래스터의 픽셀을 변형하지 않고, 같은 의상·실루엣을 참고하여 벡터로 재작화했다.
본 파일에는 여섯 장의 이미지를 교체하는 기능이 없다.

## 제작 구조

- `scripts/dance/choreography.mjs`: 16개 주요/중간 자세. 골반, 몸통 기울기,
  머리 각도, 손·발 위치, 턴 각도, 의상 후행량.
- `scripts/build-dance-rive.mjs`: 그림과 12개 Rive 본(6 RootBone + 6 Bone),
  오프라인 2-bone IK, 치마·베일 곡선 버텍스, 20초/60fps 안무 timeline 생성.
  신부 다리는 긴 드레스에 가려져 별도 렌더링하지 않는다.
- `scene.rml`: 생성 소스. 직접 수정하면 다음 빌드에서 덮어쓴다.
- `public/story/wedding-dance/wedding-dance.riv`: 실제 웹 배포 파일.
- `public/story/wedding-dance/rive.wasm`: 설치된 런타임과 맞춘 로컬 WASM.

손잡기 구간은 양쪽 어깨에서 동일 손 위치를 향해 팔꿈치를 계산한다.
본 길이는 고정이며 목표점이 멀면 길이를 늘리지 않고 도달 가능한 거리로 제한한다.
스커트/베일은 deterministic vertex animation이다. 실시간 천 물리가 아니므로
뒤로 스크롤하거나 0→80%로 점프해도 같은 의상 형태를 재현한다.
몸통·얼굴 폭 변화와 치마 펼침으로 2D 턴을 표현하며 3D 회전 모델은 아니다.

## 런타임 계약

Artboard `WeddingCouple`, State machine `WeddingDance`, default View Model `Dance`.
`danceProgress` Number 0–100 → RangeMapper -1–1 → Joystick X → `Choreography` timeline.
JS가 timeline을 독립 재생하지 않는다. 스크롤이 멈추면 자세도 멈춘다.
현재 파일에는 Luau script가 없으며 `rive --once`의 unsigned 파일로 웹 실행 가능하다.
Rive 에디터용 `.rev` export는 별도 로그인 기능이며 이 작업에서 계정 접근하지 않았다.

| 스크롤 | 포즈 / 연결 동작 |
|---|---|
| 0% | 마주 보고 손잡기 |
| 7–16% | 무게 이동, 팔 펼치기, 뒤꿈치 들기 |
| 24–33% | 다시 접근해 안기 |
| 40–50% | 잡은 손 올리기, 턴 준비 |
| 50–60% | 몸통·얼굴 방향 전환, 치마 펼침, 베일 후행 |
| 67% | 가까이 포옹 |
| 73–84% | 무릎 굽혀 준비, 신부를 들어올리기 |
| 92–100% | 들어올린 자세에서 안정화 |

## 재현 / 검증

공식 Rive CLI 1.0.4 사용. 바이너리는 저장소에 포함하지 않는다.

```sh
RIVE_CLI=/path/to/rive npm run dance:build
npm run test:dance
rive inspect assets/rive/wedding-dance --summary
rive assets/rive/wedding-dance --screenshot=/tmp/dance-50.png --data=danceProgress=50 --advance=2
```

`RIVE_CLI` 미지정 시 PATH의 `rive`를 사용한다. macOS의 headless 렌더링에도
Metal 접근이 필요하다. 일반 배포 빌드는 이미 생성된 `.riv`/WASM을 사용하므로 CLI가 필요 없다.
Rive 의존성 버전을 바꾼 경우 WASM 동기화를 위해 `dance:build`를 다시 실행한다.

브라우저에서는 DPR≤2, 화면 밖/백그라운드 렌더링 절약, DOM/React 프레임별 재렌더링 없음.
모션 축소에서는 Rive를 마운트하지 않고 원화 정적 그림 6장을 표시한다.
로드 실패 시 첫 원화가 남고, 실제 예식 정보와 건너뛰기 링크는 계속 사용 가능하다.
원화와 동일한 붓터치/비율의 정밀 아트 디렉션 및 iOS·카카오톡 실기기 체감 검수는
브라우저 기능 검증과 별개의 최종 검수 항목이다.
