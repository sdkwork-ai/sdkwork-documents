import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { DocumentOverviewItem } from '../types';


export class DocumentOverviewOverviewApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List document center rows with status, locale, slug, and updated time */
  async list(requestOptions?: ApiRequestOptions): Promise<{ items: DocumentOverviewItem[]; }> {
    return this.client.request<{ items: DocumentOverviewItem[]; }>(appApiPath(`/documents/overview`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'data' });
  }
}

export class DocumentOverviewApi {
  public readonly overview: DocumentOverviewOverviewApi;

  constructor(client: HttpClient) {
    this.overview = new DocumentOverviewOverviewApi(client);
  }

}

export function createDocumentOverviewApi(client: HttpClient): DocumentOverviewApi {
  return new DocumentOverviewApi(client);
}
