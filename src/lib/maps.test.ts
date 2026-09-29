import assert from "node:assert/strict";
import test from "node:test";
import { mapLinks } from "./maps";

test("지도 썸네일이 사용하는 네이버 링크는 예식장 주소와 좌표를 가리킨다", () => {
  const links = mapLinks("naver");
  assert.equal(
    links.web,
    "https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%86%A1%ED%8C%8C%EA%B5%AC%20%EC%98%AC%EB%A6%BC%ED%94%BD%EB%A1%9C35%EA%B8%B8%20137%2C%20%ED%95%9C%EA%B5%AD%EA%B4%91%EA%B3%A0%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%202%EC%B8%B5",
  );
  assert.match(
    links.scheme,
    /^nmap:\/\/place\?lat=37\.5159386&lng=127\.0996469&name=%EC%9E%A0%EC%8B%A4%20%EC%95%84%ED%8E%A0%EA%B0%80%EB%AA%A8&appname=/,
  );
});
