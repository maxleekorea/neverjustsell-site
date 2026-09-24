# Course Platform Benchmark

Updated: 2026-09-23

이 문서는 NEVER JUST SELL 강의 플랫폼 개발 시 참고할 운영/UX 기준이다.
특정 서비스를 그대로 복제하지 않고, 여러 서비스에서 반복되는 구조를 공통 원칙으로 추출한다.

## 조사 대상

- publ 공개 도움말: https://ko.docs.publ.biz/ko/pages/published/
- publ Drive 자료: `퍼블/원데이런칭 키트 (강의VOD).zip`
  - 따라하기 가이드 (강의 VOD).pdf
  - 온보딩 키트(강의VOD).pbchannel
- LiveKlass 운영 가이드: https://guide-kr.liveklass.com/
- Teachable Help Center
- Thinkific Help Center
- Podia Help Center
- Kajabi Help Center

## 1. 가장 중요한 공통 원칙: 콘텐츠, 노출, 판매, 수강권을 분리한다

하나의 `published` 값으로 모든 상태를 결정하지 않는다.

최소한 다음 네 축을 별도로 관리해야 한다.

1. 콘텐츠 상태
   - draft / ready / published / archived
   - 실제 강의 콘텐츠를 수강생에게 재생할 수 있는가

2. 카탈로그 노출
   - catalog_visible
   - 강의 찾기/사이트 목록에 노출되는가

3. 판매 상태
   - setup / selling / paused / ended
   - 신규 구매가 가능한가

4. 수강권 상태
   - active / revoked / expired / pending 등
   - 특정 회원이 실제 강의실에 접근할 수 있는가

### 근거

LiveKlass는 판매 상태(설정 중/판매 중/판매 중단)와 공개 상태(전체 공개/일부 공개)를 분리한다.
판매 중단 상태에서도 전체 공개라면 사이트 노출과 상세 페이지 진입은 가능하지만 신규 구매만 막힌다.

Teachable은 Publish status와 Product visibility를 별도 설정으로 관리한다.
Unlisted 상품도 직접 URL 접근은 가능하다.

Podia는 Availability 안에서 Status, Visibility, Access를 별도로 관리한다.

### NJS 적용

현재 적용:
- `catalog_visible` 추가
- `status/visible`과 강의 찾기 노출 분리
- `sales_enabled`과 수강권 분리

추가 정리 필요:
- `sales_enabled` boolean을 장기적으로 판매 상태 enum으로 확장 검토
- 상품 상세 페이지 직접 접근 정책 추가
- 일부 공개/unlisted 지원 검토

---

## 2. 강의 콘텐츠와 판매상품(Offer)은 분리한다

publ은 클래스 자체와 유료 이용권/콘텐츠 카테고리를 분리한다.
하나의 콘텐츠에 서로 다른 가격·유효기간의 이용권을 둘 수 있다.

LiveKlass는 상품 안에 판매 조건 카드를 여러 개 둘 수 있다.
가격, 판매 기간, 수량, 수강 기간, 쿠폰 사용 여부를 판매 조건 단위로 관리한다.

Teachable도 한 Course에 여러 Pricing Plan을 둘 수 있다.
Thinkific도 Course와 Pricing을 분리한다.

### NJS 적용 방향

현재:
- course 1개 ↔ Cafe24 product 1개

단기에는 충분하지만 아래 기능이 생기면 별도 Offer 모델이 필요하다.
- 정상가 / 얼리버드
- 책 구매자 할인
- 기간 한정 가격
- 패키지
- 수강기간 차등
- 정기구독
- 동일 강의 재판매 조건 변경

권장 미래 구조:

```
course
  └─ offer
      ├─ cafe24_product_no
      ├─ price
      ├─ access_duration
      ├─ sale_start/end
      ├─ coupon_policy
      └─ status
```

실제 강의 콘텐츠와 과거 구매자의 거래조건이 섞이지 않게 한다.

---

## 3. 거래조건은 구매 후 함부로 변경하지 않는다

