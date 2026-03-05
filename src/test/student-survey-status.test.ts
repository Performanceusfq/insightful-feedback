import { describe, expect, it } from 'vitest';
import {
  mapLookupStatusToFlowState,
  mapSubmitStatusToFlowState,
  type SurveyLookupStatus,
  type SubmitSurveyStatus,
} from '@/services/student-survey';

describe('student survey status mapping', () => {
  it('maps lookup statuses to flow states', () => {
    const cases: Array<[SurveyLookupStatus, string]> = [
      ['ok', 'intro'],
      ['expired', 'expired'],
      ['already_submitted', 'already_done'],
      ['invalid_qr', 'invalid'],
      ['not_enrolled', 'invalid'],
    ];

    for (const [status, expected] of cases) {
      expect(mapLookupStatusToFlowState(status)).toBe(expected);
    }
  });

  it('maps submit statuses to flow states', () => {
    const cases: Array<[SubmitSurveyStatus, string]> = [
      ['ok', 'success'],
      ['expired', 'expired'],
      ['already_submitted', 'already_done'],
      ['invalid_qr', 'invalid'],
    ];

    for (const [status, expected] of cases) {
      expect(mapSubmitStatusToFlowState(status)).toBe(expected);
    }
  });
});
