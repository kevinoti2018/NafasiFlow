/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AnalysisResult {
  id: string;
  matchScore: number;
  verdict: string;
  cvVersionId: string;
  jobId: string;
  analysis: any;
  cvVersion: {
    id: string;
    source: string;
    atsFormatScore: number | null;
    atsContentScore: number | null;
    createdAt: string;
  };
  job: {
    id: string;
    title: string | null;
    company: string | null;
    normalizedTitle: string | null;
  };
  application: { id: string; status: string } | null;
}
