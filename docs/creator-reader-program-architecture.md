# Creator–Reader Program & Community Architecture Benchmark

Updated: 2026-09-24

## Purpose
NEVER JUST SELL의 커뮤니티를 단순 게시판이 아니라 저자·강사와 독자·수강생이 일정 기간 함께 읽고 배우고 실행하는 프로그램 운영 인프라로 설계한다.

## Benchmark findings

### Fable
- 책과 club을 분리하고 club을 지속 커뮤니티로 유지한다.
- chapter discussion room, milestone, poll, prompt, highlight로 읽기 진행과 대화를 연결한다.
- moderator가 discussion 구조를 제어한다.
- 배울 점: 진행률과 대화 맥락을 연결하고 moderator가 room/milestone/poll을 제어한다.
- 주의: 사용자 리뷰에서는 기능 과다와 복잡성, 중복 도서, 앱 지연에 대한 불만도 보인다. 독서 기록 앱 전체를 복제하지 않는다.

### The StoryGraph
- buddy read에서 읽기 진행률에 따라 spoiler 댓글을 단계적으로 공개한다.
- progress tracking, challenge, reading journal이 강하다.
- 배울 점: participant progress를 1급 데이터로 두고 content progress와 mission progress를 분리한다.

### Bookclubs
- meeting, RSVP, attendance, polls, notifications, member approval, multiple admins를 중심으로 하는 organizer OS에 가깝다.
- 관리자별 권한과 유료 club subscription을 지원한다.
- 배울 점: program마다 co-host/운영 staff를 둘 수 있어야 하고 RSVP와 실제 attendance를 분리한다.

### Trevari
- 읽기 → 독후감 제출 → 발제문 → 대화라는 반복 ritual이 강하다.
- 독후감 제출을 모임 참여 조건으로 사용할 수 있다.
- 파트너와 클럽장을 분리하고 운영 매뉴얼/온보딩으로 품질을 유지한다.
- 배울 점: 자유게시판보다 반복 ritual이 중요하며 mission을 다음 event 참여 조건과 연결할 수 있어야 한다.

### Munto
- 단발성 socialing, 지속 club, feed/community를 분리한다.
- host 모델을 대규모로 확장하고 별도 운영 가이드와 제재 체계를 둔다.
- 배울 점: program template과 program run을 분리하고 host quality를 시스템적으로 관리한다.

### Maven
- course와 cohort를 분리한다.
- 다음 cohort 생성 시 syllabus/event를 복제하고 날짜를 새 시작일 기준으로 조정한다.
- community는 cohort-specific이고 project 제출물은 cohort에 공유되어 peer feedback을 받는다.
- 배울 점: program/program_run 분리는 필수, relative due date 기반 mission/event 복제가 필요하다.

### Circle
- admin/moderator role과 space access group을 분리한다.
- 구매자/참가자 여부는 role이 아니라 access 상태다.
- 배울 점: role과 entitlement/access를 혼합하지 않는다. creator moderator는 자기 program space에만 scoped permission을 갖는다.

### Mighty Networks
- space 하나에 course, feed, chat, event, livestream, member를 결합한다.
- challenge, habit tracker, recognition을 프로그램 포맷으로 사용한다.
- 배울 점: Program Run 안에 기능을 하나의 experience로 묶고 기능별 메뉴 과다를 피한다.

### Patreon / Substack
- creator/member 관계가 중심이며 free/paid/tier별 community/chat/live access를 분리한다.
- trusted moderator를 별도 지정한다.
- 배울 점: creator는 플랫폼 운영자가 아니라 자기 audience/program 범위의 host/moderator다.

### Refund challenge models
- 예치금/환급은 행동 지속에 강한 동기를 줄 수 있다.
- 다만 reward 프로그램이 서비스 본질이 되면 안 된다.
- Lifehacking School은 높은 환급/참여 데이터를 공개했지만 2026-03-25 서비스 종료를 공지했다.
- FastCampus 후기에서는 환급이 완주를 돕지만 과제 단위가 실제 콘텐츠 분량과 맞지 않을 때 불만이 생긴다.
- 결론: reward는 completion incentive로 두고, 일반 refund와 분리하며, workload에 맞춘 mission이 우선이다.

## Canonical domain model

### Identity & roles
- member: 모든 사람의 단일 identity
- platform_role: system_owner / operations_staff / creator
- scoped_role: program_host / program_moderator / space_moderator / reviewer
- 한 member가 여러 role을 동시에 가질 수 있다.
- 구매/참여/완독 여부는 role이 아니다.

### Content
- content_item: book / course / video / article / ebook / resource
- content_creator: content와 creator 관계

### Program
- program: 반복 가능한 template
- 예: 4주 저자 참여 완독, 30일 실행 챌린지, 6주 cohort course
- program_content: program과 book/course/article 관계

