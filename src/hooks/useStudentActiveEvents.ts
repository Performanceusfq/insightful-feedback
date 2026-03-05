import { useQuery } from '@tanstack/react-query';
import { fetchStudentActiveEvents } from '@/services/student-events';

export function useStudentActiveEvents(userId?: string) {
  return useQuery({
    queryKey: ['student-active-events', userId],
    queryFn: fetchStudentActiveEvents,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