publ은 생성된 유료 이용권의 상품명·판매가·이용기간처럼 거래 당시 핵심 조건을 수정하지 못하게 하고,
조건을 바꾸려면 새 이용권을 만들도록 한다.

이 방식은 기존 구매자의 권리를 보호하고 운영 데이터의 의미를 보존한다.

### NJS 적용 방향

현재 Cafe24 상품 가격을 수정할 수 있지만,
장기적으로는 entitlement에 구매 당시 조건 snapshot을 저장하는 것이 안전하다.

예:
- purchase_price
- purchased_at
- access_duration_days
- access_expires_at
- offer_id
- coupon/discount 정보

새 가격은 신규 구매에만 적용한다.

---

## 4. 판매 중단과 기존 수강권 회수는 다른 동작이다

LiveKlass:
- 판매 중단 → 신규 구매만 중단
- 기존 수강생의 권한은 유지

Podia의 visibility 변경도 기존 구매자의 접근권과 별도로 작동한다.

### NJS 적용 방향

`판매 중지`가 기존 entitlement를 revoke해서는 안 된다.

수강권 회수는 다음과 같은 회원별 사건으로 처리한다.
- 전체 취소
- 전액 환불
- 운영자 강제 회수
- 수강기간 만료
- 결제 실패/미납(향후 구독 시)

---

## 5. 환불과 수강권 회수는 1:1이 아닐 수 있다

현재 NJS 테스트:
- 결제 완료 → active
- 주문 취소 → revoked

기본 E2E 검증으로는 적절하다.

하지만 LiveKlass는 부분 취소 시
`수강 유지`를 선택하면 부분 환불 후에도 수강권을 유지할 수 있다.

따라서 향후에는 단순히 환불 금액 > 0이라는 이유로 항상 revoke하면 안 된다.

정책 확정 후 필요한 상태 예:
- active
- revoked
- expired
- refund_pending
- partial_refund_access_kept
- partial_refund_revoked

운영정책 확정 전에는 자동 부분환불 로직을 구현하지 않는다.

---

## 6. 수강기간은 별도 속성으로 취급한다

publ은 판매 설정에서 이용기간을 실제 수강기간과 맞추도록 한다.
LiveKlass는 판매조건마다 수강기간을 정할 수 있고 관리자가 개별 수강생의 수강기간을 연장하거나 날짜로 수정할 수 있다.

### NJS에 필요한 향후 필드

entitlement:
- access_starts_at
- access_expires_at
- duration_policy
- extended_days
- extension_reason

무기한 강의도 `NULL = 무기한`처럼 명시적으로 처리한다.

---

## 7. 관리자 UX 기준

LiveKlass, Teachable, Thinkific, Podia에서 반복되는 패턴:

### 목록
- 전체 강의/상품을 한눈에 본다.
- 핵심 상태만 표시한다.
- 개별 강의를 선택해 상세 편집으로 진입한다.

### 상세
상단 탭으로 역할을 분리한다.
- 기본 정보
- 콘텐츠/커리큘럼
- 판매/Pricing
- 수강생
- 통계/리포트
- 고급 설정

NJS 현재:
- 기본 정보
- 콘텐츠
- 판매 설정
- 고급 설정

추가 우선순위:
1. 수강생 탭
2. 주문/수강권 탭 또는 수강생 탭에 통합
3. 통계 탭
4. 미리보기(Student preview)

### 콘텐츠 편집
- Chapter/Section + Lesson 구조
- 드래그 앤 드롭 순서 변경
- 긴 강의는 compact/collapse 기본
- 각 차시 공개/미리보기 상태 표시
- 영상/자료/텍스트 등의 콘텐츠 타입 표시

---

## 8. 수강생 UX 기준

페이지 역할을 명확히 분리한다.

### 강의 찾기
- 공개 카탈로그
- 내가 구매하지 않은 유료 강의도 표시
- 구매 완료 강의도 필요하면 수강 중 표시
- 판매 중단 상품은 상세 노출 가능하되 구매 버튼 비활성화 가능

### 내 강의
- 현재 유효한 수강권만 표시
- 취소/환불/revoked 강의는 제거
- 만료 강의의 표시 정책은 별도 결정

