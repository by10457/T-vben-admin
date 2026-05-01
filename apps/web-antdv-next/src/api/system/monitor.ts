import { requestClient } from '#/api/request';

export namespace SystemMonitorApi {
  export interface JavaInfo {
    home: string;
    name: string;
    runTime: string;
    startTime: string;
    vendor: string;
    version: string;
  }

  export interface SystemInfo {
    hostName: string;
    osArch: string;
    osName: string;
    osVersion: string;
    userDir: string;
  }

  export interface CpuInfo {
    processCpuLoad: number;
    processors: number;
    systemCpuLoad: number;
  }

  export interface MemoryInfo {
    jvmFree: number;
    jvmMax: number;
    jvmTotal: number;
    jvmUsage: number;
    jvmUsed: number;
    systemFree: number;
    systemTotal: number;
    systemUsage: number;
    systemUsed: number;
  }

  export interface DiskInfo {
    free: number;
    name: string;
    total: number;
    type: string;
    usable: number;
    usage: number;
    used: number;
  }

  export interface ServerMonitor {
    cpu: CpuInfo;
    disks: DiskInfo[];
    java: JavaInfo;
    memory: MemoryInfo;
    system: SystemInfo;
  }

  export interface LoggedInUser {
    avatar?: string;
    email?: string;
    id: string;
    nickname?: string;
    phone?: string;
    summary?: string;
    username: string;
  }

  export interface BackendPageResult<T> {
    list: T[];
    pageNo: number;
    pageSize: number;
    total: number;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getServerMonitor() {
  return requestClient.get<SystemMonitorApi.ServerMonitor>('/monitor/server');
}

async function getLoggedInUserList(page: number, pageSize: number) {
  const result = await requestClient.get<
    SystemMonitorApi.BackendPageResult<SystemMonitorApi.LoggedInUser>
  >(`/user/users/logged-in/${page}/${pageSize}`);
  return {
    items: result.list ?? [],
    total: result.total ?? 0,
  };
}

async function forceLogoutUser(id: string) {
  return requestClient.put(`/user/${id}/force-logout`);
}

export { forceLogoutUser, getLoggedInUserList, getServerMonitor };