### Program run
- program_run: 실제 운영되는 한 회차
- start_at/end_at, enrollment window, capacity, price, status, cloned_from_run_id
- 날짜·참가자·event·submission·reward는 run에 귀속한다.

### Participation
- program_participant: applied / enrolled / active / completed / dropped / removed
- participant_progress: content progress와 mission progress aggregate

### Mission / milestone
- mission_template: read / watch / write / submit / attend / reflect / apply
- relative_day / relative_week, required, completion rule
- run_mission: run 생성 시 template 복제, actual due_at 저장
- mission_submission: text/link/image/file/progress evidence, review_state, reviewed_by

### Space / community
- space: public_knowledge / program_discussion / program_qna / program_announcements / cohort_chat / alumni / creator_room
- space_access_rule: public / member / program_participant / program_completed / content_purchaser / explicit
- space_member: 실제 access snapshot/override
- role과 access는 분리한다.

### Posts & knowledge
기존 posts/comments를 유지하면서 다음 metadata를 추가한다.
- space_id
- program_run_id nullable
- content_item_id nullable
- post_type: discussion / question / answer / reflection / case / announcement
- visibility
- knowledge_state: private / candidate / published

knowledge_promotion:
- 프로그램 안의 좋은 질문·답변·사례를 공개 knowledge page로 승격한 기록
- source_post_id / approved_by_creator / anonymized / canonical_post_id

### Event
- program_event: live Q&A / author talk / workshop / office hour / offline meetup
- event_rsvp: yes / maybe / no
- event_attendance: 실제 참석 기록을 RSVP와 분리

### Completion / reward
- completion_policy: required mission ratio / attendance / content progress / manual approval
- participant_completion: evaluation snapshot
- reward_policy: none / fixed_cashback / fixed_credit / coupon / badge / access_unlock
- reward_claim: eligible / requested / approved / paid / rejected
- 일반 환불(refund)과 완독 보상(reward)을 같은 객체로 취급하지 않는다.

## Program Run lifecycle
Draft → Enrollment → Ready → Active → Completion Review → Reward Processing → Alumni / Archived

## Creator scoped moderator
허용:
- 공지·prompt·질문 작성
- 게시물 고정 및 discussion moderation
- participant Q&A
- event 생성/수정
- mission submission 검토
- completion 추천/승인
- knowledge promotion 제안/승인
- 자기 run aggregate progress 확인

금지:
- Cafe24/PG/API secret 접근
- 다른 creator program 접근
- 전체 회원 개인정보 export
- 플랫폼 정책 변경
- 실제 현금 환급/리워드 송금
- system role 변경

## UX principles
1. Program Home 하나에서 오늘 할 일, 진행률, 공지, 다음 이벤트, 토론을 보여준다.
2. 기능별 메뉴를 과도하게 늘리지 않는다.
3. 자유 피드보다 진행 단계와 연결된 prompt를 우선한다.
4. creator 개입은 상시 댓글 노동보다 scheduled ritual로 설계한다.
5. notification은 event/mission deadline 기반으로 자동화한다.
6. 좋은 Q&A/사례는 프로그램 종료 뒤 공개 지식 자산으로 남길 수 있게 한다.
7. 참가자는 role이 아니라 entitlement/access 상태로 관리한다.
8. reward는 별도 정책 객체로 만들고 일반 refund와 분리한다.
9. completion 조건은 실제 workload에 맞춰 유연하게 구성한다.
10. 새 run은 이전 run의 mission/event를 복제하되 날짜는 상대값으로 재계산한다.

## MVP
첫 파일럿: 그냥 팔지 말라 스마트스토어 – 4주 저자 참여 완독 프로그램

포함:
- program / program_run
- participant
- weekly mission
- progress
- announcement
- discussion/Q&A
- creator host/moderator
- live event + RSVP
- completion evaluation
- fixed completion reward eligibility
- alumni/read-only transition
- knowledge promotion candidate

제외:
- complex points economy
- leaderboard
- peer-to-peer cash pool
- automatic bank refund
- nested membership tiers
- arbitrary custom workflows
- complex device restrictions

## Architecture decision
현재 course DB와 community DB가 분리되어 있으므로 cross-DB join을 전제로 설계하지 않는다.

권장:
- identity/role/content/program/program_run/participant/mission/event/reward의 canonical state는 neverjustsell-courses D1에 둔다.
- community DB에는 space/post/comment/reaction/report와 community-local membership projection을 둔다.
- program_run_id, member_id, space_id를 stable shared IDs로 사용한다.
- program access 변경 시 community에 projection/sync한다.
- 결제/구매/완독 상태를 community DB가 자체 판단하지 않는다.

## Next implementation order
1. role model 호환 계층 정리
2. program core migrations
3. program_run + participant + mission schema
4. scoped roles schema
5. community space projection schema
6. 첫 파일럿 seed
7. program host/admin UI
8. 결제 E2E 재개
9. 구매 → program enrollment → space access까지 E2E 확장