### 학습 홈
- 최근 학습
- 이어서 학습
- 완료 강의
- 추천/새 강의는 보조 영역

### 강의 상세
LiveKlass 기준으로 유용한 섹션:
- 소개
- 커리큘럼
- 강사
- 리뷰
- 질문/답변
- 추천 강의

NJS는 초기에는 소개 + 커리큘럼 + 구매/수강 CTA를 우선 구현한다.

---

## 9. Publish / Pre-order / Coming soon

Thinkific은 Draft / Pre-order / Published를 구분한다.
Pre-order는 구매는 가능하지만 콘텐츠 접근은 막는다.

NJS에서도 장기적으로 다음 상태가 유용하다.
- 준비 중: 카탈로그 노출, 구매 불가
- 사전 판매: 카탈로그 노출, 구매 가능, 콘텐츠 접근은 지정일 이후
- 판매/수강 중: 구매 및 접근 가능
- 판매 중단: 신규 구매 불가, 기존 수강권 유지
- 종료/보관: 정책에 따라 노출/접근 결정

현재 실강의 두 개는 `준비 중`에 해당한다.

---

## 10. 환불 정책 개발 원칙

> 환불·수강기간 정책의 국내 법령, 플랫폼 관행, 소비자 피해·여론 조사는 `docs/course-refund-policy-research.md`에서 별도로 관리한다. 최종 정책 확정 전에는 자동 부분환불 로직을 구현하지 않는다.


LiveKlass는 운영자가 직접 환불정책을 고지하도록 안내하고,
전액 취소와 부분 취소를 구분한다.
부분 취소에서 수강권 유지 여부도 선택 가능하다.

Kajabi도 full/partial refund를 별도로 지원한다.

따라서 NJS 환불정책은 개발 코드보다 먼저 다음을 결정해야 한다.
- 청약철회 기간
- 재생/자료 다운로드를 수강 개시로 볼지
- 진도율 기준
- 수강기간 기준
- 부분환불 방식
- 부분환불 후 접근 유지 여부
- 쿠폰/할인/패키지 계산
- 환불 완료 전/후 접근차단 시점
- 무통장 환불 절차
- 결제일로부터 장기간 경과한 주문 처리

정책은 국내 관련 법령 및 콘텐츠이용자보호지침을 별도 검토해 확정한다.

---

## 11. 현재 NJS 개발 우선순위

### P0 — 이미 검증된 핵심
- Cafe24 주문 → 수강권 active
- 취소 → 접근 차단
- 직접 URL 접근 차단
- 공개 카탈로그와 내 강의 분리
- catalog visibility 분리

### P1 — 다음 개발
1. 수강생 관리 탭
   - 회원
   - 주문번호
   - entitlement
   - 수강기간
   - 진도율
   - 상태
2. 강의 상세/판매 페이지 정리
3. 관리자 콘텐츠 편집 UX 개선
   - compact list
   - drag & drop
   - section/lesson 구조
4. Student Preview
5. 판매 상태 모델 정리

### P2 — 정책 확정 후
- 환불/부분환불 정책
- 수강기간 만료
- 연장
- 쿠폰
- 패키지
- Offer 모델
- 통계/리포트
- 메시지/알림

---

## 핵심 판단

NJS는 LiveKlass 하나를 복제하는 방식보다,
- LiveKlass의 판매/공개/수강생 관리
- publ의 콘텐츠와 이용권 분리
- Teachable의 publish/visibility 분리
- Thinkific의 pre-order와 course builder
- Podia의 status/visibility/access 분리
를 조합하는 편이 현재 Cafe24 + Vimeo + D1 구조에 더 적합하다.


---

# 기능 영역별 Best Practice 확장 조사

Updated: 2026-09-23

플랫폼을 통째로 따라 하지 않고, 각 서비스가 강한 영역만 추출한다.

## A. 강의 제작 / 콘텐츠 구조

### 참고 플랫폼
- Thinkific: Course Builder, Chapter/Lesson, compact view
- LearnWorlds: Video, Assessment, Form, SCORM, Certificate 등 다양한 learning activity
- Maven: Module 안에 Lesson, Event, Project를 함께 배치
- Skool: 단순한 Classroom 구조와 최소 설정

