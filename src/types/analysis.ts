
export interface MatchedWindRecord {
  startTime: string;
  publishTime: string;
  actualGeneration: number;
  forecastGeneration: number;
  error: number;
  absoluteError: number;
}

export interface WindAnalysis {
  cutoff: string;
  timezone: string;
  matchedCount: number;
  missingForecastCount: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  data: MatchedWindRecord[];
}
