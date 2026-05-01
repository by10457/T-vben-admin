<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { SystemMonitorApi } from '#/api/system/monitor';

import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef } from 'vue';

import { Page } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Button, Card, Progress, Spin, Tag } from 'antdv-next';

import { getServerMonitor } from '#/api/system/monitor';
import { $t } from '#/locales';

defineOptions({ name: 'MonitorServer' });

const AUTO_REFRESH_INTERVAL = 5000;

const monitor = shallowRef<SystemMonitorApi.ServerMonitor>();
const loading = shallowRef(false);
const systemCpuHistory = shallowRef<number[]>([]);
const processCpuHistory = shallowRef<number[]>([]);
const systemCpuChartRef = shallowRef<EchartsUIType>();
const processCpuChartRef = shallowRef<EchartsUIType>();
const { renderEcharts: renderSystemCpuChart } = useEcharts(systemCpuChartRef);
const { renderEcharts: renderProcessCpuChart } = useEcharts(processCpuChartRef);
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const mainDisk = computed(() => monitor.value?.disks?.[0]);

const javaItems = computed(() => [
  { label: $t('monitor.server.java.name'), value: monitor.value?.java.name },
  {
    label: $t('monitor.server.java.version'),
    value: monitor.value?.java.version,
  },
  { label: $t('monitor.server.java.vendor'), value: monitor.value?.java.vendor },
  { label: $t('monitor.server.java.home'), value: monitor.value?.java.home },
  {
    label: $t('monitor.server.java.startTime'),
    value: monitor.value?.java.startTime,
  },
  { label: $t('monitor.server.java.runTime'), value: monitor.value?.java.runTime },
]);

const systemItems = computed(() => [
  {
    label: $t('monitor.server.system.hostName'),
    value: monitor.value?.system.hostName,
  },
  { label: $t('monitor.server.system.os'), value: systemName.value },
  {
    label: $t('monitor.server.system.arch'),
    value: monitor.value?.system.osArch,
  },
  {
    label: $t('monitor.server.system.userDir'),
    value: monitor.value?.system.userDir,
  },
]);

const systemName = computed(() => {
  const system = monitor.value?.system;
  return system ? `${system.osName} ${system.osVersion}`.trim() : '-';
});

const hasSystemCpuTrend = computed(() => systemCpuHistory.value.length > 1);
const hasProcessCpuTrend = computed(() => processCpuHistory.value.length > 1);

const usageCards = computed(() => [
  {
    color: '#1677ff',
    label: $t('monitor.server.cpu.system'),
    percent: monitor.value?.cpu.systemCpuLoad ?? 0,
    value: percent(monitor.value?.cpu.systemCpuLoad ?? 0),
  },
  {
    color: '#52c41a',
    label: $t('monitor.server.cpu.process'),
    percent: monitor.value?.cpu.processCpuLoad ?? 0,
    value: percent(monitor.value?.cpu.processCpuLoad ?? 0),
  },
  {
    color: '#faad14',
    label: $t('monitor.server.memory.jvm'),
    percent: monitor.value?.memory.jvmUsage ?? 0,
    value: formatBytes(monitor.value?.memory.jvmUsed ?? 0),
  },
  {
    color: '#722ed1',
    label: $t('monitor.server.memory.system'),
    percent: monitor.value?.memory.systemUsage ?? 0,
    value: formatBytesPair(
      monitor.value?.memory.systemUsed ?? 0,
      monitor.value?.memory.systemTotal ?? 0,
    ),
  },
]);

async function loadData() {
  if (loading.value) {
    return;
  }

  loading.value = true;
  try {
    monitor.value = await getServerMonitor();
    pushHistory(systemCpuHistory, monitor.value.cpu.systemCpuLoad);
    pushHistory(processCpuHistory, monitor.value.cpu.processCpuLoad);
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    void loadData();
  }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
}

function pushHistory(target: typeof systemCpuHistory, value: number) {
  const history = [...target.value, Number(value.toFixed(2))];
  target.value = history.slice(-12);
}

function renderCharts() {
  renderCpuChart(renderSystemCpuChart, systemCpuHistory.value, '#1677ff');
  renderCpuChart(renderProcessCpuChart, processCpuHistory.value, '#52c41a');
}