### NJS 기준
현재는 Section + Lesson + Vimeo 영상으로 충분하다.

추가 우선순위:
1. 드래그 앤 드롭 차시 순서
2. 콘텐츠 타입 표시
3. 무료 미리보기
4. 학습자료 첨부
5. Student Preview

평가·시험·수료증은 현재 강의 사업모델의 핵심이 아니므로 P2 이후로 둔다.

---

## B. 판매 / Offer

### 참고 플랫폼
- publ: 클래스와 유료 이용권 분리
- Kajabi: Product와 Offer 분리
- LearnWorlds: Course / Learning Program과 결제방식 분리
- Mighty Networks: Plan이 Network 또는 Space 묶음에 접근권 부여
- Circle: Paywall이 Community/Space access group과 가격을 연결

### Best Practice
콘텐츠와 거래조건을 같은 객체에 고정하지 않는다.

향후 목표:

```
course
  └─ offer
      ├─ external_product_id
      ├─ price
      ├─ access_duration
      ├─ sale_window
      ├─ discount_policy
      ├─ included_courses
      └─ status
```

현재 Cafe24 product 1:1 연결은 MVP로 유지한다.
Offer 모델은 할인/패키지/기간제 판매가 실제로 필요해지는 시점에 도입한다.

---

## C. 수강권 / Access

### 참고 플랫폼
- Podia: Status / Visibility / Access 분리
- Circle: Paywall → access group → space 접근
- Mighty Networks: Plan → Network/Space 접근
- Skool: Open / Level unlock / Buy now / Time unlock / Private
- Kajabi: Offer 구매 또는 grant → Product access

### NJS 기준
수강권은 구매상품 그 자체가 아니라 회원별 entitlement다.

현재:
- active
- revoked

향후 필요 시:
- expired
- scheduled
- pending
- paused

판매 상태와 기존 수강권 상태는 절대 자동으로 묶지 않는다.

---

## D. 취소 / 환불 / 결제 운영

### 참고 플랫폼
- LiveKlass: 전액/부분 취소와 수강권 유지 여부 분리
- LearnWorlds: Payments 화면에서 purchases, subscriptions, refunds, overdue invoices 통합 관리
- Kajabi: full/partial refund, payment plan/subscription 취소, 접근권 종료시점 선택
- Cafe24: 주문/입금/취소/환불은 commerce source of truth

### NJS 기준
Cafe24 주문 상태가 거래 사실의 원천이고,
D1 entitlement는 학습 접근권의 원천이다.

환불정책 확정 전:
- 전액 취소/전액 환불 → revoked
- 부분환불 자동화는 구현하지 않는다.
- 운영자가 수강권을 유지해야 하는 예외 가능성을 남긴다.

향후 관리자 수강생 화면에서 주문과 entitlement를 같이 보여준다.

---

## E. 수강생 관리

### 참고 플랫폼
- LearnWorlds: Payments/Plans 중심의 구매·구독·환불 통합 조회
- Skool: 구매한 course 기준으로 member filtering
- Kajabi: Contact → Purchases → Offer/Product access
- LiveKlass: 수강생별 수강권, 기간, 주문 연계 관리

### NJS 다음 구현 우선순위
강의 관리자에 `수강생` 탭을 추가한다.

필수 열:
- 회원 ID
- 강의
- Cafe24 주문번호
- 주문일
- entitlement 상태
- 수강 시작일
- 만료일
- 진도율
- 마지막 학습
- 취소/환불 상태

검색:
- 회원 ID
- 주문번호
- 상태

관리 기능:
- 수강기간 연장
- 수강권 수동 부여/회수(운영자 로그 필수)

---

## F. 학습 UX

### 참고 플랫폼
- Uscreen: Catalog / My Library / Continue Watching / Coming Soon
- Maven: Student Home에 content, events, community를 한곳에 통합
- LiveKlass: 구매/수강 흐름을 사이트 안에서 단순화

### NJS 역할 정의

