export type ReportType = 'SALES' | 'STOCK';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type LogStatus = 'success' | 'error' | 'validation_fail' | 'retrying' | 'size_warning' | 'site_down';

export interface Schedule {
  id: string;
  label: string;
  frequency: Frequency;
  time: string; // HH:MM 24h
  days?: number[]; // weekly: 0=Sun … 6=Sat
  dayOfMonth?: number; // monthly: 1-28
}

export interface ValidationConfig {
  enabled: boolean;
  retryWaitMinutes: number;
  maxRetries: number;
}

export interface Client {
  id: string;
  name: string;
  username: string;
  password: string;
  reportType: ReportType;
  bookmarkName: string;
  downloadDir: string;
  schedules: Schedule[];
  validation: ValidationConfig;
  expectedFileSizeKb: number;
  fileSizeTolerancePct: number;
  notifyEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunLog {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  trigger: 'schedule' | 'manual';
  status: LogStatus;
  filePath?: string;
  fileSizeKb?: number;
  expectedSizeKb?: number;
  latestDataDate?: string; // YYYY-MM-DD
  retryCount: number;
  message: string;
  durationMs?: number;
}
