
export async function getEnrollment(env, memberId, courseId) {
  if (!env.COURSE_DB || !memberId || !courseId) return null;
  return env.COURSE_DB.prepare(
    "SELECT member_id,course_id,enrollment_type,status,enrolled_at,updated_at FROM course_enrollments WHERE member_id=? AND course_id=? LIMIT 1"
  ).bind(memberId, courseId).first();
}

export async function isCourseEnrolled(env, memberId, courseId) {
  const row = await getEnrollment(env, memberId, courseId);
  return Boolean(row && row.status === "enrolled");
}

export async function enrollFreeCourse(env, memberId, course) {
  if (!env.COURSE_DB || !memberId || !course?.id) throw new Error("enrollment_target_missing");
  if (course.access_type !== "public") throw new Error("free_enrollment_only");
  await env.COURSE_DB.prepare(
    "INSERT INTO course_enrollments (member_id,course_id,enrollment_type,status) VALUES (?,?, 'free','enrolled') ON CONFLICT(member_id,course_id) DO UPDATE SET enrollment_type='free',status='enrolled',updated_at=CURRENT_TIMESTAMP"
  ).bind(memberId, course.id).run();
}

export async function getEnrolledCourseIds(env, memberId) {
  if (!env.COURSE_DB || !memberId) return new Set();
  const result = await env.COURSE_DB.prepare(
    "SELECT course_id FROM course_enrollments WHERE member_id=? AND status='enrolled'"
  ).bind(memberId).all();
  return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => row.course_id));
}

export async function listCatalogD1Courses(env) {
  if (!env.COURSE_DB) return [];
  const result = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_url,sales_enabled,sales_state,presale_opens_at,access_duration_days,refund_policy_version,visible,catalog_visible,sort_order,status,price_krw,login_required,owner_member_id,instructor_name,instructor_bio,target_audience,learning_outcomes,access_info,refund_policy_text FROM courses WHERE catalog_visible=1 AND status!='system_check' ORDER BY sort_order,created_at"
  ).all();
  return Array.isArray(result?.results) ? result.results : [];
}

export async function getCatalogD1Course(env, slug) {
  if (!env.COURSE_DB || !slug) return null;
  const course = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_url,sales_enabled,sales_state,presale_opens_at,access_duration_days,refund_policy_version,visible,catalog_visible,sort_order,status,price_krw,login_required,owner_member_id,instructor_name,instructor_bio,target_audience,learning_outcomes,access_info,refund_policy_text FROM courses WHERE slug=? AND catalog_visible=1 AND status!='system_check' LIMIT 1"
  ).bind(slug).first();
  if (!course) return null;

  const [moduleRows, lessonRows] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT id,course_id,title,description,sort_order,status FROM course_modules WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(course.id).all(),
    env.COURSE_DB.prepare(
      "SELECT id,course_id,module_id,title,description,vimeo_id,duration_seconds,sort_order,status,is_preview FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(course.id).all()
  ]);

  const modules = Array.isArray(moduleRows?.results) ? moduleRows.results : [];
  const lessons = Array.isArray(lessonRows?.results) ? lessonRows.results : [];
  return { ...course, modules, lessons };
}

export async function listPublishedD1Courses(env) {
  if (!env.COURSE_DB) return [];
  const result = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_url,sales_enabled,sales_state,presale_opens_at,access_duration_days,refund_policy_version,visible,catalog_visible,sort_order,status,price_krw,login_required,owner_member_id,instructor_name,instructor_bio,target_audience,learning_outcomes,access_info,refund_policy_text FROM courses WHERE visible=1 AND status='published' ORDER BY sort_order,created_at"
  ).all();
  return Array.isArray(result?.results) ? result.results : [];
}

export async function getPublishedD1Course(env, slug) {
  if (!env.COURSE_DB || !slug) return null;
  const course = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_url,sales_enabled,sales_state,presale_opens_at,access_duration_days,refund_policy_version,visible,catalog_visible,sort_order,status,price_krw,login_required,owner_member_id,instructor_name,instructor_bio,target_audience,learning_outcomes,access_info,refund_policy_text FROM courses WHERE slug=? AND visible=1 AND status='published' LIMIT 1"
  ).bind(slug).first();
  if (!course) return null;

  const [moduleRows, lessonRows] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT id,course_id,title,description,sort_order,status FROM course_modules WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(course.id).all(),
    env.COURSE_DB.prepare(
      "SELECT id,course_id,module_id,title,description,vimeo_id,duration_seconds,sort_order,status,is_preview FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(course.id).all()
  ]);

  const modules = Array.isArray(moduleRows?.results) ? moduleRows.results : [];
  const lessons = Array.isArray(lessonRows?.results) ? lessonRows.results : [];
  return { ...course, modules, lessons };
}