`강의 찾기`
- catalog_visible 강의
- 비구매 유료 강의 포함
- 판매 전 강의는 판매 준비 중 표시
- 필요하면 향후 Coming Soon 지원

`내 강의`
- 현재 유효 entitlement/enrollment가 있는 강의만

`학습 홈`
- 이어서 학습
- 내 강의
- 완료 강의
- 새로운 강의

향후:
- Continue Watching
- 마지막 재생 위치 저장
- Coming Soon
- 추천 영역

---

## G. 커뮤니티 / 참여

### 참고 플랫폼
- Maven: cohort community, project submission, peer feedback
- Circle: paid spaces와 community access
- Mighty Networks: Space 단위 course/event/community 결합
- Kajabi: Community Product를 Offer에 연결

### NJS 기준
현재 커뮤니티는 별도 서비스로 유지한다.

지금 당장 강의와 커뮤니티를 강하게 결합하지 않는다.
대신 향후 다음 연결점을 고려한다.
- 강의별 커뮤니티/게시판 링크
- 구매 강의에 특정 커뮤니티 권한 부여
- 완독/저자 프로그램의 cohort 공간
- 프로젝트/과제 피드백

이는 일반 VOD 강의보다 저자 프로그램·완독 프로그램에서 먼저 필요해질 가능성이 높다.

---

## H. 마케팅 / 자동화

### 참고 플랫폼
- Kajabi: Offer, 이메일, automation, upsell/downsell
- Circle: paywall, coupon, trial, affiliate
- LearnWorlds: coupon, discount, bundle, subscription
- Maven: 등록 후 자동 안내, portal open date, 일정 기반 알림

### NJS 기준
현재 우선순위는 낮다.

Cafe24가 결제/쿠폰/주문을 담당하므로 초기에는 중복 개발하지 않는다.

강의 시스템에서 향후 필요한 자동화:
- 구매 완료 → 수강 안내
- 수강 시작 안 함 → 리마인드
- 장기 미수강 → 리마인드
- 수강 완료 → 다음 강의/커뮤니티 안내
- 만료 예정 → 알림

---

# 플랫폼별 역할 요약

| 플랫폼 | NJS가 참고할 핵심 |
|---|---|
| publ | 콘텐츠와 이용권 분리, 거래조건 보존 |
| LiveKlass | 판매·공개·수강권 분리, 국내 운영 흐름 |
| Teachable | publish와 product visibility 분리 |
| Thinkific | course builder, pre-order, 콘텐츠 관리 |
| Podia | status / visibility / access 분리 |
| LearnWorlds | 결제·구독·환불·수강생·LMS 기능 |
| Kajabi | Product / Offer, 환불·구독·자동화 |
| Uscreen | Catalog / My Library / Continue Watching |
| Maven | cohort, 일정, 프로젝트, 커뮤니티 |
| Circle | paywall과 access group |
| Mighty Networks | Plan과 Space 접근권 |
| Skool | 최소한의 course/community/payment UX |

---

# 전자책 범위 결정

전자책은 현재 구현 범위에서 제외한다.

이유:
1. 지금 검증 중인 핵심은 강의의 결제 → 수강권 → 학습 → 취소/환불 흐름이다.
2. 전자책은 다운로드/열람권, 파일 보안, 버전 교체, 재다운로드, 워터마크 등 강의와 다른 요구사항이 생긴다.
3. 지금 같이 구현하면 entitlement 모델과 관리자 UX가 불필요하게 복잡해진다.

다만 데이터 모델은 향후 디지털 상품 확장이 가능하도록 설계한다.

전자책 단계에서 별도로 검토할 것:
- 다운로드형 vs 웹뷰어형
- 구매 후 다운로드 횟수
- 파일 버전 업데이트
- 기존 구매자에게 개정판 제공 여부
- 워터마크/개인화
- 환불 시 다운로드 이력 처리
- Cafe24 상품 ↔ digital entitlement
- 강의 + 전자책 bundle

현재 결론:
**전자책 구현은 보류하되, Offer/Entitlement 설계가 강의에만 종속되지 않도록 확장 여지만 유지한다.**
