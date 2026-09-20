# 온라인 강의 등록 운영 절차

이 문서는 실제 강의를 추가할 때 같은 설정 작업을 반복하지 않기 위한 운영 기준이다.

## 1. 한 번에 전달할 정보

새 강의를 등록할 때는 아래 네 가지를 한 번에 준비한다.

1. Cafe24 상품 수정 URL 또는 `product_no`
2. 강의명
3. 강의 소개 한두 문장
4. 차시명과 Vimeo URL 전체 목록

예시:

```text
Cafe24 product_no: 20
강의명: 스마트스토어 실전 강의
소개: 검색·상품·마케팅을 사업의 관점에서 정리한 강의

1강 | 온라인 유통업의 본질 | https://vimeo.com/123456701
2강 | 검색과 키워드 | https://vimeo.com/123456702
3강 | 롱테일 전략 | https://vimeo.com/123456703
```

이 정보만 있으면 `worker/src/courses.js`에 한 번에 등록한다.

## 2. Cafe24 상품 원칙

- 유료 강의는 Cafe24 상품 하나와 강의 하나를 1:1로 연결한다.
- `product_no`가 강의 수강권의 기준값이다.
- 온라인 강의 상품은 `배송 필요 없음`으로 설정한다.
- 결제 확인이 끝나면 수강권을 부여한다.
- 취소·환불 상태가 되면 수강권을 차단한다.
- 구매확정이나 운송장 등록은 수강권 부여 조건으로 사용하지 않는다.

## 3. Vimeo 원칙

모든 유료 영상은 Vimeo 임베드 허용 도메인에 실제 플레이어가 렌더링되는 다음 도메인을 포함한다.

```text
classroom.neverjustsell.com
```

운영 UI에서 `*.workers.dev` 주소는 사용하지 않는다. 기존 Worker 주소는 호환용 리디렉션만 담당한다. 공개 사이트에 영상을 직접 임베드하는 기능을 추가할 때만 `www.neverjustsell.com`을 Vimeo 허용 도메인에 추가한다.

영상 다운로드는 비활성화한다.

## 4. courses.js 등록 규칙

실제 강의는 다음 형태로 추가한다.

```js
"course-slug": {
  productNo: 20,
  title: "강의명",
  summary: "강의 소개",
  accessType: "paid",
  visible: true,
  sortOrder: 20,
  salesEnabled: true,
  salesUrl: "https://www.neverjustsell.com/product/detail.html?product_no=20",
  lessons: [
    { id: "lesson-1", title: "1강 제목", vimeoId: "123456701" },
    { id: "lesson-2", title: "2강 제목", vimeoId: "123456702" }
  ]
}
```

- `slug`: 영문 소문자·숫자·하이픈만 사용한다.
- `productNo`: Cafe24 상품번호와 정확히 일치시킨다.
- `visible: true`: 구매자의 내 강의실에 표시한다.
- `salesEnabled: true`: 실제 판매 상품일 때 사용한다.
- `lessons`: 차시 순서대로 등록한다.
- Vimeo URL 전체를 저장하지 않고 숫자 영상 ID만 저장한다.

## 5. 무료 강의

무료 강의는 `accessType: "public"`으로 둔다.

무료 강의는 회원 인증이나 구매 검증 없이 볼 수 있다.

유료 전환 버튼은 `ctaUrl`, `ctaLabel`로 관리한다.

## 6. 등록 후 검증

강의 등록 또는 수정 후 아래 주소 하나만 확인한다.

```text
https://classroom.neverjustsell.com/system-check
```

`CHECK 0`이면 기본 인증·구매 검증·직접 접근 차단·보안 설정은 정상으로 본다.

추가로 실제 Vimeo 재생은 등록한 강의의 첫 차시와 마지막 차시만 브라우저에서 확인한다.

## 7. 운영 원칙

- 실제 서비스용 강의 데이터와 테스트 강의를 섞지 않는다.
- 테스트 강의는 실제 판매 링크를 노출하지 않는다.
- 강의 추가 시 Worker 인증 로직을 수정하지 않는다. `courses.js`의 데이터만 추가하는 것을 기본으로 한다.
- 상품번호나 Vimeo ID가 잘못되면 시스템 점검에서 잡히도록 유지한다.
- 수강권 로직 변경은 실제 주문 상태 테스트를 함께 수행한다.


## 8. 현재 운영 상태 — 2026-09-20

인증·구매권한·강의실·Vimeo 재생의 기본 E2E 검증은 완료됐다.

검증된 사용자 흐름:

```text
www.neverjustsell.com
→ 내 강의실
→ 세션이 없으면 Cafe24 로그인/동의
→ 로그인 성공
→ 강의실 세션 생성
→ 중간 인증 화면 없이 내 강의실
→ 구매 강의만 표시
→ 권한이 있는 차시만 Vimeo 재생
```

현재 `product_no=13`의 **유료 강의 테스트**는 권한 검증용 fixture다. 실제 강의를 출시할 때는 새 상품을 실제 강의로 등록하고 전체 차시를 연결한 뒤 판매를 활성화한다. 인증 로직을 다시 설계하지 않는다.

실제 강의 전환 순서는 다음과 같다.

1. Cafe24에 실제 강의 상품 생성
2. 배송이 필요 없는 상품으로 설정
3. 실제 `product_no` 확정
4. Vimeo 전체 차시 업로드 및 `classroom.neverjustsell.com` 임베드 허용
5. `courses.js`에 실제 강의명·소개·차시명·Vimeo ID 등록
6. `salesEnabled: true`와 실제 판매 URL 연결
7. 테스트 구매 → 내 강의실 표시 → 첫 차시/마지막 차시 재생 확인
8. 취소·환불 후 접근 차단 확인
9. 검증 완료 후 테스트 강의 fixture를 운영 화면에서 제거
