# NEVER JUST SELL Program & Community Domain Model

Updated: 2026-09-24
Status: architecture decision before payment E2E expansion

## 결론

기존의 단순 직선 구조:

User
→ Content
→ Program
→ Program Run
→ Participant
→ Mission/Progress
→ Space
→ Post
→ Event
→ Completion/Reward
→ Moderator

를 그대로 데이터베이스에 구현하지 않는다.

벤치마크 결과, 성공적인 서비스는 크게 네 축을 독립시킨다.

1. Identity — 누구인가
2. Role — 무엇을 관리할 수 있는가
3. Access — 무엇을 볼 수 있는가
4. Participation — 어떤 프로그램에서 무엇을 하고 있는가

콘텐츠, 프로그램, 커뮤니티는 이 네 축 위에서 연결한다.

---

# 1. Identity

## Member

모든 사람의 기본 단위다.

한 사람이 동시에 다음 상태를 가질 수 있다.

- 무료 회원
- 책 구매자
- 강의 구매자
- 프로그램 참가자
- Creator
- Creator의 프로그램 Host
- 다른 Creator 프로그램의 일반 참가자
- 운영 직원
- 특정 공간 moderator

따라서 member에 하나의 role을 박아 넣어 UX를 결정하지 않는다.

현재 community DB의:

members.role IN ('member','moderator','admin')

구조는 장기적으로 global role 판단에 사용하지 않는다.
기존 필드는 호환성 때문에 당장 삭제하지 않아도 되지만 신규 권한 설계의 기준으로 삼지 않는다.

현재 course DB의:

learner
creator
reviewer
platform_admin

역시 learner를 신분으로 취급하지 않는다.
‘배우는 사람’은 role이 아니라 enrollment/access 상태다.

---

# 2. Global Role

플랫폼 전체 범위에 영향을 주는 권한만 global role로 둔다.

## platform_owner

- 시스템 연결과 비밀정보
- 운영 정책
- 전체 사용자 권한
- Cafe24/Vimeo/Cloudflare 연결
- 전체 데이터/진단
- staff 권한 부여

초기에는 맥작가만 가진다.

## staff_operator

향후 관리 직원용.

가능:
- 콘텐츠 등록/수정
- 프로그램 운영
- 참가자 관리
- 주문/환불 확인
- 신고 처리
- 공개 지식 승격 검토

불가:
- 시스템 secret
- 플랫폼 소유권 변경
- 다른 staff의 최고 권한 부여
- 핵심 결제/API 설정 임의 변경

## creator

플랫폼이 승인한 저자/강사/전문가.

creator 자체로는 다른 creator의 데이터나 플랫폼 관리 화면에 접근하지 못한다.

---

# 3. Scoped Role

특정 resource 안에서만 유효한 역할이다.

테이블 개념:

role_grants

- member_id
- role
- scope_type
- scope_id
- granted_by
- status
- created_at

초기 role:

## program_host

해당 Program/Run의 대표 저자·강사.

가능:
- 공지
- prompt 작성
- Q&A 답변
- live/event 생성
- mission 검토
- 참가자 활동 확인
- 자기 공간의 게시물 pin/hide
- 보조 moderator 추천/지정
- completion 후보 확인

불가:
- 실제 결제 취소
- 법정 환불 승인
- 임의 현금 지급
- 다른 creator의 프로그램 관리
- platform 설정

## program_moderator

해당 Program Run의 운영 보조.

가능:
- 게시물/댓글 관리
- 신고 처리
- 공지 보조
- 참가자 안내
- event 운영 보조

Creator가 아니어도 될 수 있다.

## space_moderator

특정 Space만 관리.

Circle/Patreon식 scoped moderation을 따른다.

---

# 4. Access

Role과 Access를 분리한다.

예:

creator는 자기 프로그램을 운영할 권한이 있지만,
어떤 유료 강의를 구매하지 않았다면 그 강의의 learner access는 없을 수 있다.

반대로 일반 member가 강의를 구매하면 콘텐츠 access는 생기지만 creator 권한은 생기지 않는다.

접근권한 source:

- free signup
- Cafe24 purchase
- program enrollment
- manual grant
- staff grant
- alumni conversion
- promotional grant

현재 course_entitlements 구조를 확장 가능한 access ledger의 출발점으로 사용한다.

---

# 5. Content

## content_items

Program과 별개로 존재하는 지식 상품/자료.

type examples:

- book
- ebook
- course
- video
- article
- worksheet
- audio
- external_resource

핵심 필드 개념:

- id
- type
- title
- owner_creator_id
- status
- canonical_url
- commerce_product_no nullable

## program_content

Program과 Content의 many-to-many 관계.

한 책으로 여러 Program을 만들 수 있다.
한 Program이 책 + 강의 + worksheet를 함께 사용할 수도 있다.

