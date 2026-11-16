export interface EvaluationResult {
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  auc: number;
}

export interface CycleResult {
  nodeIds: string[];
  edgeIds: string[];
  length: number;
}

export interface CommunityResult {
  id: number;
  nodeIds: string[];
  size: number;
  modularity?: number;
}
