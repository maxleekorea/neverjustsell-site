export const COURSE_CATALOG = {
  "free-lesson-1": {
    productNo: 12,
    title: "무료 1강",
    summary: "무료 공개 강의",
    accessType: "public",
    visible: false,
    sortOrder: 0,
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

export function findPaidCourseByProductNo(productNo) {
  return getPaidCourses().find(([, course]) => Number(course.productNo) === Number(productNo)) || null;
}
