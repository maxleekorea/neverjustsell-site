# NEVER JUST SELL Community

SEO/AEO/GEO를 고려한 공개 커뮤니티용 Cloudflare Pages + Functions + D1 앱입니다.

## 목표

- 공개 게시글을 서버에서 완성된 HTML로 렌더링
- 게시글별 canonical, meta description, Open Graph
- `DiscussionForumPosting`, `ProfilePage`, `BreadcrumbList` JSON-LD
- 카테고리·게시글·작성자 내부 링크
- `sitemap.xml`, `feed.xml`, `robots.txt`, `llms.txt`
- 자유게시판 및 지나치게 짧은 글은 기본적으로 검색 색인 제외
- Cafe24 회원 OAuth는 기존 강의 Worker를 인증 브리지로 재사용
- 글/댓글/좋아요/프로필은 D1에 저장

## 권장 운영 도메인

`https://community.neverjustsell.com`

메인 `neverjustsell.com`의 네임서버를 Cloudflare로 이전할 필요는 없습니다. Cloudflare Pages는 외부 DNS에서 서브도메인 CNAME으로 연결할 수 있습니다.

## Cloudflare Pages 프로젝트

- Repository: `maxleekorea/neverjustsell-site`
- Root directory: `community`
- Build command: 없음
- Build output directory: `public`
- Functions directory: `functions`

## D1

데이터베이스 이름 권장값:

`neverjustsell-community`

Pages 프로젝트에 D1 binding을 추가합니다.

- Variable name: `DB`
- Database: `neverjustsell-community`

스키마:

`migrations/0001_init.sql`

## 환경 변수

선택값이며 기본값이 코드에 들어 있습니다.

- `SITE_ORIGIN=https://community.neverjustsell.com`
- `AUTH_BRIDGE_ORIGIN=https://neverjustsell-course-access.max-lee-korea.workers.dev`

## 인증 구조

1. Community `/login`
2. 기존 Worker `/oauth/cafe24/customer/start?return_to=...`
3. Cafe24 회원 OAuth
4. Worker가 2분짜리 1회용 ticket 생성
5. Community `/auth/callback?ticket=...`
6. Pages Function이 Worker `/community-auth/redeem`에서 ticket을 1회 교환
7. Community D1 session 생성

Cafe24 Client Secret이나 Customer access token은 브라우저로 전달하지 않습니다.

## 검색 정책

색인 대상:

- 온라인 판매 질문
- 판매 경험·사례
- 읽고 실행한 기록
- 브랜드·마케팅 토론
- 본문 120자 이상 공개 글

기본 noindex:

- 자유게시판 글
- 본문 120자 미만 글
- 로그인/글쓰기/프로필 설정/인증 경로
- 숨김·삭제 글

## 다음 단계

D1과 Pages 프로젝트를 실제로 생성하고 `community.neverjustsell.com`을 연결한 뒤, 마이그레이션 적용 → 로그인 → 글쓰기 → 댓글 → sitemap/structured data 순으로 일괄 테스트합니다.
