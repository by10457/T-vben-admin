import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemFilesApi {
  export interface FileRecord {
    basePath?: string;
    contentType?: string;
    createTime?: string;
    ext?: string;
    fileSizeStr?: string;
    filename: string;
    filepath?: string;
    id: string;
    originalFilename?: string;
    platform?: string;
    size?: number;
    thUrl?: string;
    url?: string;
  }

  export interface FileInfo {
    fileSizeStr?: string;
    filename?: string;
    filepath?: string;
    platform?: string;
    size?: number;
    thUrl?: string;
    url?: string;
  }

  export interface BackendPageResult<T> {
    list: T[];
    pageNo: number;
    pageSize: number;
    total: number;
  }

  export interface GridPageResult<T> {
    items: T[];
    total: number;
  }

  export interface UploadParams {
    file: File;
    imageOnly?: boolean;
    platform?: string;
    type: string;
  }
}

async function getFileList(params: Recordable<any>) {
  const { page = 1, pageSize = 20, ...query } = params;
  const result = await requestClient.get<
    SystemFilesApi.BackendPageResult<SystemFilesApi.FileRecord>
  >(`/files/${page}/${pageSize}`, { params: query });
  return {
    items: result.list ?? [],
    total: result.total ?? 0,
  } satisfies SystemFilesApi.GridPageResult<SystemFilesApi.FileRecord>;
}

async function getFileStoragePaths() {
  return requestClient.get<string[]>('/files/private/file-storage-paths');
}

async function uploadSystemFile(params: SystemFilesApi.UploadParams) {
  const url = params.imageOnly ? '/files/private/image' : '/files/private/file';
  return requestClient.upload<SystemFilesApi.FileInfo>(url, {
    file: params.file,
    platform: params.platform,
    type: params.type,
  });
}

async function deleteFiles(ids: string[]) {
  return requestClient.delete('/files', { data: ids });
}

export { deleteFiles, getFileList, getFileStoragePaths, uploadSystemFile };