export async function touchLessonProgress(env, memberId, courseId, lessonId) {
  if (!env.COURSE_DB || !memberId || !courseId || !lessonId) return;
  await env.COURSE_DB.prepare(
    "INSERT INTO lesson_progress (member_id,course_id,lesson_id,completed,last_position_seconds) VALUES (?,?,?,0,0) ON CONFLICT(member_id,lesson_id) DO UPDATE SET updated_at=CURRENT_TIMESTAMP"
  ).bind(memberId, courseId, lessonId).run();
}

export async function recordLessonWatch(env, memberId, courseId, lessonId, positionSeconds, watchedDeltaSeconds) {
  if (!env.COURSE_DB || !memberId || !courseId || !lessonId) return;
  const position = Math.max(0, Math.floor(Number(positionSeconds) || 0));
  const delta = Math.max(0, Math.min(30, Math.floor(Number(watchedDeltaSeconds) || 0)));
  await env.COURSE_DB.prepare(
    "INSERT INTO lesson_progress (member_id,course_id,lesson_id,completed,last_position_seconds,watched_seconds) VALUES (?,?,?,0,?,?) " +
    "ON CONFLICT(member_id,lesson_id) DO UPDATE SET last_position_seconds=excluded.last_position_seconds,watched_seconds=lesson_progress.watched_seconds+excluded.watched_seconds,updated_at=CURRENT_TIMESTAMP"
  ).bind(memberId, courseId, lessonId, position, delta).run();
}

export async function completeLesson(env, memberId, courseId, lessonId) {
  if (!env.COURSE_DB || !memberId || !courseId || !lessonId) return;
  await env.COURSE_DB.prepare(
    "INSERT INTO lesson_progress (member_id,course_id,lesson_id,completed,last_position_seconds,completed_at) VALUES (?,?,?,1,0,CURRENT_TIMESTAMP) ON CONFLICT(member_id,lesson_id) DO UPDATE SET completed=1,completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP"
  ).bind(memberId, courseId, lessonId).run();
}

export async function getCourseProgress(env, memberId, course) {
  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const total = lessons.length;
  if (!env.COURSE_DB || !memberId || !course?.id || total === 0) {
    return { total, completed: 0, percent: 0, completedIds: new Set(), continueLessonId: lessons[0]?.id || null, lastActivity: null, watchedSeconds: 0 };
  }

  const result = await env.COURSE_DB.prepare(
    "SELECT lesson_id,completed,last_position_seconds,watched_seconds,updated_at FROM lesson_progress WHERE member_id=? AND course_id=? ORDER BY updated_at DESC"
  ).bind(memberId, course.id).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  const completedIds = new Set(rows.filter((row) => Number(row.completed) === 1).map((row) => row.lesson_id));
  const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length;

  const latestIncomplete = rows.find((row) =>
    Number(row.completed) !== 1 && lessons.some((lesson) => lesson.id === row.lesson_id)
  );
  const firstIncomplete = lessons.find((lesson) => !completedIds.has(lesson.id));
  const continueLessonId = latestIncomplete?.lesson_id || firstIncomplete?.id || lessons[0]?.id || null;

  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    completedIds,
    continueLessonId,
    lastActivity: rows[0]?.updated_at || null,
    watchedSeconds: rows.reduce((sum, row) => sum + Number(row.watched_seconds || 0), 0)
  };
}

export function d1CourseToPlayerCourse(course) {
  const moduleMap = new Map((course.modules || []).map((module) => [module.id, module]));
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary || "",
    accessType: course.access_type === "paid" ? "paid" : "public",
    productNo: course.cafe24_product_no ? Number(course.cafe24_product_no) : null,
    salesUrl: course.sales_url || null,
    loginRequired: Number(course.login_required) !== 0,
    ownerMemberId: course.owner_member_id || null,
    lessons: (course.lessons || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      vimeoId: lesson.vimeo_id || null,
      durationSeconds: lesson.duration_seconds || null,
      status: lesson.status,
      isPreview: Number(lesson.is_preview) === 1,
      moduleId: lesson.module_id || null,
      moduleTitle: lesson.module_id ? (moduleMap.get(lesson.module_id)?.title || null) : null
    }))
  };
}
