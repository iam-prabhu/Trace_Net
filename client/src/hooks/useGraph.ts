import { useQuery } from '@tanstack/react-query';
import { useGraphStore } from '../store/graph.store';
import * as graphService from '../services/graph.service';
import { TraversalOptions } from '../types/graph.types';

export function useGraph(filters?: Record<string, string>) {
  const { setGraphData, setLoading } = useGraphStore();

  const query = useQuery({
    queryKey: ['graph', filters],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await graphService.getGraph(filters);
        setGraphData(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
  });

  const runBFS = async (options: TraversalOptions) => graphService.runBFS(options);
  const runDFS = async (options: TraversalOptions) => graphService.runDFS(options);

  return { ...query, runBFS, runDFS };
}
