import { GuardianBaseProvider } from './base';

export class GuardianMiniProvider extends GuardianBaseProvider {
  readonly providerId = 'guardian-mini';
  readonly crosswordType = 'mini';
  readonly anchor = { number: 139, date: '2026-05-06' };
}
