import { ClassEvent } from '@/types/domain';
import { mockEvents } from './mock-events';

// Track which student+event combos have already responded
export const submittedResponses: Record<string, { studentId: string; eventId: string; answers: Record<string, string>; submittedAt: string }[]> = {};

export function hasStudentResponded(studentId: string, eventId: string): boolean {
  const all = submittedResponses[eventId] ?? [];
  return all.some(r => r.studentId === studentId);
}

export function submitResponse(studentId: string, eventId: string, answers: Record<string, string>) {
  if (!submittedResponses[eventId]) submittedResponses[eventId] = [];
  submittedResponses[eventId].push({
    studentId,
    eventId,
    answers,
    submittedAt: new Date().toISOString(),
  });
}

export function findEventByToken(token: string): ClassEvent | undefined {
  return mockEvents.find(e => e.qrCode === token);
}
