import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { publicValue, withNumber } from "./contentEnv";

test("publicValue turns blank env values into undefined", () => {
  assert.equal(publicValue("010-1234-5678"), "010-1234-5678");
  assert.equal(publicValue("  010-1234-5678  "), "010-1234-5678");
  assert.equal(publicValue(""), undefined);
  assert.equal(publicValue("   "), undefined);
  assert.equal(publicValue(undefined), undefined);
});

test("withNumber drops entries whose number was never provided", () => {
  const kept = withNumber([
    { label: "있음", number: "123-456" },
    { label: "없음", number: undefined },
    { label: "빈칸", number: "   " },
  ]);

  assert.deepEqual(kept, [{ label: "있음", number: "123-456" }]);
});

/**
 * 저장소가 **공개**라 전화번호·계좌번호가 커밋되면 git 히스토리에 영구히 남고
 * 자동 수집 대상이 된다. 그래서 그 값들만 환경변수로 주입한다.
 * 이 테스트는 누군가 편의상 숫자를 다시 적어 넣는 것을 막는다.
 */
test("the wedding config keeps personal numbers out of the public repository", () => {
  const source = readFileSync(new URL("../config/wedding.ts", import.meta.url), "utf8");

  // 휴대폰은 01x 로 시작한다. 예식장 대표번호(02-2144-0230)는 공개 정보라 일부러 걸리지 않는다.
  const mobile = source.match(/01\d-\d{3,4}-\d{4}/g);
  // 은행 계좌번호는 구분자 위치가 은행마다 달라 두 모양을 함께 본다.
  const account = source.match(/\d{3,}-\d{2,}-\d{4,}|\d{6,}-\d{5,}/g);

  assert.deepEqual(mobile, null, `휴대폰 번호가 소스에 박혀 있습니다: ${mobile?.join(", ")}`);
  assert.deepEqual(account, null, `계좌번호가 소스에 박혀 있습니다: ${account?.join(", ")}`);
});