---

# 6. Program

반복 가능한 ‘경험의 설계도’.

예:

- 4주 저자 참여 완독
- 30일 읽고 실행하기
- 6주 코호트 강의
- 저자 사례 클리닉
- 완독자 후속 북클럽
- 프로젝트 실전반

## program

주요 필드 개념:

- id
- title
- program_type
- creator_id
- description
- default_duration_days
- visibility
- participation_mode
- completion_policy_id
- reward_policy_id
- status

program_type 초기값:

- readalong
- challenge
- cohort
- book_club
- clinic
- project_lab

type별 별도 거대 테이블을 만들지 않는다.
공통 Program 모델 + 필요한 부속 데이터로 확장한다.

---

# 7. Program Run

실제 운영되는 기수/회차.

Program이 상품의 설계도라면 Run은 실제 운영이다.

예:

Program:
『그냥 팔지 말라』 저자와 함께 4주 완독

Run:
2026년 10월 1기
2026년 11월 2기

## program_runs

- id
- program_id
- title
- enrollment_open_at
- enrollment_close_at
- portal_open_at
- starts_at
- ends_at
- capacity
- price
- commerce_product_no
- status
- completion_policy_snapshot
- reward_policy_snapshot

Maven 방식처럼 날짜와 참가자를 Run에 둔다.

Program을 수정해도 이미 시작한 Run의 completion/reward 조건은 바뀌지 않도록 snapshot을 저장한다.

---

# 8. Enrollment / Participant

## program_enrollments

- run_id
- member_id
- status
- source
- source_order_id
- joined_at
- started_at
- completed_at
- completion_ratio
- reward_status

status examples:

- pending
- active
- completed
- withdrawn
- removed

Participant는 user type이 아니다.
Member와 Program Run 사이의 관계다.

---

# 9. Mission / Milestone / Progress

Fable의 milestone,
트레바리의 독후감,
Maven의 project,
챌린저스의 인증을 하나의 공통 구조로 다룬다.

## missions

- id
- run_id
- title
- mission_type
- opens_at
- due_at
- required
- completion_weight
- verification_mode
- content_reference

mission_type:

- reading
- reflection
- proof
- assignment
- discussion
- attendance
- action

## mission_submissions

- mission_id
- member_id
- text
- media
- status
- submitted_at
- reviewed_by
- reviewed_at

status:

- submitted
- accepted
- rejected
- revision_requested

자동 계산 가능한 reading/progress는 별도 progress event를 사용할 수 있다.

---

# 10. Space

커뮤니티의 실제 대화 공간.

Program과 Space는 같은 것이 아니다.

Program Run 하나에 여러 Space가 붙을 수 있다.

기본 template 예:

- announcements
- author_qna
- weekly_discussion
- mission_feed
- lounge
- live_events
- alumni

## spaces

- id
- scope_type
- scope_id
- type
- title
- visibility
- posting_policy
- status

scope_type:

- platform
- creator
- program
- program_run

visibility:

- public
- member
- enrolled
- paid
- invited
- staff

초기 구현에서는 Run 참가 시 필요한 Space access를 자동으로 부여한다.

---

# 11. Post / Question / Answer

기존 community posts/comments를 버리지 않는다.

확장 방향:

## posts

추가 개념:

- space_id nullable
- post_type
- visibility
- knowledge_status
- source_program_run_id nullable

post_type:

- discussion
- question
- reflection
- announcement
- case
- mission_share

Q&A를 별도 완전히 다른 게시판 엔진으로 만들지 않는다.

Question은 post_type=question으로 표현하고,
Creator 답변은 comment/reply + accepted/expert answer metadata로 확장한다.

---

# 12. Event

## events

- id
- scope_type
- scope_id
- event_type
- title
- starts_at
- ends_at
- capacity
- location_type
- location_data
- attendance_rule

event_type:

- author_live
- qna
- workshop
- meetup
- office_hour
- final_session

## event_rsvps

- event_id
- member_id
- status
- attended_at

Bookclubs의 RSVP와 Maven/Circle의 live event 패턴을 반영한다.

---

# 13. Completion

Program completion은 단순 boolean으로만 두지 않는다.

## completion rule

예:

- 필수 mission 4개 중 4개
- 전체 점수 85% 이상
- final event attendance 포함
- reading progress 80% + reflection 3회

## completion_records

- run_id
- member_id
- ratio
- qualified
- calculated_at
- manually_overridden
- override_reason
- reviewed_by

운영자가 예외를 처리할 수 있어야 한다.
Bookclubs의 admin RSVP 수정과 유사한 운영 유연성이다.

---

# 14. Reward

가장 중요한 결정:

## 법정/일반 환불과 완주 리워드를 같은 것으로 저장하지 않는다.

### commerce refund

구매 취소, 청약철회, 중도해지 등.

