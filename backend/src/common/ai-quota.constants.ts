import { UserPlan } from './enums/user.enum';

export const FREE_AI_DAILY_LIMIT = 25;
export const PRO_AI_DAILY_LIMIT = 500;

export function aiDailyLimitForPlan(plan: UserPlan): number {
  return plan === UserPlan.PRO ? PRO_AI_DAILY_LIMIT : FREE_AI_DAILY_LIMIT;
}
