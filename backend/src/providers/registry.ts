import { CrosswordHost, CrosswordProvider } from "./types";
import { GuardianHost } from "./guardian/GuardianHost";

const hosts: CrosswordHost[] = [new GuardianHost()];

export function getAllHosts(): CrosswordHost[] {
  return hosts;
}

export function getAllProviders(): CrosswordProvider[] {
  return hosts.flatMap((h) => h.providers);
}

export function getProvider(providerId: string): CrosswordProvider | undefined {
  return getAllProviders().find((p) => p.providerId === providerId);
}
