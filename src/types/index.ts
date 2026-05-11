// ── Auth ──────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  avatar?: string;
  workspace: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

// ── Sessions ──────────────────────────────────────────────────
export type SessionStatus = 'completed' | 'parsing' | 'pending' | 'failed';
export type SourceType   = 'HAR' | 'OpenAPI' | 'Postman' | 'Live';

export interface Session {
  id: string;
  name: string;
  base_url: string;
  source_type: SourceType;
  status: SessionStatus;
  created_at: string;
  endpoints_count: number;
  transactions_count: number;
  duration_ms: number;
  ai_enriched_at?: string;
  coverage: number;
  tags?: string[];
}

// ── Endpoints ────────────────────────────────────────────────
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  samples: number;
  p95_ms: number;
  confidence: number;
  status_codes: number[];
  tags?: string[];
}

// ── Security ─────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  endpoint: string;
  owasp: string;
  cvss: number;
  description?: string;
}

// ── Approvals ────────────────────────────────────────────────
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType   = 'session' | 'export' | 'model' | 'access';

export interface Approval {
  id: string;
  type: ApprovalType;
  title: string;
  requester: string;
  requester_email: string;
  created_at: string;
  status: ApprovalStatus;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// ── MLOps ────────────────────────────────────────────────────
export type ModelStatus = 'active' | 'training' | 'deprecated' | 'failed';

export interface MLModel {
  id: string;
  name: string;
  version: string;
  status: ModelStatus;
  accuracy: number;
  latency_ms: number;
  requests_per_day: number;
  last_trained: string;
  framework: string;
  description: string;
}

// ── Shared ───────────────────────────────────────────────────
export type Tone = 'slate' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}
