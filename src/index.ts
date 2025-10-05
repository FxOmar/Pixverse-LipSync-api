import { PixverseClient } from './client';
import type { PixverseConfig } from './types';

export type { PixverseClient, PixverseConfig };

export * from './types';

export default function createPixverseClient(
  config: PixverseConfig
): PixverseClient {
  return new PixverseClient(config);
}
