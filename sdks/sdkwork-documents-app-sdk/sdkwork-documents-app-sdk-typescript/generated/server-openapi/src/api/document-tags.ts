import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { DocumentTagList } from '../types';


export class DocumentTagsTagsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List reusable document tags */
  async list(requestOptions?: ApiRequestOptions): Promise<DocumentTagList> {
    return this.client.request<DocumentTagList>(appApiPath(`/documents/tags`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'data' });
  }
}

export class DocumentTagsApi {
  public readonly tags: DocumentTagsTagsApi;

  constructor(client: HttpClient) {
    this.tags = new DocumentTagsTagsApi(client);
  }

}

export function createDocumentTagsApi(client: HttpClient): DocumentTagsApi {
  return new DocumentTagsApi(client);
}
