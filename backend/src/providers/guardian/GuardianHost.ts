import { CrosswordHost, CrosswordProvider } from "../types";
import { GuardianQuickProvider } from "./QuickProvider";
import { GuardianCrypticProvider } from "./CrypticProvider";
import { GuardianMiniProvider } from "./MiniProvider";

export class GuardianHost implements CrosswordHost {
  readonly hostId = "guardian";
  readonly displayName = "The Guardian";
  readonly providers: CrosswordProvider[];

  constructor() {
    this.providers = [
      new GuardianQuickProvider(),
      new GuardianCrypticProvider(),
      new GuardianMiniProvider(),
    ];
  }
}
