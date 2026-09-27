import assert from "node:assert/strict";
import { accumulationCards } from "../worker/src/member-onboarding.js";

const empty = accumulationCards({
  knowledgeSaved: 0,
  lessonsTracked: 0,
  lessonsCompleted: 0,
  programsActive: 0,
  programsCompleted: 0
});
assert.ok(empty.includes("첫 지식을 저장해 보세요"));
assert.ok(empty.includes("첫 학습 기록 만들기"));
assert.ok(!empty.includes("질문과 사례 보기"));
assert.ok(!empty.includes("무료 지식 보기"));

const accumulated = accumulationCards({
  knowledgeSaved: 7,
  lessonsTracked: 5,
  lessonsCompleted: 3,
  programsActive: 1,
  programsCompleted: 1
});
assert.ok(accumulated.includes("저장한 지식 7개"));
assert.ok(accumulated.includes("학습 기록 5개 차시"));
assert.ok(accumulated.includes("3개 차시를 완료"));
assert.ok(accumulated.includes("참여 프로그램 2개"));
assert.ok(accumulated.includes("https://www.neverjustsell.com/knowledge/saved"));
assert.ok(accumulated.includes('href="/programs"'));
assert.ok(!accumulated.includes("https://community.neverjustsell.com/spaces"));

console.log("member-continuity contract: ok");
