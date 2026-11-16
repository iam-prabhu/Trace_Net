import { useQuery } from '@tanstack/react-query';
import * as analysisService from '../services/analysis.service';
import * as graphService from '../services/graph.service';

export function useAnalysis(investigationId?: string) {
  const evaluation = useQuery({
    queryKey: ['evaluation', investigationId],
    queryFn: () => analysisService.evaluateInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  const cycles = useQuery({
    queryKey: ['cycles'],
    queryFn: () => graphService.detectCycles(),
  });

  const communities = useQuery({
    queryKey: ['communities'],
    queryFn: () => graphService.detectCommunities(),
  });

  const benchmark = useQuery({
    queryKey: ['benchmark'],
    queryFn: () => analysisService.runBenchmark(),
  });

  return { evaluation, cycles, communities, benchmark };
}
