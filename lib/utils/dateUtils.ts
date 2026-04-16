/**
 * 날짜 관련 유틸리티 함수
 * - 회식날짜취합 기능에서 영업일(월~금) 계산 및 한국어 날짜 포맷에 사용
 */

const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 해당 년/월의 영업일(월~금) 날짜 문자열 배열 반환
 * @param year  4자리 연도 (예: 2026)
 * @param month 1-based 월 (예: 4 = 4월)
 * @returns 'YYYY-MM-DD' 형식 문자열 배열 (월~금만, 오름차순)
 */
export function getWeekdaysInMonth(year: number, month: number): string[] {
  const result: string[] = [];
  // 해당 월의 마지막 날 구하기
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay(); // 0=일, 1=월, ..., 6=토
    if (dow >= 1 && dow <= 5) {
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      result.push(`${year}-${mm}-${dd}`);
    }
  }

  return result;
}

/**
 * 'YYYY-MM-DD' → 'M월 D일 (요일)' 한국어 포맷
 * @example formatKoreanDate('2026-04-01') → '4월 1일 (수)'
 */
export function formatKoreanDate(dateStr: string): string {
  // 로컬 타임존 기준으로 파싱 (YYYY-MM-DD → Date)
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dow = KO_DAYS[date.getDay()];
  return `${month}월 ${day}일 (${dow})`;
}

/**
 * 'YYYY-MM-DD' → 'D일 (요일)' 짧은 한국어 포맷 (달력 셀용)
 * @example formatShortDate('2026-04-01') → '1일\n(수)'
 */
export function formatShortDate(dateStr: string): { day: number; dow: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return { day, dow: KO_DAYS[date.getDay()] };
}

/**
 * 'YYYY-MM' → 'YYYY년 MM월'
 * @example formatKoreanMonth('2026-04') → '2026년 4월'
 */
export function formatKoreanMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return `${year}년 ${month}월`;
}

/**
 * 'YYYY-MM-DD' 날짜 문자열의 요일 인덱스 반환 (0=일 ~ 6=토)
 */
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/**
 * 달력 그리드 생성 — 주어진 월의 날짜 배열을 주 단위로 묶어 반환
 * 빈 칸은 null로 채움 (일요일 시작 기준)
 * @returns (string | null)[][] — 각 행은 일~토 7칸
 */
export function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  const lastDay = new Date(year, month, 0).getDate();
  const firstDate = new Date(year, month - 1, 1);
  const startDow = firstDate.getDay(); // 0=일

  const mm = String(month).padStart(2, "0");
  const cells: (string | null)[] = [];

  // 앞쪽 빈 칸
  for (let i = 0; i < startDow; i++) cells.push(null);

  for (let day = 1; day <= lastDay; day++) {
    const dd = String(day).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }

  // 뒤쪽 빈 칸 (7의 배수로 맞춤)
  while (cells.length % 7 !== 0) cells.push(null);

  // 주 단위로 쪼개기
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
