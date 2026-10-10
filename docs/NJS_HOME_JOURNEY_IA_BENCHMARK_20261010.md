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
