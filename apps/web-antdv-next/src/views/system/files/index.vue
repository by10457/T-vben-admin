<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'antdv-next';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemFilesApi } from '#/api/system/files';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, message, Modal, Select, Upload } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFiles,
  getFileList,
  getFileStoragePaths,
  uploadSystemFile,
} from '#/api/system/files';
import { $t } from '#/locales';

defineOptions({ name: 'SystemFiles' });

const platformOptions = [
  {
    color: 'processing',
    label: $t('system.files.platformLocal'),
    value: 'local-plus-1',
  },
  { color: 'success', label: 'MinIO', value: 'minio-1' },
];

const storageTypes = ref<string[]>(['images', 'avatar', 'default']);
const fileList = ref<UploadFile[]>([]);
const uploadModalOpen = ref(false);
const uploading = ref(false);
const uploadForm = reactive({
  imageOnly: false,
  platform: 'local-plus-1',
  type: 'images',
});
const uploadMessageKey = 'system-files-upload';

const storageTypeOptions = computed(() =>
  storageTypes.value.map((value) => ({ label: value, value })),
);

const selectedFiles = computed(() =>
  fileList.value
    .map((file) => {
      const rawFile = (file as UploadFile & { originFileObj?: File })
        .originFileObj;
      return rawFile ?? (file as unknown as File);
    })
    .filter((file): file is File => file instanceof File),
);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'filename',
        label: $t('system.files.filename'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: platformOptions,
        },
        fieldName: 'platform',
        label: $t('system.files.platform'),
      },
    ],
    submitOnChange: true,
  },
  gridOptions: {
    columns: [
      {
        field: 'filename',
        minWidth: 220,
        title: $t('system.files.filename'),
      },
      {
        cellRender: { name: 'CellTag', options: platformOptions },
        field: 'platform',
        title: $t('system.files.platform'),
        width: 130,
      },
      {
        field: 'filepath',
        minWidth: 180,
        title: $t('system.files.filepath'),
      },
      {
        field: 'contentType',
        minWidth: 160,
        title: $t('system.files.contentType'),
      },
      {
        field: 'fileSizeStr',
        formatter: ({ row }) => row.fileSizeStr || formatFileSize(row.size),
        title: $t('system.files.size'),
        width: 120,
      },
      {
        field: 'url',
        minWidth: 240,
        slots: { default: 'fileUrl' },
        title: $t('system.files.url'),
      },
      {
        field: 'createTime',
        title: $t('system.files.createTime'),
        width: 180,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'filename',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'open',
              icon: 'lucide:external-link',
              text: $t('system.files.open'),
            },
            {
              code: 'delete',
              danger: true,
              icon: 'lucide:trash-2',
              text: $t('common.delete'),
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: $t('system.files.operation'),
        width: 160,
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getFileList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemFilesApi.FileRecord>,
});

onMounted(async () => {
  storageTypes.value = await getFileStoragePaths();
  if (!storageTypes.value.includes(uploadForm.type)) {
    uploadForm.type = storageTypes.value[0] || 'default';
  }
});

const beforeUpload: UploadProps['beforeUpload'] = (_file, files) => {
  fileList.value = files as UploadFile[];
  return false;
};

const onRemoveFile: UploadProps['onRemove'] = (file) => {
  fileList.value = fileList.value.filter((item) => item.uid !== file.uid);
  return true;
};

function openUploadModal() {
  uploadModalOpen.value = true;
}

function closeUploadModal() {
  if (uploading.value) {
    return;
  }
  uploadModalOpen.value = false;
}

function resetUploadState() {
  fileList.value = [];
  uploadForm.imageOnly = false;
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemFilesApi.FileRecord>) {
  if (code === 'delete') {
    onDelete(row);
  }
  if (code === 'open') {
    openFile(row.url);
  }
}

async function onUpload() {
  const files = selectedFiles.value;
  if (files.length === 0) {
    message.warning($t('system.files.selectFileFirst'));
    return;
  }

  uploading.value = true;
  message.loading({
    content: $t('system.files.uploading'),
    duration: 0,
    key: uploadMessageKey,
  });
  try {
    for (const file of files) {
      await uploadSystemFile({
        file,
        imageOnly: uploadForm.imageOnly,
        platform: uploadForm.platform,
        type: uploadForm.type,
      });
    }
    message.success({
      content: $t('system.files.uploadSuccess'),
      key: uploadMessageKey,
    });
    resetUploadState();
    uploadModalOpen.value = false;
    await gridApi.query();
  } finally {
    uploading.value = false;
  }
}

function onDelete(row: SystemFilesApi.FileRecord) {
  Modal.confirm({
    centered: true,
    content: $t('system.files.deleteConfirm', [row.filename]),
    okButtonProps: { danger: true },
    okText: $t('common.delete'),
    title: $t('system.files.deleteTitle'),
    async onOk() {
      await deleteFiles([row.id]);
      message.success({
        content: $t('system.files.deleteSuccess'),
        key: 'system-files-delete',
      });
      gridApi.query();
    },
  });
}

function openFile(url?: string) {
  if (!url) {
    message.warning($t('system.files.emptyUrl'));
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatFileSize(size?: number) {
  if (!size) {
    return '-';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<template>
  <Page auto-content-height>
    <Modal
      v-model:open="uploadModalOpen"
      centered
      :confirm-loading="uploading"
      :destroy-on-hidden="true"
      :mask-closable="!uploading"
      :title="$t('system.files.uploadTitle')"
      :width="640"
      @cancel="closeUploadModal"
      @ok="onUpload"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-sm text-muted-foreground">
            {{ $t('system.files.platform') }}
          </span>
          <Select
            v-model:value="uploadForm.platform"
            class="w-full"
            :options="platformOptions"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-sm text-muted-foreground">
            {{ $t('system.files.filepath') }}
          </span>
          <Select
            v-model:value="uploadForm.type"
            class="w-full"
            :options="storageTypeOptions"
          />
        </div>
      </div>
      <Checkbox v-model:checked="uploadForm.imageOnly" class="mt-4">
        {{ $t('system.files.imageOnly') }}
      </Checkbox>
      <Upload
        v-model:file-list="fileList"
        class="mt-4 block"
        :before-upload="beforeUpload"
        :disabled="uploading"
        :multiple="true"
        @remove="onRemoveFile"
      >
        <Button :disabled="uploading">
          <IconifyIcon icon="lucide:paperclip" class="size-4" />
          {{ $t('system.files.chooseFile') }}
        </Button>
      </Upload>
    </Modal>

    <Grid :table-title="$t('system.files.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openUploadModal">
          <IconifyIcon icon="lucide:upload" class="size-4" />
          {{ $t('system.files.upload') }}
        </Button>
      </template>

      <template #fileUrl="{ row }">
        <Button
          v-if="row.url"
          type="link"
          size="small"
          @click="openFile(row.url)"
        >
          {{ $t('system.files.open') }}
        </Button>
        <span v-else>-</span>
      </template>
    </Grid>
  </Page>
</template>
