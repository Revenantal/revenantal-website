import type { Credit } from "./types";

/** Credits sharing one department, in content order. */
export type CreditGroup = { department: string; credits: Credit[] };

/**
 * Groups credits by department. Departments appear in the order they first occur, and
 * entries keep their content order within each department.
 *
 * @param credits - The shared credit entries.
 * @returns One group per department.
 */
export function groupCredits(credits: readonly Credit[]): CreditGroup[] {
  const groups = new Map<string, Credit[]>();
  for (const credit of credits) {
    const group = groups.get(credit.department);
    if (group) group.push(credit);
    else groups.set(credit.department, [credit]);
  }
  return [...groups].map(([department, entries]) => ({
    department,
    credits: entries,
  }));
}
