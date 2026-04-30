<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemUserApi.SystemUser>();

const isEdit = computed(() => !!formData.value?.id);
const getTitle = computed(() => {
  return isEdit.value
    ? $t('ui.actionTitle.edit', [$t('system.user.name')])
    : $t('ui.actionTitle.create', [$t('system.user.name')]);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2 md:col-span-1',
  },
  layout: 'vertical',
  schema: useFormSchema(isEdit.value),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

function resetForm() {
  formApi.resetForm();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.lock();
    const data = await formApi.getValues<SystemUserApi.SystemUser>();
    if (isEdit.value && !data.password) {
      delete data.password;
    }

    try {
      await (formData.value?.id
        ? updateUser(formData.value.id, data)
        : createUser(data));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = modalApi.getData<SystemUserApi.SystemUser>();
    formData.value = data?.id ? data : undefined;
    formApi.updateSchema([
      {
        dependencies: {
          show: () => !data?.id,
          triggerFields: ['username'],
        },
        fieldName: 'password',
        rules: data?.id ? null : 'required',
      },
    ]);
    formApi.resetForm();
    formApi.setValues(data || { status: 1 });
  },
});
</script>

<template>
  <Modal class="w-full max-w-180" :title="getTitle">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm">
          {{ $t('common.reset') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
