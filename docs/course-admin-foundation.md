# Course Admin foundation

## Goal

Replace manual edits to `worker/src/courses.js` with a course administration flow:

1. Create/edit a course in NEVER JUST SELL admin.
2. Create a Vimeo TUS upload session server-side.
3. Upload the video directly from the browser to Vimeo.
4. Store the returned Vimeo video ID in D1.
5. For paid courses, create or link a Cafe24 product and store `product_no`.
6. Publish the course so the classroom reads D1 instead of hand-edited source code.

The browser must never receive `VIMEO_ACCESS_TOKEN` or Cafe24 Admin tokens.

## Initial data model

D1 binding name: `COURSE_DB`.

Tables are defined in `worker/migrations/0001_course_admin.sql`:

- `courses`: course metadata, access type, Cafe24 product mapping and publication state.
- `lessons`: ordered lessons and Vimeo video IDs.
- `video_uploads`: upload lifecycle and diagnostics.

## Single-operator admin authentication

The first version should use a dedicated Worker secret named `COURSE_ADMIN_PASSWORD`.
The admin session will be an HttpOnly/Secure/SameSite=Strict signed cookie. No admin write route should be exposed without that session.

This is intentionally a bootstrap mechanism. Multi-author roles can later replace it without changing the course/video/product data model.

## Migration strategy

Do not remove `courses.js` immediately.

1. Add D1-backed admin and upload flows.
2. Register the first real course through the admin UI.
3. Make classroom reads prefer D1 while retaining the static catalog as a temporary fallback.
4. Verify free/paid access, payment, cancellation and refund behavior.
5. Remove the static production catalog after the D1 path is proven.
6. Keep the system-check fixture isolated and non-selling until its replacement test path is ready.

## Manual Cloudflare prerequisite

Create a dedicated D1 database named `neverjustsell-courses`. After creation, bind it to the `neverjustsell-course-access` Worker as `COURSE_DB`. Do not reuse the community D1 database.

Add `COURSE_ADMIN_PASSWORD` as a secret for the same Worker/build pipeline.

The application code should only be switched to the D1 path after both bindings exist.
