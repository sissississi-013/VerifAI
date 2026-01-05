export enum VerdictType {
  VERIFIED = 'verified',
  DEBUNKED = 'debunked',
  NUANCED = 'nuanced',
  UNCERTAIN = 'uncertain'
}

export enum ChartType {
  BAR = 'bar',
  PIE = 'pie',
  LINE = 'line',
  AREA = 'area',
  STAT = 'stat'
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface FactCardData {
  id: string;
  timestamp: number;
  originalClaim: string;
  status: 'loading' | 'complete' | 'error';
  verdict?: VerdictType;
  explanation?: string;
  confidenceScore?: number;
  sources?: { title: string; uri: string }[];
  visualization?: {
    type: ChartType;
    title: string;
    data: ChartDataPoint[];
    xLabel?: string;
    yLabel?: string;
  };
}

export interface VerifyClaimArgs {
  claim: string;
  context?: string;
}