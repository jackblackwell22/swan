import { timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    if (left.length > 0) timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
