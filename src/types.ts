export interface PixverseConfig {
  headers?: Record<string, string>;
  token?: string;
}

export interface PixverseResponse<T> {
  ErrCode: number;
  ErrMsg: string;
  Resp: T;
}

// Upload Token Response
export interface UploadTokenResponse {
  Ak: string;
  Sk: string;
  Token: string;
}

// Media Upload Response
export interface MediaUploadRequest {
  name: string;
  path: string;
  type: number;
}
export interface OSSUploadResponse {
  name: string;
  path: string;
  type: number;
}

export interface MediaUploadResponse {
  path: string;
  url: string;
}

// Lip Sync Request
export interface LipSyncRequest {
  customer_video_path: string;
  lip_sync_tts_content: string;
  lip_sync_tts_speaker_id: string;
  model: string;
  customer_video_url: string;
  customer_video_duration: number;
  customer_video_last_frame_url: string;
  credit_change: number;
}

// Common interfaces for API endpoints
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UploadTokenResponse {
  Token: string;
  Ak: string;
  Sk: string;
}

export interface MediaUploadResponse {
  media_path: string;
  media_type: string;
  media_duration?: number;
}

export interface LipSyncRequest {
  customer_video_path: string;
  lip_sync_tts_content: string;
  customer_video_duration: number;
}

export interface LastVideoFrameRequest {
  video_path: string;
  duration: number;
}

export interface VideoDetailsRequest {
  video_id: number;
  platform?: string;
}

export interface VideoDetailsResponse {
  video_id: number;
  video_url: string;
  video_path: string;
  video_duration: number;
  video_status: number;
  video_type: number;
  create_time: string;
  update_time: string;
}
