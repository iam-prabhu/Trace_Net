import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as investigationService from '../services/investigation.service';
import { Investigation } from '../types/investigation.types';

export function useInvestigations() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['investigations'],
    queryFn: investigationService.getInvestigations,
  });

  const create = useMutation({
    mutationFn: (data: Partial<Investigation>) =>
      investigationService.createInvestigation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investigations'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Investigation> }) =>
      investigationService.updateInvestigation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investigations'] }),
  });

  const remove = useMutation({
    mutationFn: investigationService.deleteInvestigation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investigations'] }),
  });

  return { ...query, create, update, remove };
}
