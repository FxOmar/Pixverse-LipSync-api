import type {
  PixverseConfig,
  PixverseResponse,
  UploadTokenResponse,
  MediaUploadResponse,
  OSSUploadResponse,
  MediaUploadRequest,
  LipSyncRequest,
  LastVideoFrameRequest,
  VideoDetailsRequest,
  VideoDetailsResponse,
} from './types';

import UserAgent from 'user-agents';
import crypto from 'crypto';

export class PixverseClient {
  private readonly baseUrl = 'https://app-api.pixverse.ai';
  private readonly config: PixverseConfig;

  constructor(config: PixverseConfig) {
    this.config = config;
  }

  private readonly userAgent = new UserAgent();

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<PixverseResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:136.0) Gecko/20100101 Firefox/136.0',
      'X-Platform': 'Web',
      Referer: 'https://app.pixverse.ai/',
      Origin: 'https://app.pixverse.ai',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Sec-GPC': '1',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US',
      'Ai-Trace-Id': crypto.randomUUID(),
      Token: this.config.token as string,
      ...this.config.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'omit',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as PixverseResponse<T>;

      if (data.ErrCode !== 0) {
        throw new Error(`API error: ${data.ErrMsg} (Code: ${data.ErrCode})`);
      }

      return data;
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.request<T>(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  async getUploadToken(): Promise<UploadTokenResponse> {
    const response = await this.request<UploadTokenResponse>(
      '/creative_platform/getUploadToken',
      {
        method: 'POST',
      }
    );
    return response.Resp;
  }

  async uploadToOSS(
    file: File,
    fileName: string,
    uploadToken: UploadTokenResponse
  ): Promise<OSSUploadResponse> {
    const fileExt = fileName.includes('.')
      ? `.${fileName.split('.').pop()}`
      : '';

    const name = `${crypto.randomUUID()}${fileExt}`;
    const path = `upload/${name}`;

    console.log('Uploading file to OSS...'); // Debugging lin

    const url = `https://pixverse-fe-upload.oss-accelerate.aliyuncs.com/${path}`;

    const date = new Date().toUTCString();
    const method = 'PUT';
    const contentType = file.type;

    const ossHeaders = {
      'x-oss-date': date,
      'x-oss-security-token': uploadToken.Token,
      'x-oss-forbid-overwrite': 'true',
      'x-oss-user-agent': 'aliyun-sdk-js/6.22.0 Firefox 136.0 on OS X 10.15',
    };

    // Create canonicalized OSS headers
    const canonicalizedOSSHeaders =
      Object.entries(ossHeaders)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key.toLowerCase()}:${value}`)
        .join('\n') + '\n';

    // Create canonicalized resource
    const canonicalizedResource = `/pixverse-fe-upload/${path}`;

    // Create string to sign
    const stringToSign = [
      method,
      '', // Content-MD5 (empty)
      contentType,
      date,
      canonicalizedOSSHeaders + canonicalizedResource,
    ].join('\n');

    const signature = crypto
      .createHmac('sha1', uploadToken.Sk)
      .update(stringToSign)
      .digest('base64');

    console.log('Signature:', signature, file.type); // Debugging line

    try {
      const headers = {
        Accept: '*/*',
        'x-oss-date': date,
        'x-oss-user-agent': 'aliyun-sdk-js/6.22.0 Firefox 136.0 on OS X 10.15',
        'x-oss-security-token': uploadToken.Token,
        'Access-Control-Allow-Origin': '*',
        'x-oss-forbid-overwrite': 'true',
        'Content-Type': file.type,
        authorization: `OSS ${uploadToken.Ak}:${signature}`,
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: file,
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to upload file (${response.status}): ${
            errorText || response.statusText
          }`
        );
      }

      return {
        name,
        path,
        type: file.type === 'video/mp4' ? 1 : 2,
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadMedia(
    uploadRequest: MediaUploadRequest
  ): Promise<MediaUploadResponse> {
    const response = await this.request<MediaUploadResponse>(
      '/creative_platform/media/upload',
      {
        method: 'POST',
        body: JSON.stringify(uploadRequest),
      }
    );

    return response.Resp;
  }

  async createLipSync(
    request: LipSyncRequest
  ): Promise<PixverseResponse<{ video_id: string }>> {
    if (!request.customer_video_path || !request.lip_sync_tts_content) {
      throw new Error(
        'Missing required fields: customer_video_path and lip_sync_tts_content are required'
      );
    }

    if (request.customer_video_duration <= 0) {
      throw new Error('Invalid video duration: must be greater than 0');
    }

    return this.request<{ video_id: string }>(
      '/creative_platform/video/lip_sync',
      {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          Refresh: 'credit',
        },
      }
    );
  }

  async getLastVideoFrame(
    request: LastVideoFrameRequest
  ): Promise<PixverseResponse<{ last_frame: string }>> {
    if (!request.video_path || request.duration <= 0) {
      throw new Error(
        'Missing required fields: video_path and duration must be provided and duration must be greater than 0'
      );
    }

    return this.request<{ last_frame: string }>(
      '/creative_platform/video/frame/last',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async getVideoDetails(
    request: VideoDetailsRequest
  ): Promise<PixverseResponse<VideoDetailsResponse>> {
    if (!request.video_id) {
      throw new Error('Missing required field: video_id must be provided');
    }

    return this.request<VideoDetailsResponse>(
      '/creative_platform/video/list/detail',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }
}
