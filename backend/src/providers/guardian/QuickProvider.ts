import { GuardianBaseProvider } from "./base";

export class GuardianQuickProvider extends GuardianBaseProvider {
  readonly providerId = "guardian-quick";
  readonly crosswordType = "quick";
  readonly anchor = { number: 17472, date: "2026-05-06" };
}