현재 course refund/access 흐름과 연결.

### completion reward

프로그램의 행동 유도 인센티브.

예:
- 참가비 일부 cashback
- 포인트
- 다음 프로그램 할인
- 커뮤니티 badge
- 무료 후속 세션
- 전용 alumni access

## reward_ledger

- run_id
- member_id
- reward_type
- amount
- status
- qualified_at
- approved_by
- paid_at
- external_reference

초기에는 자동 현금 환급보다 eligible → staff approve → payment 처리 구조가 안전하다.

---

# 15. Knowledge Promotion

NEVER JUST SELL의 차별화 핵심.

Program 내부 대화가 종료와 함께 사라지지 않도록 한다.

흐름:

Program private question
→ Creator answer
→ 좋은 대화 표시
→ 공개 가능성 검토
→ 작성자 동의/익명화
→ Public Knowledge page
→ 검색/AI 노출
→ 관련 Book/Course/Program 연결

## knowledge_exports

- source_post_id
- source_comment_ids
- status
- consent_state
- anonymize_author
- editor_member_id
- public_post_id
- published_at

status:

- candidate
- consent_pending
- editing
- published
- rejected

기존 community의 DiscussionForumPosting JSON-LD와 검색 색인 구조를 그대로 활용할 수 있다.

---

# 16. Moderation / Trust & Safety

Creator moderator와 플랫폼 운영을 분리한다.

Creator/Program Moderator:
- 자기 공간의 pin
- hide
- 댓글 제한
- 신고 1차 처리

Staff/Platform:
- 계정 suspension
- cross-program abuse
- 결제 분쟁
- 신고 escalation
- creator 제재
- platform-wide ban

## moderation_actions

모든 관리자 조치는 감사 로그를 남긴다.

---

# 17. 사용자별 UX

## 일반 Member

Home
→ 관심 콘텐츠
→ 공개 지식
→ Program 찾기
→ 내 참여 프로그램
→ 내 강의/책
→ 내 글/질문/저장

## Program Participant

오늘 할 일
→ 이번 주 읽을 범위
→ Mission
→ 저자의 질문
→ 동료 기록
→ 다음 Event
→ 진행률
→ 리워드 조건

‘전체 메뉴’보다 ‘다음 행동’을 먼저 보여준다.

## Creator

Creator Studio

- 내 콘텐츠
- 내 Program
- 현재 Run
- 참가자
- Mission
- Q&A
- Event
- 공지
- 좋은 질문/답변 지식 승격 후보
- Program 성과

## Staff Operator

Operations

- Program 운영 대기
- 참가자/결제 문제
- Mission 예외
- Reward 승인
- 신고
- 공개 지식 검토
- 고객지원

## Platform Owner

System

- integrations
- secrets/health
- role grants
- global policy
- diagnostics
- audit

---

# 18. 현재 시스템과의 매핑

## Course D1

현재 보유:
- courses
- lessons
- course_entitlements
- course_enrollments
- lesson_progress
- user_roles
- payment/refund 관련 기록

향후 담당:
- content commerce/access
- program definition
- program run
- enrollment
- mission/progress
- reward eligibility
- scoped role grants

현재 DB 이름을 당장 변경하지 않는다.

## Community D1

현재 보유:
- members
- categories
- posts
- comments
- likes
- reports
- sessions

향후 담당:
- spaces
- program-run community posts
- moderation
- public knowledge
- profiles/reputation

Program/Run ID는 Course D1의 canonical ID를 참조한다.
두 D1 사이에 SQL foreign key는 만들지 않는다.

Community는 Service Binding/Auth Bridge를 통해 access decision을 확인한다.

---

# 19. 지금 구현하지 않을 것

- 복잡한 badge/gamification
- point economy
- 실패자 돈 재분배
- creator 자동 정산
- AI moderator 자동 제재
- 복잡한 reputation score
- 수십 종류 role
- 프로그램 타입별 별도 앱
- 회원마다 별도 dashboard 구조

---

# 20. 다음 개발 순서

1. global role / scoped role / access 원칙 코드에 반영
2. Program + Program Run 최소 스키마
3. 첫 파일럿 Program 생성
   - 『그냥 팔지 말라 스마트스토어』 4주 저자 참여 완독
4. Creator를 해당 Program Host로 grant
5. Run enrollment가 community space access로 이어지는 contract 정의
6. 기존 Cafe24 결제 E2E 실행
7. 결제 성공 → Program enrollment/access까지 검증 확장
8. Mission/Completion/Reward 최소 기능
9. 첫 실제 프로그램 운영
10. 실제 행동 데이터를 보고 다음 기능 결정

결제 E2E를 없애거나 뒤로 오래 미루는 것이 아니다.
권한과 Program/Run의 최소 구조를 먼저 고정한 뒤 바로 E2E로 돌아간다.
