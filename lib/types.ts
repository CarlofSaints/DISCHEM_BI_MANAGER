export type ReportType = 'SALES' | 'STOCK';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type LogStatus = 'success' | 'error' | 'validation_fail' | 'retrying' | 'size_warning' | 'site_down';
export type Channel = 'dischem' | 'clicks' | 'pnp';
export type UserRole = 'admin' | 'user';

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
  channel: Channel;
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

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
  firstLoginAt: string | null;
}

export interface SessionData {
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  expiresAt: string;
}

export interface RunLog {
  id: string;
  logType?: 'run';
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

export type UserEventAction =
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'create_user'
  | 'update_user'
  | 'delete_user';

export interface UserEventLog {
  id: string;
  logType: 'event';
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: UserEventAction;
  target: string;
  message: string;
}

export type AnyLog = RunLog | UserEventLog;
