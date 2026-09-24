import { readFile } from "node:fs/promises";
import { USER_ROLES, PLATFORM_ROLES, SCOPED_ROLES } from "../worker/src/roles.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(USER_ROLES.LEARNER === "learner", "learner role contract changed");
assert(USER_ROLES.CREATOR === "creator", "creator role contract changed");
assert(USER_ROLES.PLATFORM_ADMIN === "platform_admin", "platform admin role contract changed");
assert(PLATFORM_ROLES.PLATFORM_OWNER === "platform_owner", "platform owner role contract missing");
assert(PLATFORM_ROLES.STAFF_OPERATOR === "staff_operator", "staff operator role contract missing");
assert(PLATFORM_ROLES.CREATOR === "creator", "platform creator role contract missing");
assert(SCOPED_ROLES.PROGRAM_HOST === "program_host", "program host role contract missing");
assert(SCOPED_ROLES.PROGRAM_MODERATOR === "program_moderator", "program moderator role contract missing");
assert(SCOPED_ROLES.SPACE_MODERATOR === "space_moderator", "space moderator role contract missing");

const migration = await readFile(
  new URL("../worker/migrations/0007_user_roles_course_ownership.sql", import.meta.url),
  "utf8"
);
assert(migration.includes("CREATE TABLE IF NOT EXISTS user_roles"), "user_roles migration missing");
assert(migration.includes("ALTER TABLE courses ADD COLUMN owner_member_id TEXT"), "course owner migration missing");
assert(migration.includes("('ccsmall', 'learner', 'active'"), "ccsmall learner seed missing");
assert(migration.includes("('maxjagga', 'creator', 'active'"), "maxjagga creator seed missing");
assert(
  migration.includes("WHERE slug='online-commerce-basics'"),
  "existing free course owner backfill missing"
);

const admin = await readFile(
  new URL("../worker/src/course-admin.js", import.meta.url),
  "utf8"
);
assert(admin.includes("assertActiveCreator"), "course owner must be creator-validated");
assert(admin.includes("콘텐츠 공급자"), "admin owner selector missing");

const programFoundation = await readFile(
  new URL("../worker/migrations/0027_program_community_foundation.sql", import.meta.url),
  "utf8"
);
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS content_items"), "content item foundation missing");
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS programs"), "program foundation missing");
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS program_runs"), "program run foundation missing");
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS program_enrollments"), "program enrollment foundation missing");
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS platform_role_grants"), "platform role grants missing");
assert(programFoundation.includes("CREATE TABLE IF NOT EXISTS scoped_role_grants"), "scoped role grants missing");
assert(programFoundation.includes("'program_host'"), "program host scoped role missing");
assert(programFoundation.includes("'staff_operator'"), "staff operator role missing");
assert(programFoundation.includes("'program-never-just-sell-readalong'"), "first author-led readalong pilot seed missing");


console.log("PASS: user roles and course ownership scaffold");