function renderCpuChart(
  render: ReturnType<typeof useEcharts>['renderEcharts'],
  data: number[],
  color: string,
) {
  render({
    grid: {
      bottom: 16,
      containLabel: true,
      left: 12,
      right: 16,
      top: 20,
    },
    series: [
      {
        areaStyle: {
          color,
          opacity: 0.12,
        },
        data,
        itemStyle: { color },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        type: 'line',
      },
    ],
    tooltip: {
      formatter: '{c}%',
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: { show: false },
      axisTick: { show: false },
      boundaryGap: false,
      data: data.map((_item, index) => `${index + 1}`),
      type: 'category',
    },
    yAxis: {
      max: 100,
      min: 0,
      splitNumber: 4,
      type: 'value',
    },
  });
}

function formatBytes(value: number) {
  if (!value) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatBytesPair(used: number, total: number) {
  if (!total) {
    return formatBytes(used);
  }
  return `${formatBytes(used)} / ${formatBytes(total)}`;
}

function percent(value: number) {
  return `${Math.min(Math.max(value, 0), 100).toFixed(2)}%`;
}

onMounted(() => {
  void loadData();
  startAutoRefresh();
});

onBeforeUnmount(stopAutoRefresh);
</script>

<template>
  <Page>
    <div class="monitor-server space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">
            {{ $t('monitor.server.title') }}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ $t('monitor.server.subtitle') }}
          </p>
        </div>
        <Button :loading="loading" @click="loadData">
          <RotateCw class="size-4" />
          {{ $t('common.refresh') }}
        </Button>
      </div>

      <Spin :spinning="loading && !monitor">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-4 md:grid-cols-2">
          <Card
            v-for="item in usageCards"
            :key="item.label"
            :bordered="false"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm text-muted-foreground">{{ item.label }}</div>
                <div class="mt-2 text-xl font-semibold">{{ item.value }}</div>
              </div>
              <Progress
                :percent="item.percent"
                :stroke-color="item.color"
                :width="72"
                type="circle"
              />
            </div>
          </Card>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card :bordered="false" :title="$t('monitor.server.java.title')">
            <div class="info-list">
              <div v-for="item in javaItems" :key="item.label" class="info-row">
                <span>{{ item.label }}</span>
                <strong>{{ item.value || '-' }}</strong>
              </div>
            </div>
          </Card>

          <Card :bordered="false" :title="$t('monitor.server.system.title')">
            <div class="info-list">
              <div
                v-for="item in systemItems"
                :key="item.label"
                class="info-row"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value || '-' }}</strong>
              </div>
            </div>
          </Card>

          <Card :bordered="false" :title="$t('monitor.server.disk.title')">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="truncate text-lg font-semibold">
                  {{ mainDisk?.name || '-' }}
                </div>
                <div class="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div>
                    {{ $t('monitor.server.disk.total') }}:
                    {{ formatBytes(mainDisk?.total ?? 0) }}
                  </div>
                  <div>
                    {{ $t('monitor.server.disk.free') }}:
                    {{ formatBytes(mainDisk?.free ?? 0) }}
                  </div>
                </div>
              </div>
              <Progress
                :percent="mainDisk?.usage ?? 0"
                :width="96"
                type="circle"
              />
            </div>
          </Card>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card :bordered="false" :title="$t('monitor.server.cpu.systemTrend')">
            <div class="chart-panel">
              <EchartsUI ref="systemCpuChartRef" class="h-64" />
              <div v-if="!hasSystemCpuTrend" class="chart-empty">
                {{ $t('monitor.server.cpu.waitingForSamples') }}
              </div>
            </div>
          </Card>
          <Card
            :bordered="false"
            :title="$t('monitor.server.cpu.processTrend')"
          >
            <div class="chart-panel">
              <EchartsUI ref="processCpuChartRef" class="h-64" />
              <div v-if="!hasProcessCpuTrend" class="chart-empty">
                {{ $t('monitor.server.cpu.waitingForSamples') }}
              </div>
            </div>
          </Card>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card :bordered="false" :title="$t('monitor.server.database.title')">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('monitor.server.database.description') }}
              </span>
              <Tag color="default">{{ $t('common.disabled') }}</Tag>
            </div>
          </Card>
          <Card :bordered="false" :title="$t('monitor.server.redis.title')">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('monitor.server.redis.description') }}
              </span>
              <Tag color="default">{{ $t('common.disabled') }}</Tag>
            </div>
          </Card>
        </div>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.monitor-server :deep(.ant-card) {
  border-radius: 8px;
}

.info-list {
  display: grid;
  gap: 12px;
}

.info-row {
  display: grid;
  grid-template-columns: minmax(88px, 120px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  font-size: 14px;
}

.info-row span {
  color: hsl(var(--muted-foreground));
}

.info-row strong {
  min-width: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.chart-panel {
  position: relative;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
}
</style>
