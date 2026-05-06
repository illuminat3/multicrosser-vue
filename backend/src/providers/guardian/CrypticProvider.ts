import { GuardianBaseProvider } from './base';

export class GuardianCrypticProvider extends GuardianBaseProvider {
  readonly providerId = 'guardian-cryptic';
  readonly crosswordType = 'cryptic';
  readonly anchor = { number: 29999, date: '2026-05-06' };
}
