import { useQuery } from '@tanstack/react-query';
import { fetchSurveyByQr } from '@/services/student-survey';

export function useSurveyByQr(qrCode?: string) {
  return useQuery({
    queryKey: ['survey-by-qr', qrCode],
    queryFn: () => fetchSurveyByQr(qrCode ?? ''),
    enabled: Boolean(qrCode),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
