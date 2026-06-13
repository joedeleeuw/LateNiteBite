export function floorToMinute(date = new Date()): Date {
  const minute = new Date(date);
  minute.setSeconds(0, 0);
  return minute;
}

export function millisecondsUntilNextMinute(nowMs = Date.now()): number {
  const remainder = nowMs % 60_000;
  return remainder === 0 ? 60_000 : 60_000 - remainder;
}
