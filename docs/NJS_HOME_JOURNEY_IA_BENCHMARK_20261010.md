# NJS 메인페이지: 고객 여정·사이트맵·한국형 웹 벤치마크 (2026-10-10)

상태: 비공개 디자인 후보. D-099/A3의 맥작가 개인 브랜딩 채널 정의 유지. PR #100 병합 및 운영 공개는 A2 승인 이후.

## 전문가 기준과 NJS 적용

| 근거 | 전문가 원칙 | NJS 반영 |
| --- | --- | --- |
| [NN/g 홈페이지 원칙](https://www.nngroup.com/articles/homepage-design-principles/) | 누구의 어떤 문제를 풀고 무엇을 할 수 있는지 즉시 명료하게 전달 | 저자 얼굴/가치 제안/현재 실제 이용 가능한 CTA |
| [NN/g 정보 향기](https://www.nngroup.com/articles/information-scent/) | 메뉴·링크 문구로 도착 페이지 내용이 예측되어야 함 | 메뉴는 명사형 목적지, 본문은 문제·행동형 진입 |
| [GOV.UK 전체 여정](https://www.gov.uk/service-manual/design/map-a-users-whole-problem) | 조직 구조가 아닌 실제 과업을 서비스 경계 전체에서 연결 | www → classroom → community → My Space 교차 이동 검수 |
| [Baymard 2025 홈 내비게이션](https://baymard.com/research-articles/ecommerce-navigation-best-practice) | 메뉴/검색/추천 경로 중 하나만 강요하지 않는다 | 글로벌 직접 진입 + 공개 사례 큐레이션. 대형 커머스 연구 수치를 NJS KPI로 일반화하지 않음 |
| [토스 UX 라이팅](https://toss.tech/article/21022) | 한국어 사용자 문맥과 기능을 일치시키는 일관된 언어 | 번역체·내부 용어보다 실제 이용 동작을 설명 |

## 실제 한국 서비스에서 확인한 UI

- [CLASS101 선한부자 오가닉 개인 크리에이터 홈](https://class101.net/ko/creators/%40organic): 저자/크리에이터 소개 → 현재 클래스 → 커뮤니티/메시지의 관계. 창작자 중심이되 실제 상품/참여 목적지를 분리.
- [CLASS101 존리 머니스쿨](https://class101.net/ko/creators/%40Johnleeschool): 인물·브랜드·게시글과 멤버십 직접 진입, 공개와 멤버 전용 콘텐츠를 구별.
- [MKYU 홈](https://www.mkyu.co.kr/main/index.jsp) 및 [대표 소개](https://www.mkyu.co.kr/main/page.jsp?code=greeting&ln=greeting): 클래스·커뮤니티·마이클래스를 다른 과업으로 안내하는 방식 참고. 대형 교육몰의 전체 상품 카드/배너 밀도는 복제하지 않음.
- [롱블랙 소개](https://longblack.co/about) 및 [전체 노트](https://longblack.co/note): 원하는 변화/사용 가치 → 실제 읽을 콘텐츠 → 독자의 반복 경험. 개인 브랜드가 아닌 편집형 서비스이므로 콘텐츠 발견성만 참고.
- 기존 NJS LiveKlass: P30 handoff의 과거 실제 PC/모바일 캡처 기준 유지. 저자 전문성, 실물 썸네일, 수강/커뮤니티 직접 진입.

## NJS 운영 사이트맵과 메뉴별 기능

| 메뉴 | 실 주소 | 역할 |
| --- | --- | --- |
| 홈 | / | 맥작가의 개인 브랜드 및 고객 가치·입구 |
| 콘텐츠 | /content | 유튜브·브리핑·칼럼·사례·책 해석. 아직 없는 글은 실제 콘텐츠처럼 전시 금지 |
| 강의 | https://classroom.neverjustsell.com/courses | 실제 수강 가능한 무료 온라인 유통의 기본, 다른 강의의 준비 상태를 구분 |
| 커뮤니티 | https://community.neverjustsell.com/ | 기존 게시글·질문·토론·실행 기록 |
| 지식·자료 | /knowledge 및 /knowledge/:slug | 공개된 문제별 자료·지식 검색, /knowledge/saved의 저장 |
| 책 | /book | 출간된 책 소개·저자 신뢰 |
| 맥작가 | /about | 저자 경험 및 관점 |
| 강연·컨설팅 | /lecture | 기업/조직 목적형 진입, 온라인 접수는 준비 중 |
| 내 공간 | https://classroom.neverjustsell.com/my-space | 기존 회원의 내 강의/학습 이어보기 |
| 스토어 | /store | 판매 정보·이용 연계, 미판매 상품 판매 중 표시 금지 |
| 고객지원 | /support | 결제/취소/환불 등 이용 경로 |
| 프로그램 | 공개 /programs 경로 확인에서 HTTP 400 | 기존 Program 런타임 자산과 분리해 파악. 유효한 공개 모집/신청 경로 확정 전 메인 판매 CTA 금지 |

운영 sitemap.xml에서 60개 URL 확인. 상세 지식 항목은 실제 공개된 항목만 참조한다. 다른 프로젝트 및 상위 통합 지식 플랫폼 기능을 NJS에 넣지 않는다.

## 방문자의 서로 다른 여정

| 유입/상태 | 관심과 다음 행동 |
| --- | --- |
| 검색·첫 방문 | 구체적 문제 → 실제 사례/지식 상세 → 필요 시 무료 강의/관련 질문 |
| 유튜브·책·인스타에서 유입 | 맥작가의 관점 확인 → 최신 영상·브리핑 → 강의 → 커뮤니티 |
| 강의를 찾는 신규 사용자 | 무료 강의 내용/대상 확인 → classroom의 실제 강의 등록 |
| 질문하려는 사람 | 실제 커뮤니티 글을 먼저 읽고 질문. 글 작성 로그인 안내 |
| 기존 회원 | 헤더/모바일 메뉴에서 내 공간 → 이어보기/저장 자료 |
| B2B | 하단 강연 주제 소개 → /lecture, 현재 온라인 상담 접수 미개설 |

## 히어로부터 하단까지 화면 구성

1. 헤더: 콘텐츠 / 강의 / 커뮤니티 / 지식·자료 / 책 / 맥작가. 보조는 강연·스토어·고객지원. 회원 내 공간과 검색 직접 진입 유지.
2. Hero: 맥작가 실제 사진 + 짧은 고객 효용 + 공개 사례/무료 강의 CTA. 모바일 사진은 큰 화보가 아니라 작은 신뢰 신호.
3. 첫 가치: 지금 겪는 4개 실제 문제 → 운영 지식 상세. 사진이 없는 사례는 헤어라인 텍스트 리스트.
4. 현재성: YouTube 실제 피드와 날짜 있는 브리핑, 발행되지 않은 칼럼의 가짜 미리보기 금지.
5. 학습: 실제 무료 강의의 학습 범위·이미지·상세로 연결. 다른 강의는 목록에서 이용 가능 상태 확인.
6. 관계: 실제 커뮤니티 공개 글/실행 기록, 질문 작성은 로그인 요구 고지.
7. 신뢰: 책 표지와 맥작가 경력을 근거로 배치.
8. 확장: 기업 강연·교육을 찾는 이용자를 위한 별도 낮은 비중의 하단 진입.

## 색상·형태 규칙

원본 로고의 황갈색은 약 #6A3A09. 브랜드 자산 자체의 색은 유지하고 버튼·배경 전체를 로고색으로 채우지 않는다. 저채도 에스프레소 #322A25, 잉크 #27231F, 따뜻한 베이스 #FAF9F7, 보조면 #F2F0EC, 경계 #E2DFD9. 한국어 Pretendard, 1440/390 별도 비율, 과잉 카드와 거대한 회색 빈 화면 회피.

## 공개 전 Gate

- Private PR #100의 PC 1440/1280 및 모바일 390/360에서 실제 스크린샷, 줄바꿈, 상단 행동, 링크와 권한을 수동 재검토.
- CI 네 가지 성공과 실제 고객 과업 검증을 구분한다.
- 운영 배포, 가격·가입, 자료 원본과 대외 문구는 A2 승인 전 변경하지 않는다.

## 통합 UX 벤치마크 근거 색인 및 타이포그래피 QA (2026-10-10 증분)

이 섹션은 이전 조사 원문을 복사·재해석한 별도 Canonical을 만들지 않고, **기존 근거 자산의 포인터**와 이번 회귀 검증만 연결한다. P00 AI-NATIVE-v1 §13.3 분류상 P30 / WF-03(조사근거) + WF-06(코드) + WF-08(QA)이다. 아래의 외부 전문가 주장은 Research Evidence이며, NJS 전용 크기 수치와 UI 적용은 **Project-local candidate**이다. A2 공개 승인 전 공통 Skill·헌법 규칙으로 승격하지 않는다.

### A. 대화 간 계속 재사용해야 할 기존 P30 전문 조사

| ID | 원본 위치 | 역할 및 상태 |
| --- | --- | --- |
| P30-UX-CORE | [P30 UX AUDIT PROTOCOL](https://docs.google.com/document/d/15ZkxQqGykC7Rf9LxprOqThfUlngzQQ5d-ZuzPdKCeOM/edit) | 기존 공식 검수 절차/단위 기능과 고객 과업, 320px 리플로·모바일 분리, 전문가·수동·자동 감사의 역할 구분. 유지 |
| P30-UX-MATRIX | [P30 VISUAL UX BENCHMARK MATRIX](https://docs.google.com/spreadsheets/d/1wHDdXPjgDHwnV8hUx6HI9HXyqvtalFrxk-fO8HjiuTw/edit) | 과거 벤치마크 비교 근거, 새 HTML/P30 요약과 중복하지 말고 참조 |
| P30-UX-IA | [P30 UX IA SITEMAP AND AUDIT](https://docs.google.com/document/d/1Y9xMEcGXTeSPK6Xn8GJDvR6jVW4Qpn4IcEsT1ksBpVo/edit) | 지식·학습·커뮤니티·거래가 다른 기능이라는 IA 원본 |
| P30-UX-HOME | 본 문서의 위 '전문가 기준과 NJS 적용'·'실제 한국 서비스에서 확인한 UI' | 2026-10-10 D-099 개인 브랜드 홈 및 고객 여정 연구. 확정된 제품 경계 준수 |
| P30-UX-COPY | [NJS 하위 메뉴 문구·기능 감사](./NJS_SUBPAGE_UX_COPY_AUDIT_20261010.md) | 실제 강의/스토어/콘텐츠/지식/지원 도착 화면과 사용자 언어, 아직 없는 콘텐츠·결제 기능 허위표기 방지. PR #100 후보 |
| P30-UX-COLOR | 본 문서 '색상·형태 규칙' | 로고 원색은 정체성 자산, UI에는 독립된 저채도 에스프레소 톤. 서비스간 브랜드 충돌 금지 |
| P30-UX-TYPE | 이 증분 섹션과 [CSS](../site/public/v33.css), [측정 스크립트](../site/scripts/njs-typography-audit.mjs) | 타이포그래피 소스·측정·리그레션, 반영 전 A2/실화면 검수 |

### B. 타이틀 크기와 줄 수 연구 — 원문/적용 구분

| 원문(외부 Source) | 실제 내용 | NJS 적용 가설 및 검증 |
| --- | --- | --- |
| [GOV.UK Type scale](https://design-system.service.gov.uk/styles/type-scale/) | 제목 규모는 소수의 단계·행간으로 구성하고, 화면 폭에 따라 반응형 크기 변경. 큰 화면 48/36/24, 작은 화면 32/27/21 등 | 한국어를 그대로 치환하지 않고 5개 뷰포트에서 제목의 실제 줄 수·가독성 측정. 리듬 일관성 |
| [GOV.UK Headings](https://design-system.service.gov.uk/styles/headings/) | 시맨틱 H1/H2/H3 위계 유지, 긴 제목에는 적절한 시각 단계 선택 가능 | 큰 제목이 세 줄 이상 불필요하게 쌓이면 크기/폭/의미 있는 카피부터 조정 |
| [LINE LDSG Typography](https://designsystem.line.me/LDSG/foundation/typography-ko) | Title과 Text 유형별 토큰/행간을 분리, 언어별 가독성 차이를 고려 | 한글 자간/줄바꿈과 제목·본문의 독립 규격화. LINE은 한국어의 특정 픽셀값을 지시하지 않음 |
| [W3C WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) | 200% 확대 시 정보나 기능을 잃으면 안 됨 | 제목에 줄수 강제 제한·ellipsis·고정높이 숨김 금지. 확대 시 자연스럽게 reflow |
| [W3C WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | 320 CSS px 상당의 폭에서 양방향 스크롤 없이 이용 가능해야 함 | 320/360/390 및 1280/1440에서 overflow·heading lines·font size를 실제 브라우저 레이아웃 기준 측정 |
| [GOV.UK updated typography rationale](https://design-system.service.gov.uk/get-started/new-type-scale/) | 현대의 모바일 웹은 단순 글자 축소가 아니라 실제 판독성과 접근성 확인을 중시 | '모바일은 무조건 작게'라는 기준 폐기. 화면 내 불필요한 과다 행수 vs 판독성 사이 절충 |

### C. 프로젝트 로컬 후보: 구현과 품질 Gate

- 디자인 본체: 사용자 승인한 Home의 배치·색상·서비스 구조는 유지하고 H1/H2 및 대형 콘텐츠 제목의 크기·행간만 체계적으로 조정.
- 반응형: 1440/1280에서 본문/타이틀 위계, 390/360/320에서 제목의 실제 줄 수를 측정. 의도적 두 줄 제목은 유지, 장문은 의미를 해치지 않는 선에서 짧게 표현.
- 방법: `clamp(rem, vw, rem)` 기반 하한/상한 → 일반 화면 제목 줄수 모니터 → 200% 확대·320px reflow 탐색. 수치 자체는 사용자 선호·실측 확인 전 CANDIDATE.
- 회귀 도구: `site/scripts/njs-typography-audit.mjs`가 DevTools Protocol로 실제 DOM 렌더링을 관찰하여 `screenshots/typography-audit.json` 생성. 미리보기 워크플로의 QA artifact로 남긴다. 자동화의 PASS는 인간 UX PASS와 동일하지 않다.
- 실패 재발 방지: 초기에 큰 제목의 임의 `font-size` 추가, `br` 고정과 모바일 폭 충돌, 문자열 기반 문구 테스트만 PASS하는 오류를 회귀 후보에 보관. Lint/DOM 측정으로 전환하여 검증 가능하게 한다.
- 라이프사이클: Source/Evidence → Project-local pattern candidate → 실측 QA/실제 사용자 검증 → 반복 재현 시 Verified Learning / Harness·Skill 후보. 단일 수정으로 OpenClaw/ChatGPT Skill 설치 완료라 주장하지 않는다.
- 교차 서비스: PR #101 Classroom·Community 문구 및 별도 기능·인증의 owner는 그대로, P30의 타이틀 패치를 해당 런타임에 자동 전파하지 않는다.

### D. 참고: 이전 대화에서 쌓은 외부 UX 방법과 재사용 연결

- 고객 가치 제안·첫 화면 메시지: 위 NN/g homepage, [CXL 가치제안 연구](https://cxl.com/blog/value-proposition/), [Strategyzer Value Proposition](https://www.strategyzer.com/library/the-value-proposition-canvas), [April Dunford positioning](https://www.aprildunford.com/). 적용은 고객가치 → 실제 사례 → 학습/커뮤니티.
- 한국형 실서비스/문구: 본 문서에 기록된 CLASS101 개별 크리에이터, MKYU, 롱블랙과 [토스 UX 라이팅](https://toss.tech/article/21022). 플랫폼형 메인 템플릿 복사 금지.
- 검수·IA/행동 경로: 기존 P30 UX AUDIT PROTOCOL의 Nielsen Norman Group/Baymard/GOV.UK/W3C 평가 절차를 그대로 사용.
- 컬러와 역할: 원본 로고 색상 복제 대신 [IBM Carbon](https://carbondesignsystem.com/guidelines/color/overview/), [Atlassian design tokens](https://atlassian.design/foundations/design-tokens/), [Adobe 색상 이론](https://color.adobe.com/create/color-wheel) 근거를 색채 역할 구분의 *참고*로 유지. 색상 코드나 실제 성과는 NJS 자체 검증 대상.

**상태:** RESEARCH/PROJECT-LOCAL QA CANDIDATE, not globally approved Skill. 보고는 CI와 실제 화면 readback 이후. 다음 Gate는 A2 시각 승인/프로덕션 이전 검증이다.


## 2026-10-11 설치된 Web UX Evidence Audit 실사용 검수 — 증분

**범위/승인 상태:** `skills://web-ux-evidence-audit`는 설치 목록 조회 및 지침 호출로 활성화 확인. D-099/P30 맥작가 개인 브랜드 채널, PR #100 **DRAFT / NOT MERGED** 및 PR #101 별도 초안. 운영 서비스 코드는 건드리지 않았다.

**재사용된 원본:** 본 문서의 NN/g 정보 향기·홈페이지, GOV.UK 전체 고객 과업·타이포그래피, 토스 UX 라이팅, LINE 한글 타이포그래피, 국내 CLASS101 개별 창작자 홈/MKYU/롱블랙 비교, Google Drive [P30 UX Audit Protocol](https://docs.google.com/document/d/15ZkxQqGykC7Rf9LxprOqThfUlngzQQ5d-ZuzPdKCeOM/edit)와 [P30 Charter](https://docs.google.com/document/d/1dThOFRU9WONP__5in_lJ_mxnKs2g2HlVNVXLaPTqkuM/edit) 참조. NN/g/GOV.UK/토스 원문 재확인, LINE 동적 원문은 자동 텍스트 추출 결과가 비어 **원문 본문 독립 검증은 보류**. 새로운 전문가 권고를 임의 생성하지 않는다.

**브라우저 증거:** [GitHub Actions release visual QA #38060546192](https://github.com/maxleekorea/neverjustsell-site/actions/runs/38060546192), artifact `njs-v33-release-visual-qa` (`typography-audit.json`; source commit `93e08ba4797c68824567e8a1c0a715003f9a39e4`). 이후 PR HEAD `4976050cb2808eea7736f77a31190e55323a2a37`는 벤치마크 문서 증분이며 4종 CI 성공. 9페이지 × 5폭(1440/1280/390/360/320)=45개 레이아웃의 누락·H1·잘림·가로 넘침 검사 PASS. 설치 Skill 단위시험 3/3 및 의도적 오류 주입 6건 기대대로 판정. 단 390/360/320 스토어 H1은 **3행**, 320 맥작가 소개 H1은 **3행**이고, 200% 검사는 **root CSS font-size probe이지 실제 브라우저 줌이 아님**. 이 검수는 **비공개 PR 예시 데이터**를 사용했으며 실운영/실제 유저 로그인 QA를 대체하지 않는다.

**시각적 관찰(코드/스크린샷):** 모바일 390/320에서 첫 화면의 홈·지식·강의·고객지원은 목적지가 비교적 분명하고 제목 잘림은 없음. 단 맥작가 소개·강연 페이지는 **인물/강연 사진이 메시지보다 먼저 나와** 좁은 화면에서 내용 이해가 늦어질 가능성(PARTIAL), 스토어 H1은 3줄(PARTIAL); 단독 디자인 결함 확정이 아니라 다음 시각 검수 후보. 실제 소형 기기 터치와 확대 검증 미실시.

**운영 사용 경로 관찰(2026-10-11 공개 페이지):** 공개 지식 상세 (ROAS·가격·재구매·플랫폼변경), 강의 `classroom.neverjustsell.com/courses` 및 무료 강의 상세 `/courses/online-commerce-basics`, 커뮤니티 공개 글 `/p/29`, `/p/27`, 실행 기록 `/c/reading-action` 조회됨. 그러나 `classroom.../my-space`·`community.../write?intent=question`은 로그인 이전 Cafe24 쇼핑몰 로그인 화면으로 이동하며 **회원가입 3,000원 쿠폰 및 결제 진행 관련 일반 쇼핑몰 문구**가 표시됨. 로그인/권한은 정상 설계일 수 있으나 사용자 관점의 브랜드 일관성과 로그인 후 원래 목적지 복귀를 실제 로그인 계정으로 검증해야 함(HIGH PRIORITY). `community.../course-questions`는 외부 읽기에서 시간 초과해 상태 미확인.

**운영/초안 차이:** 프로덕션에서는 아직 '필요할 때 다시 꺼내볼 것', '읽은 것을 직접 써볼 수 있게', '취소·환불 신청' 등 구표현과 칼럼 미발행 중심 배치가 노출. PR #100은 이를 개편한 초안이나 배포하지 않았고, PR #101의 강의/커뮤니티 첫 화면 문구 수정도 배포되지 않음. 따라서 개선안 통과를 운영 개선 완료로 보고 금지.

**근거 Gate:** `SOURCE FACT → P30 적용 가설 → 실제 화면/기능 → CI → A2 승인`. 현재 상태 `AUTOMATED_LAYOUT_PASS / LIVE_JOURNEY_PARTIAL / SKILL_REUSE_PASS / RELEASE_NOT_APPROVED`. 다음에는 ① 실제 로그인-복귀·브랜드 일관성 ② 실제 공급되는 유튜브/브리핑 및 로그인된 강의 상태 ③ 320/390 모바일 첫 화면의 이미지·줄 수·클릭/터치 ④ 실제 브라우저 확대 및 키보드 ⑤ A2 승인 순서로 검증할 것. 기존 메인 디자인과 제품 경계를 재정의하지 않는다.


## 2026-10-11 PR #100 메인 반복 구성 감사 — 전문가 근거와 시각 검수 (CANDIDATE)

**현행 기준:** D-099 맥작가 개인 채널 / 사용자 선택 메인 디자인 유지. 대상 비공개 PR #100, 화면 코드 \`site/src/njs-home-journey.js\`, PR 검증 커밋 \`a60168addb2f8b0ce56e022233af11d0ef835afd\`. PC 1440 캡처와 모바일 390·360·320 캡처는 기존 [visual QA 실행](https://github.com/maxleekorea/neverjustsell-site/actions/runs/38141344985)의 \`njs-v33-release-visual-qa\` artifact. 지금의 반복 진단은 **실제 PR 미리보기 스크린샷+HTML/CSS 코드 관찰**이고, 실제 방문자 A/B 결과가 아니다. 코드 수정/운영 공개는 이번 연구 범위에서 하지 않는다.

### 코드와 화면에서 확인한 정보 구조 반복

- 현재 메인은 Hero → 문제별 사례(4행) → YouTube/브리핑(2종) → 무료 강의 → 커뮤니티(공개 글 3행) → 저서·저자 → 하단 강연·기업교육, 6개의 본문 section + 보조 aside 구조. **섹션이 많다는 사실만으로 문제로 판정하지 않는다.**
- Hero·무료 강의·커뮤니티는 '작은 분류명/강한 2행 제목/설명/주 CTA+보조 CTA/반대편 증거 이미지·링크'를 반복. 특히 PC의 연속된 강의·커뮤니티 split 영역과 모바일의 CTA→이미지→다음 CTA 흐름은 시각적 비중이 비슷해 각 행동의 차이가 흐려질 수 있음(PARTIAL).
- 문제별 사례의 헤어라인 4개와 커뮤니티 공개 글의 헤어라인 3개는 동일한 '작은 분류/굵은 제목/↗' 패턴. 각각의 목록 내부 일관성은 보존하되, 커뮤니티는 **지식 카드가 아니라 사람의 질문/교류 경험**임을 문맥과 실제 글 내용으로 차별화할 필요(PARTIAL).
- ‘지금 겪고 있는 문제부터 살펴보세요’, ‘요즘, 어떤 이야기를 하고 있을까요?’, ‘비슷한 경험을 읽고, 내 질문도 남겨보세요’는 문법 오류보다 페이지 내용/다음 행동에 관한 **정보 단서의 약함**이 문제일 수 있다. H2·eyebrow·상단 링크가 반복되므로 제목 자체의 주제성과 우선순위를 테스트할 것.
- Hero에 인물·저자 이미지를 쓰고, 무료 강의에 실제 썸네일을, 마지막에 책 표지를 넣은 것은 역할이 다름. 제작 비용이 큰 신규 이미지/모션을 만들거나 책/저자 영역을 통째로 삭제하지 않는다.
- CTA와 메뉴의 목적지 중복은 무조건 없애지 말 것. 신규 방문자의 사례/무료강의와 로그인 회원의 My Space는 의도가 다르다. 다만 **각 구간에서 경쟁하는 주 CTA 수와 사용자 목적**을 검수한다.

### 전문가 원문과 기존 P30 패턴 비교

- 기존 [VISUAL UX BENCHMARK MATRIX / Pattern Extraction](https://docs.google.com/spreadsheets/d/1wHDdXPjgDHwnV8hUx6HI9HXyqvtalFrxk-fO8HjiuTw/edit)의 **V04 카드형 UI 반복 지양**, **V13 매 구간 경쟁 CTA 지양**, **V01 한 여정의 narrative**, **V07 첫 가치 경험**, **V10 독립 모바일 우선순위**는 이미 존재한다. 새 룰이나 중복 Skill을 만들지 않고 **현 구현과 기존 결정의 차이를 검수**한다. 해당 매트릭스 'Home v4.1/4.4 Contract'는 D-099 이전 설계층일 수 있으므로 현재 제품 정의·승인 디자인을 덮어쓰지 않는다.
- [NN/g Homepage Design (Huei-Hsin Wang, 2024)](https://www.nngroup.com/articles/homepage-design-principles/): 사용자 목적과 핵심 행동이 명료해야 하며 콘텐츠 예시가 있어야 함. 모든 섹션을 동일 비중으로 강조하면 우선순위가 흐림.
- [NN/g Scanning Patterns (Kara Pernice, 2017)](https://www.nngroup.com/articles/eyetracking-tasks-efficient-scanning/): 같은 종류의 목록은 **일관된 항목 위치**가 더 빠른 scanning에 도움. '반복이라서 리스트 형태를 모두 다르게'는 증거와 모순.
- [NN/g Layer-Cake Scanning (Kara Pernice, 2019)](https://www.nngroup.com/articles/layer-cake-pattern-scanning/): H2/분류 제목만 훑어도 내용과 관련성이 예측돼야 함.
- [NN/g Information Scent (Raluca Budiu, 2020)](https://www.nngroup.com/articles/information-scent/)와 [3 IA Mistakes (Page Laubheimer, 2023)](https://www.nngroup.com/articles/3-ia-mistakes/): 모호한 CTA/링크·중복/부정확한 설명은 클릭 예측을 방해.
- [NN/g Zigzag Layout (Kim Flaherty, 2017)](https://www.nngroup.com/articles/zigzag-page-layout/): '다양하게' 보이려고 사진 좌우 위치를 계속 교대하는 장식형 지그재그는 scanning을 악화할 수 있다. **차별화는 섹션의 목적·콘텐츠 종류·시각적 가중치로**, 형식 교차만으로 해결하지 말 것.
- [GOV.UK Whole User Journey](https://www.gov.uk/service-manual/design/map-a-users-whole-problem): www → classroom → community 사이 실제 일의 연속성을 보존. 콘텐츠 구성을 고치는 일이 실제 회원 인증·권한 문제를 해결했다고 보고하지 말 것.

### 실서비스 관찰 — 따라 할 패턴만 추출

| 확인한 실제 서비스 | 관찰한 차별적 콘텐츠 역할 | NJS 후보 / 비적용 |
| --- | --- | --- |
| [Justin Welsh 개인 홈페이지](https://justinwelsh.me/) | 대표 글·인기 에세이·무료 자료처럼 서로 다른 읽기 목적을 다른 맥락으로 제시 | 메인 영상/브리핑에 '최근' vs '대표' 등 실제 가능한 분류만 사용; 구독 숫자/평판 모방 금지 |
| [Ali Abdaal 무료 자료](https://aliabdaal.com/free-resources/) | 주제별 탐색과 콘텐츠 형식별 탐색을 분리 | NJS 문제 사례는 문제 중심 목록, 영상·브리핑은 실제 콘텐츠 중심으로 차별 |
| [The Futur 홈](https://thefutur.com/) | 최신 영상과 인기 영상·행사·리소스를 기능별 밀도가 다르게 노출 | 실제 데이터 있을 때만 인기순/최신순 구분. 조직형 플랫폼 홈을 NJS 개인 브랜드 홈으로 복제 금지 |
| [CLASS101 선한부자 오가닉 크리에이터 홈](https://class101.net/ko/creators/%40organic) | 인물·강의·커뮤니티에 직접 들어가는 목적지를 분리 | 개별 크리에이터 채널의 직접 과업 연결만 참고; CLASS101 플랫폼 홈 복제 금지 |

### 현재 디자인을 유지하는 최소 변경 후보 (미구현)

1. Hero의 얼굴·메시지·대표 CTA, 전반 색상·타이포·4개 사례 접근은 유지한다. **해결되지 않은 화면 피로를 전체 리디자인 명분으로 삼지 않는다.**
2. 사례 목록은 헤어라인 형태와 4개 실제 지식 상세를 유지한다. 섹션 제목을 방문자 과업에 직접 대응시키되 별도 카드/아이콘을 만들지 않는다.
3. 미디어는 실제 영상 대표 이미지 1개 + 더 가벼운 브리핑 읽기 블록으로 구분(기존 큰 구조 유지). 제목을 '무엇을 볼 수 있는지'가 분명한 한국어로 검토한다.
4. 강의는 현재 이용 가능한 **단 하나의 무료 강의와 배울 내용·상세 진입**에 집중하고, 소개 단락과 중복된 3개 불릿 중 실제 과업상 가치 낮은 문구를 줄이는 실험 후보로 둔다.
5. 커뮤니티는 또 하나의 '설명+두 버튼+목록' 랜딩보다 **실제 공개 질문 한 건을 전면에 두고 관련 글을 가볍게 연결**하는 변형 후보. 실제 댓글 수·작성자·화제가 검증되지 않았으면 만들지 않는다. 바로 커뮤니티/질문 작성 링크는 계속 열어둔다.
6. 하단 책/저자와 기업교육 보조 진입은 남긴다. 첫 화면의 얼굴과 아래 책 증거는 서로 역할이 다르므로 중복으로 간주해 삭제하지 않는다.
7. 모바일에서 CTA 밀도·스크롤 흐름, 첫 390px 화면, 320px 터치, 실제 로그인 복귀를 별도 평가한다. 반응형 45조합 레이아웃 PASS는 '개성/정보 차별화/완료 가능한 이용 여정' PASS가 아니다.

**검증 Gate:** (A) 5초 인지: 처음 보는 사람이 '누구의 사이트/무엇을 할 수 있나' 구술 → (B) 첫 클릭: 유튜브에서 온 방문자가 영상/실제 사례/무료 강의 경로를 추측 없이 찾음 → (C) 강의/커뮤니티 각 목표 선택: 두 섹션을 혼동하는지 → (D) 390/320 실제 스크롤/사진 비율/링크·브라우저 줌 확인 → (E) 지표 수집 전엔 시각 선호·전환 개선 주장 금지. 이후 사용자 A2 전에 PR #100 로컬 candidate로 소규모 수정·스크린샷 전후 비교. 이번 문단은 **RESEARCH/PROJECT-LOCAL-CANDIDATE**이며 실제 CSS·카피·배포 변경 없음.
