import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

export function useFormSchema(isEdit: boolean): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.minLength', [$t('system.user.username'), 1]))
        .max(
          30,
          $t('ui.formRules.maxLength', [$t('system.user.username'), 30]),
        ),
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.minLength', [$t('system.user.realName'), 1]))
        .max(
          20,
          $t('ui.formRules.maxLength', [$t('system.user.realName'), 20]),
        ),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.email'),
      rules: z
        .string()
        .email($t('ui.formRules.invalidEmail'))
        .max(150, $t('ui.formRules.maxLength', [$t('system.user.email'), 150])),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.phone'),
      rules: z
        .string()
        .max(50, $t('ui.formRules.maxLength', [$t('system.user.phone'), 50]))
        .optional(),
    },
    {
      component: 'InputPassword',
      dependencies: {
        show: () => !isEdit,
        triggerFields: ['username'],
      },
      fieldName: 'password',
      label: $t('system.user.password'),
      rules: isEdit ? undefined : 'required',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
      },
      fieldName: 'deptId',
      label: $t('system.user.dept'),
      rules: 'selectRequired',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: () => getRoleList({ page: 1, pageSize: 1000 }),
        class: 'w-full',
        labelField: 'name',
        mode: 'multiple',
        resultField: 'items',
        valueField: 'id',
      },
      fieldName: 'roleIds',
      label: $t('system.user.roles'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.user.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 80,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.user.remark'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.user.status'),
    },
  ];
}

export function useColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'username',
      minWidth: 140,
      title: $t('system.user.username'),
    },
    {
      field: 'realName',
      minWidth: 140,
      title: $t('system.user.realName'),
    },
    {
      field: 'email',
      minWidth: 180,
      title: $t('system.user.email'),
    },
    {
      field: 'phone',
      minWidth: 140,
      title: $t('system.user.phone'),
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.user.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('system.user.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 130,
    },
  ];
}
