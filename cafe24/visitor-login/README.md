# NJS 방문자 로그인 UX — Cafe24 스마트디자인 적용 후보

상태: **SOURCE-BASED CANDIDATE / NOT INSTALLED / NOT DEPLOYED / A2 PENDING**
프로젝트: P30 / D-099 맥작가 개인 브랜딩 채널. 다른 상위 지식 플랫폼이나 P90 SaaS와 혼합하지 않는다.

## 방문자에게 필요한 동작

1. NJS에서 강의 이어보기 또는 커뮤니티 질문하기를 선택한다.
2. Cafe24에서 기존 회원정보로 로그인한다. 회원가입 및 아이디/비밀번호 찾기도 종전대로 가능하다.
3. 인증되면 NJS 강의 또는 커뮤니티에서 **원래 선택한 작업**으로 돌아간다(PR #102 auth-return candidate).
4. 일반 쇼핑몰 주문조회/구매자가 사용하는 Cafe24 로그인은 변경하지 않는다.

## 실제 기준 화면 및 문제

- 2026-10-11 현재 익명 사용자 라이브 Chrome 스크린샷: [CI run 38114006445](https://github.com/maxleekorea/neverjustsell-site/actions/runs/38114006445), artifact `cafe24-guest-login-mobile-desktop`. 1440/390 viewport.
- My Space 로그인, 질문하기 로그인, 직접 로그인 모두 현재 같은 Cafe24 로그인 화면에 도착한다.
- 화면 상단 첫 쇼핑 3,000원 쿠폰, 의류 카테고리(PC), 장바구니/쇼핑 메뉴, 혜택 중심 회원가입 문구 등이 NJS 방문자의 학습/질문 맥락보다 앞에 보인다.
- Cafe24 라이브 메타 설명에는 의류/액세서리 큐레이션이라는 과거 쇼핑몰 정체성이 남아 있다. 보이는 결제 모달과 단순 HTML 요소는 구분하여 기록한다. 자동 브라우저 도구에서 가끔 인기 상품 팝업이 포착되지만 CI 캡처에는 나타나지 않았으므로 상시 노출이라고 단정하지 않는다.
- 현재 GitHub 루트 `custom.js`·`custom.css`가 **실제 활성 Cafe24 로그인 스킨에 로드된다는 증거는 없음**. 해당 파일에 무조건 추가하지 않는다.

## 실제 Cafe24 스킨 적용 방법 — 관리자 확인 후만 수행

공식 매뉴얼:
- [Cafe24 SmartDesign 회원 로그인 모듈](https://sdsupport.cafe24.com/module/member/login.html)
- [Cafe24 스마트디자인 편집](https://support.cafe24.com/hc/ko/articles/7749165125401-%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%94%94%EC%9E%90%EC%9D%B8-%ED%8E%B8%EC%A7%91)
- [CSS 파일 위치 확인](https://support.cafe24.com/hc/ko/articles/8466199568281--%EB%94%94%EC%9E%90%EC%9D%B8%EA%B4%80%EB%A6%AC-%ED%8E%B8%EC%A7%91%EC%B0%BD%EC%97%90%EC%84%9C-CSS-%ED%8C%8C%EC%9D%BC%EC%9D%84-%EC%B0%BE%EA%B3%A0-%EC%8B%B6%EC%96%B4%EC%9A%94)

1. Cafe24 관리자 → 디자인 → 디자인 보관함 → **현재 적용 중인 PC/모바일 스킨**부터 읽고 백업한다. 브라우저 로그인만으로 관리자 원본을 확인했다고 주장하지 않는다.
2. 활성 디자인의 회원 → `member/login.html` 내에서 실제 `member_login` 모듈과 로그인 폼, 네이버 로그인, 보안접속, 비밀번호 찾기, 가입 및 OAuth 리턴 흐름을 식별한다. 구성요소를 삭제·재구축하지 않는다.
3. 운영 반영 전 별도 디자인 복제/미리보기에서 이 파일을 `/js/njs-visitor-login.js`로, CSS를 `/css/njs-visitor-login.css`로 추가하고 `member/login.html`에서 아래 선언을 포함한다. 실제 경로는 관리자에서 확인한다.

   ```html
   <!--@css(/css/njs-visitor-login.css)-->
   <!--@js(/js/njs-visitor-login.js)-->
   ```

4. 현재 HTML 소스에서 확인된 **쿠폰 띠 배너, 쇼핑 카테고리, 장바구니 홍보 영역, 인기 상품 추천 팝업**의 각 래퍼에만 `data-njs-commerce-only` 속성을 부여한다. 반드시 실제 래퍼/모듈을 조사한 뒤 결정한다. 그러면 NJS OAuth 로그인 화면에서만 해당 홍보를 숨기고 일반 상점 로그인에는 그대로 보인다. `member_login`, 오류·보안 안내, 회원가입, 인증수단, 필수 결제 안내를 잘못 가리지 않는다.
5. `returnUrl`가 Cafe24 자체 `/api/v2/oauth/authorize` + `response_type=code` + `client_id` + `state`를 가리키는 경우에만 안내 영역이 나타난다. `/myshop/order/list.html` 등 일반 상점 로그인은 변경하지 않는다.
6. 실제 계정으로 로그인/취소/인증오류/가입/아이디·비밀번호 찾기 및 결제창 복귀를 PC·390·320px에서 테스트한다. **PR #102의 인증 복귀 수정이 배포되기 전이라면 성공 후 원래 페이지 복귀를 보장한다는 문구를 게시하지 않는다.**

## 의도적으로 건드리지 않는 영역

- Cafe24 회원가입/주문/결제/환불 원본, OAuth code/state/redirect_uri, 비밀번호·세션 저장, CSRF, SNS 로그인, 주문 로그인.
- Cloudflare P30 메인 디자인, 강의 수강권 검증, 커뮤니티 게시글 데이터.
- 전 페이지에 걸친 배너/카테고리/상품 상세 수정. 배우기/질문하기 OAuth 로그인 상황에서만 한정한다.

## 검증 기록 및 배포 Gate

- `node tests/cafe24-login-visitor-contract.mjs`: OAuth 상황 판별/일반 쇼핑 로그인 불간섭/안내 한 번만 삽입/폼 유지 테스트.
- GitHub CI: PR #102 Production cross-domain smoke. 이는 **테스트 스킨 후보 코드**에 대한 검증일 뿐 Cafe24 실제 스킨의 스테이징/적용 검증이 아니다.
- 이전 PR #101과 #102 모두 Worker/커뮤니티 소스의 일부 경로를 수정하므로 A2 승인 시 병합 순서를 정하고 두 변경사항을 함께 회귀 테스트한다.
- 회원 프로필에서 이미 로그인된 학습·질문 화면 접근은 검증했고, 관리자 프로필에서 쇼핑몰 관리자 및 현행 로그인 템플릿 READ-ONLY 접근을 검증했다. 다만 **로그아웃 → Cafe24 재로그인 → 기존 고객 과업 복귀**와 복제 스킨의 실제 작동은 아직 검증하지 않았다. **운영 배포 및 추가 비용 발생 작업 모두 별도 승인 Gate.**


## 2026-10-11 운영 관리자 READ-ONLY 검증으로 확인된 파일 위치

- **관리자 접속 확인:** 직접 `https://neverjustsell.cafe24.com/admin`으로 접속한 관리자 프로필에서 대시보드 접근. `https://eclogin.cafe24.com/Shop/` 로그인센터는 별도 입구라 로그인 폼만 보였으며 '프로필 저장 실패'로 잘못 단정하지 않는다.
- **현재 PC 디자인:** `Never Just Sell`, Cafe24 Easy 반응형, 디자인 번호 `4`, 스킨코드 `skin2` (등록 2026-09-16). 실제 열람한 편집기 파일: `/member/login.html`; 파일의 스킨 디렉터리 `/skin-skin2/member/login.html`.
- 관리자 편집 진입 링크: `https://neverjustsell.cafe24.com/disp/admin/editor/main?skin_no=4&skin_code=skin2&shop_no=1&editorFile=/member/login.html` (별도 관리자 인증 필요).
- 템플릿의 `@layout(/layout/basic/layout.html)` 선언 및 Cafe24 `member_login` 모듈, `@css(/css/module/member/login.css)`, `@js(/js/module/member/login.js)` 인클루드를 읽기 전용 편집기에서 확인.
- 공통 헤더·쇼핑 카테고리·쇼핑 혜택 배너의 소유 지점은 `/layout/basic/layout.html`로 확인. **모든 방문자/상품·주문 페이지가 공유**하므로 공통 영역을 삭제·전역 숨김 처리하지 않는다.
- **모바일 대표 디자인:** 관리자 화면에는 별도 `쇼핑몰 기본디자인` 항목이 있으나 모바일 전용 디자인은 사용하지 않는 것으로 표시됐다. 편집기에서 보인 모바일 전용 경로 후보는 **현재 실제 모바일 렌더링에 사용되는 소스라고 독립 확인되지 않음**. 공개 사이트에 적용된 CSS와 관리자 설정을 추가 대조해 결정한다.
- **미확인:** 쿠폰·상품 카테고리·장바구니·추천 팝업 각각의 확정적인 DOM 래퍼 셀렉터, FTP 실물 원본, NJS OAuth 호출 때의 실제 중첩된 `returnUrl` 매개변수, PC/모바일 스킨 우선순위. 자동화가 제시한 `ez_banner`, `gnb` 등 명칭은 후보 단서이며 확정된 셀렉터로 사용하지 않는다.
- 관리자 접근 및 파일 트리 readback: [실제 스킨 파일 확인](https://agent.tinyfish.ai/runs/5e13d057-2346-4263-8c9b-4f7482810b0b); [관리자 접근](https://agent.tinyfish.ai/runs/e4f62211-4b03-491d-a189-11bccc1b980a). 변경/저장/적용/배포는 수행하지 않았다.
- 고객 과업 판단: `member_login`에 손대지 않고 **OAuth 학습 로그인만** 인식한 페이지 안내·색상·정보순서를 바꾼다. 일반 스토어 로그인을 바꾸는 전역 HTML/CSS 패치는 거부. 고객의 취소·회원가입·비밀번호 찾기·결제 흐름을 실제 스킨 복제 미리보기에서 테스트한 후 A2 공개 여부 결정.

**다음 안전한 Gate:** 현재 활성 스킨 `skin2`의 복제본에서만 `member/login.html` 파일에 NJS 전용 CSS/JS include와 명확히 확인된 비필수 쇼핑 홍보 래퍼 표식을 반영한다. 적용 전/후 1440·390·320px, NJS OAuth 경유 대 일반 주문 로그인, 로그인 취소/완료/복귀, 접근성, 세션·구매 회귀를 검증한다. 아직 스킨 복제/코드 업로드 자체는 하지 않았다.
