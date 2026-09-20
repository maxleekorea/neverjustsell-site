export const COURSE_CATALOG = {
  "free-lesson-1": {
    productNo: 12,
    title: "무료 1강",
    summary: "무료 공개 강의",
    accessType: "public",
    visible: false,
    sortOrder: 0,
    ctaUrl: "https://www.neverjustsell.com/#class",
    ctaLabel: "전체 강의 보기",
    lessons: [
      { id: "lesson-1", title: "무료 1강", vimeoId: "1227267267" }
    ]
  },
  "paid-course": {
    productNo: 13,
    title: "유료 강의 테스트",
    summary: "결제 및 수강 권한 테스트용 강의",
    accessType: "paid",
    visible: true,
    sortOrder: 10,
    salesEnabled: false,
    systemCheck: true,
    salesUrl: "https://www.neverjustsell.com/product/detail.html?product_no=13",
    lessons: [
      { id: "lesson-1", title: "테스트 영상 1", vimeoId: "1227604364" },
      { id: "lesson-2", title: "테스트 영상 2", vimeoId: "1227604365" }
    ]
  }
};

export function getPaidCourses() {
  return Object.entries(COURSE_CATALOG)
    .filter(([, course]) => course.accessType === "paid")
    .sort(([, a], [, b]) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getVisiblePaidCourses() {
  return getPaidCourses().filter(([, course]) => course.visible);
}

export function getPublicCourses() {
  return Object.entries(COURSE_CATALOG)
    .filter(([, course]) => course.accessType === "public")
    .sort(([, a], [, b]) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getKnownPaidProductNos() {
  return getPaidCourses()
    .map(([, course]) => Number(course.productNo))
    .filter((productNo) => Number.isInteger(productNo) && productNo > 0);
}

export function findPaidCourseByProductNo(productNo) {
  return getPaidCourses().find(([, course]) => Number(course.productNo) === Number(productNo)) || null;
}

export function getSystemCheckPaidCourse() {
  return getPaidCourses().find(([, course]) => course.systemCheck === true) || null;
}

export function validateCourseCatalog() {
  const errors = [];
  const paidProductNos = new Set();
  let systemCheckPaidCourses = 0;

  for (const [slug, course] of Object.entries(COURSE_CATALOG)) {
    if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      errors.push(`${slug || "(empty)"}: invalid slug`);
    }

    if (!course?.title || typeof course.title !== "string") {
      errors.push(`${slug}: title is required`);
    }

    if (!new Set(["public", "paid"]).has(course?.accessType)) {
      errors.push(`${slug}: accessType must be public or paid`);
    }

    if (course?.accessType === "paid") {
      const productNo = Number(course.productNo);
      if (course.systemCheck === true) {
        systemCheckPaidCourses += 1;
        if (course.salesEnabled === true) {
          errors.push(`${slug}: system-check course must not be salesEnabled`);
        }
      }
      if (course.salesEnabled === true && !course.salesUrl) {
        errors.push(`${slug}: salesEnabled course requires salesUrl`);
      }
      if (!Number.isInteger(productNo) || productNo <= 0) {
        errors.push(`${slug}: paid course requires a valid productNo`);
      } else if (paidProductNos.has(productNo)) {
        errors.push(`${slug}: duplicate paid productNo ${productNo}`);
      } else {
        paidProductNos.add(productNo);
      }
    }

    const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
    if (lessons.length === 0) {
      errors.push(`${slug}: at least one lesson is required`);
      continue;
    }

    const lessonIds = new Set();
    lessons.forEach((lesson, index) => {
      const label = `${slug} lesson ${index + 1}`;
      if (!lesson?.id || typeof lesson.id !== "string") {
        errors.push(`${label}: id is required`);
      } else if (lessonIds.has(lesson.id)) {
        errors.push(`${label}: duplicate id ${lesson.id}`);
      } else {
        lessonIds.add(lesson.id);
      }

      if (!lesson?.title || typeof lesson.title !== "string") {
        errors.push(`${label}: title is required`);
      }

      if (!/^\d+$/.test(String(lesson?.vimeoId || ""))) {
        errors.push(`${label}: Vimeo ID must be numeric`);
      }
    });
  }

  if (systemCheckPaidCourses !== 1) {
    errors.push(`catalog: exactly one paid system-check course is required (found ${systemCheckPaidCourses})`);
  }

  return errors;
}
