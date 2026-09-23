import { readFile } from "node:fs/promises";
import { USER_ROLES } from "../worker/src/roles.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(USER_ROLES.LEARNER === "learner", "learner role contract changed");
assert(USER_ROLES.CREATOR === "creator", "creator role contract changed");
assert(USER_ROLES.PLATFORM_ADMIN === "platform_admin", "platform admin role contract changed");

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

console.log("PASS: user roles and course ownership scaffold");
