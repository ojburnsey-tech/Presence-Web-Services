export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database {
  prepare(sql: string): Statement;
}
export interface AppEnv {
  DB?: Database;
  APP_SECRET?: string;
  OWNER_REVIEW_TOKEN?: string;
  ENQUIRIES_ENABLED?: string;
  DEPLOYMENT_STAGE?: string;
  ENQUIRY_RETENTION_DAYS?: string;
  PUBLIC_LAUNCH_APPROVED?: string;
  BUILD_PUBLIC_RELEASE?: string;
}
export interface StaticAsset {
  body: string;
  type: string;
  base64?: boolean;
}
export type AssetMap = Record<string, StaticAsset>;
export interface EnquiryData {
  'contact-name': string;
  'business-name': string;
  email: string;
  website: string;
  'google-profile': string;
  location: string;
  telephone: string;
  service: string;
  goal: string;
}
export interface EnquiryRow {
  seq: number;
  id: string;
  request_key: string;
  payload_hash: string;
  created_at: number;
  expires_at: number;
  data_json: string;
}
