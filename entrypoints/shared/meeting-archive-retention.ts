export const MEETING_ARCHIVE_RETENTION_DAY_OPTIONS = [
  0, 30, 90, 180, 365,
] as const;

export const DEFAULT_MEETING_ARCHIVE_RETENTION_DAYS = 180;
export const MAX_ARCHIVED_SESSION_COUNT = 250;
export const STORAGE_PRESSURE_HIGH_RATIO = 0.7;
export const STORAGE_PRESSURE_TARGET_RATIO = 0.55;

export function normalizeMeetingArchiveRetentionDays(
  value: number | undefined
): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MEETING_ARCHIVE_RETENTION_DAYS;
  }

  const normalizedValue = Math.round(numericValue);
  const matchedOption = MEETING_ARCHIVE_RETENTION_DAY_OPTIONS.find(
    (option) => option === normalizedValue
  );

  return matchedOption ?? DEFAULT_MEETING_ARCHIVE_RETENTION_DAYS;
}

export function isMeetingArchiveRetentionDisabled(
  retentionDays: number | undefined
): boolean {
  return normalizeMeetingArchiveRetentionDays(retentionDays) === 0;
}

export function getMeetingArchiveRetentionAgeMs(retentionDays: number): number {
  return normalizeMeetingArchiveRetentionDays(retentionDays) * 24 * 60 * 60 * 1000;
}
