/**
 * Finds prohibited attribution in commit messages and pull request text.
 *
 * @param text - Commit message or pull request text to validate.
 * @returns The policy violations found, without echoing the supplied text.
 */
export function attributionViolations(text: string): string[] {
  const violations: string[] = [];

  if (/^\s*co-authored-by\s*:/im.test(text)) {
    violations.push("Co-author trailers are not permitted.");
  }

  if (
    /\bgenerated\s+(?:with|by)\b|\bai[- ](?:generated|authored)\b/i.test(text)
  ) {
    violations.push("Generated-by attribution is not permitted.");
  }

  if (
    /https?:\/\/(?:chatgpt\.com|claude\.ai)\/(?:share|c|chat)\//i.test(text)
  ) {
    violations.push("Assistant session links are not permitted.");
  }

  return violations;
}
