import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSurveyResponse } from '@/services/student-survey';

interface SubmitPayload {
  qrCode: string;
  answers: Record<string, string>;
}

export function useSubmitEventResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ qrCode, answers }: SubmitPayload) => submitSurveyResponse(qrCode, answers),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-active-events'] });
      queryClient.invalidateQueries({ queryKey: ['survey-by-qr', variables.qrCode] });
    },
  });
}
