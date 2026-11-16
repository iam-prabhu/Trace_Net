// Metrics utilities — stub for Prometheus or custom metrics

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

const metrics: Metric[] = [];

export function recordMetric(metric: Metric): void {
  metrics.push({ ...metric, timestamp: new Date() });
}

export function getMetrics(): Metric[] {
  return [...metrics];
}

export function clearMetrics(): void {
  metrics.length = 0;
}
