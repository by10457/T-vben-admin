import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    [key: string]: any;
    avatar?: string;
    createTime?: string;
    deptId?: string;
    email: string;
    id: string;
    password?: string;
    phone?: string;
    realName: string;
    remark?: string;
    roleIds?: string[];
    status: 0 | 1;
    username: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getUserList(params: Recordable<any>) {
  return requestClient.get<SystemUserApi.PageResult<SystemUserApi.SystemUser>>(
    '/system/user/list',
    { params },
  );
}

async function createUser(data: Omit<SystemUserApi.SystemUser, 'id'>) {
  return requestClient.post('/system/user', data);
}

async function updateUser(
  id: string,
  data: Partial<Omit<SystemUserApi.SystemUser, 'id'>>,
) {
  return requestClient.put(`/system/user/${id}`, data);
}

async function deleteUser(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

export { createUser, deleteUser, getUserList, updateUser };
