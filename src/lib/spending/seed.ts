import type { SpendingState } from "./types";
import { emptySpending } from "./types";

/** @deprecated 데모 시드 제거 — emptySpending 사용 */
export function seedSpending(): SpendingState {
  return emptySpending();
}
