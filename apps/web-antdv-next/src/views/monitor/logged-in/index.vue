<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMonitorApi } from '#/api/system/monitor';

import { Page } from '@vben/common-ui';

import { message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { forceLogoutUser, getLoggedInUserList } from '#/api/system/monitor';
import { $t } from '#/locales';

defineOptions({ name: 'MonitorLoggedIn' });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        title: $t('monitor.loggedIn.index'),
        type: 'seq',
        width: 80,
      },
      {
        field: 'nickname',
        minWidth: 140,
        title: $t('monitor.loggedIn.nickname'),
      },
      {
        field: 'username',
        minWidth: 140,
        title: $t('monitor.loggedIn.username'),
      },
      {
        field: 'email',
        minWidth: 180,
        title: $t('monitor.loggedIn.email'),
      },
      {
        field: 'phone',
        minWidth: 140,
        title: $t('monitor.loggedIn.phone'),
      },
      {
        field: 'summary',
        minWidth: 220,
        title: $t('monitor.loggedIn.summary'),
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'forceLogout',
              danger: true,
              icon: 'lucide:log-out',
              text: $t('monitor.loggedIn.forceLogout'),
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: $t('monitor.loggedIn.operation'),
        width: 140,
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getLoggedInUserList(page.currentPage, page.pageSize);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: false,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemMonitorApi.LoggedInUser>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMonitorApi.LoggedInUser>) {
  if (code === 'forceLogout') {
    onForceLogout(row);
  }
}

function onForceLogout(row: SystemMonitorApi.LoggedInUser) {
  Modal.confirm({
    centered: true,
    content: $t('monitor.loggedIn.forceLogoutConfirm', [row.username]),
    okButtonProps: { danger: true },
    okText: $t('monitor.loggedIn.forceLogout'),
    title: $t('monitor.loggedIn.forceLogoutTitle'),
    async onOk() {
      await forceLogoutUser(row.id);
      message.success($t('monitor.loggedIn.forceLogoutSuccess'));
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('monitor.loggedIn.title')" />
  </Page>
</template>
