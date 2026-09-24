# 강의 플랫폼 출시 전 벤치마크 기준

Updated: 2026-09-24

이 문서는 NEVER JUST SELL 강의 시스템의 출시 전 점검 기준을 정리한다.
다른 플랫폼의 기능을 그대로 복제하지 않고, 실제 장애·환불 분쟁·운영 누락을 줄이는 항목만 가져온다.

## 참고한 공개 가이드

- Udemy course quality checklist
  - https://support.udemy.com/hc/ko/articles/229604988-Udemy-%EA%B0%95%EC%9D%98-%ED%92%88%EC%A7%88-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8
- Udemy course management dashboard
  - https://support.udemy.com/hc/en-us/articles/230048607-How-to-Navigate-the-Course-Management-Dashboard
- Thinkific free course preview
  - https://support.thinkific.com/hc/en-us/articles/360030722473-Create-a-Free-Course-Preview
- Thinkific student preview
  - https://support.thinkific.com/hc/en-us/articles/360030737873-Previewing-Your-Course-as-a-Student
- Teachable product/course preview
  - https://support.teachable.com/en/articles/11682499-preview-your-school-and-products
- Teachable refund policy guidance
  - https://support.teachable.com/en/articles/16631486-custom-refund-policies
- Thinkific chargeback guidance
  - https://support.thinkific.com/hc/en-us/articles/29021318017815-Thinkific-Payments-Chargebacks
- 패스트캠퍼스 온라인 강의 FAQ / 환불 정책
  - https://fastcampus.co.kr/page_faq_online
  - https://next.fastcampus.co.kr/info/policies/refund
- 탈잉 VOD FAQ
  - https://talingrules.oopy.io/vodfaq
- 콜로소 FAQ
  - https://coloso.co.kr/info/faq

## 벤치마크에서 반복되는 핵심

### 게시 전에 시스템이 확인해야 할 것

- 강의 기본 정보가 비어 있지 않은가
- 판매가가 유효한가
- 커리큘럼이 실제 상품 구조와 맞는가
- 모든 차시에 영상이 연결됐는가
- 영상 처리가 완료됐는가
- 영상 길이 정보가 확보됐는가
- 무료 미리보기가 실제로 재생되는가
- 판매 페이지의 강사·추천 대상·학습 내용이 작성됐는가
- 수강기간과 환불 안내가 구매 전에 보이는가
- 결제 상품이 강의와 정확하게 연결됐는가

NEVER JUST SELL에서는 위 항목을 관리자 기억이 아니라 출시 점검 로직으로 검증한다.

### 구매 전에 확인해야 할 것

- 판매 페이지에서 실제 커리큘럼과 정책을 볼 수 있어야 한다.
- 무료 미리보기로 강의 품질을 판단할 수 있어야 한다.
- 관리자에게는 게시 전에도 실제 영상과 차시 이동을 확인할 수 있는 수강생 화면 미리보기가 있어야 한다.

### 구매 후 기록해야 할 것

- 구매 주문과 강의 수강권 연결
- 구매 당시 가격과 정책 snapshot
- 수강 시작·완료·시청시간
- 취소·환불 후 수강권 회수
- 환불 참고 계산에 필요한 유료 콘텐츠 길이와 실제 시청량

이 기록은 고객 문의 대응뿐 아니라 결제 분쟁이 발생했을 때도 근거가 된다.

## 현재 바로 구현하는 범위

- 5단계 관리자 운영 흐름
- 출시 점검
- Vimeo 상태·길이 자동 동기화
- 기존 Vimeo 영상 재사용
- 관리자 전용 수강생 화면 미리보기
- 첫 본강의 1차시 무료 미리보기
- Cafe24 회원 전용 구매
- 결제 → active 수강권 → 진도 → 취소/환불 → revoked 수강권 E2E
- 결제일 기준 180일 수강기간
- Fair-trust v1.0 환불정책
- 구매 당시 정책 snapshot과 환불 참고 계산

## E2E 통과 직후 정리할 범위

고객 FAQ를 만든다.

최소 항목:
- 어디에서 수강하는가
- 수강기간은 어떻게 계산되는가
- 영상이 재생되지 않을 때 어떻게 하는가
- 무료 미리보기와 유료 수강의 차이
- 환불 신청 경로와 처리 기준
- 강의 내용 문의 경로
- 결제·영수증 문의 경로
- 지원하는 브라우저와 기본 기기 환경

## 실제 필요가 생길 때 추가할 기능

현재 출시를 막지 않는 기능은 선개발하지 않는다.

- 수료증
- 퀴즈와 과제
- 드립 콘텐츠
- 쿠폰·프로모션 엔진
- 강의별 복잡한 환불정책
- 강의별 기기 제한
- 강의자료 DRM
- 자동 환불 승인
- 강사별 별도 정산 시스템
- 복잡한 패키지·구독

## 출시 판정

실제 유료 판매를 열기 전에 다음 흐름이 한 번 끊김 없이 통과해야 한다.

테스트 판매 시작
→ Cafe24 회원 실제 결제
→ 주문 확인
→ D1 수강권 active
→ 강의실 진입
→ 첫 무료 차시 / 유료 차시 권한 구분
→ 유료 차시 재생
→ 진도·시청시간 기록
→ Cafe24 취소 또는 환불
→ D1 수강권 revoked
→ 기존 수강 접근 차단
→ 테스트 판매 종료

이 흐름이 통과하기 전에는 기능 추가보다 결함 수정이 우선이다.
