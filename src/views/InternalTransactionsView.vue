<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="地址">
        <a-input v-model="searchParams.address" placeholder="输入地址" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="起始区块">
        <a-input-number v-model="searchParams.startblock" placeholder="起始区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="结束区块">
        <a-input-number v-model="searchParams.endblock" placeholder="结束区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="最少区块交易数">
        <a-input-number v-model="searchParams.min_block_txs" :min="1" placeholder="最少区块交易数" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="最少Subcalls">
        <a-input-number v-model="searchParams.min_subcalls" :min="1" placeholder="最少Subcalls数" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="页码">
        <a-input-number v-model="searchParams.page" :min="1" placeholder="页码" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="每页条数">
        <a-input-number v-model="searchParams.offset" :min="1" :max="100" placeholder="每页条数" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="排序">
        <a-select v-model="searchParams.sort" placeholder="选择排序方式" style="width: 120px;">
          <a-option value="asc">升序</a-option>
          <a-option value="desc">降序</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="fetchData">查询</a-button>
      </a-form-item>
      <a-form-item>
        <a-button @click="resetFilters">重置</a-button>
      </a-form-item>
      <a-form-item label="自动刷新(秒)">
        <a-input-number v-model="refreshInterval" :min="1" placeholder="刷新间隔" style="width: 120px;" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="togglePolling">{{ isPolling ? '停止轮询' : '开始轮询' }}</a-button>
      </a-form-item>
    </a-form>

    <!-- Quick Filter Presets -->
    <a-space style="margin: 12px 0;">
      <a-tag>快速筛选：</a-tag>
      <a-button size="small" @click="applyPreset('multicall')">Multicall交易 (≥3 subcalls)</a-button>
      <a-button size="small" @click="applyPreset('complex')">复杂交易 (≥5 subcalls)</a-button>
      <a-button size="small" @click="applyPreset('batch')">批量区块 (≥2 txs/block)</a-button>
    </a-space>

    <a-space style="margin: 12px 0;">
      <a-button type="primary" size="small" @click="batchCopyFromAddresses">批量复制From地址</a-button>
      <a-button type="primary" size="small" @click="batchCopyToAddresses">批量复制To地址</a-button>
      <a-button type="primary" size="small" @click="exportToCSV">导出CSV</a-button>
    </a-space>

    <!-- Stats Summary -->
    <a-card v-if="transactions.length > 0" style="margin-bottom: 16px;">
      <a-descriptions title="数据概览" :column="4" size="small">
        <a-descriptions-item label="总记录数">{{ pagination.total }}</a-descriptions-item>
        <a-descriptions-item label="当前页">{{ pagination.page }} / {{ pagination.total_pages }}</a-descriptions-item>
        <a-descriptions-item label="每页显示">{{ pagination.page_size }}</a-descriptions-item>
        <a-descriptions-item label="选中条数">{{ selectedRowKeys.length }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-table
      :columns="columns"
      :data="transactions"
      :pagination="paginationConfig"
      @page-change="handlePageChange"
      row-key="hash"
      style="margin-top: 20px"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
      :scroll="{ x: 1500 }"
    >
      <template #blockNumber="{ record }">
        <a-link :href="`https://bscscan.com/block/${record.blockNumber}`" target="_blank">{{ record.blockNumber }}</a-link>
      </template>
      <template #hash="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/tx/${record.hash}`" target="_blank">{{ shortHash(record.hash) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.hash)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #from="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/address/${record.from}`" target="_blank">{{ shortHash(record.from) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.from)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #to="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/address/${record.to}`" target="_blank">{{ shortHash(record.to) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.to)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #value="{ record }">
        <span>{{ formatBnbValue(record.value) }} BNB</span>
      </template>
      <template #timeStamp="{ record }">
        <span>{{ formatTime(record.timeStamp) }}</span>
      </template>
      <template #traceId="{ record }">
        <a-tag :color="getTraceColor(record.traceId)" size="small">{{ record.traceId }}</a-tag>
      </template>
      <template #type="{ record }">
        <a-tag :color="record.type === 'call' ? 'blue' : 'green'" size="small">{{ record.type }}</a-tag>
      </template>
      <template #isError="{ record }">
        <a-tag :color="record.isError === '0' ? 'green' : 'red'" size="small">
          {{ record.isError === '0' ? '成功' : '失败' }}
        </a-tag>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy } from '@arco-design/web-vue/es/icon'
import { getInternalTransactions } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

const searchParams = ref<API.InternalTransactionsQuery>({
  address: '',
  startblock: undefined,
  endblock: undefined,
  page: 1,
  offset: 20,
  sort: 'desc',
  min_block_txs: undefined,
  min_subcalls: undefined,
})

const transactions = ref<API.InternalTransaction[]>([])
const pagination = ref({
  page: 1,
  page_size: 20,
  total: 0,
  total_pages: 1,
})

const columns = [
  { title: '区块号', dataIndex: 'blockNumber', slotName: 'blockNumber', width: 120 },
  { title: '交易哈希', dataIndex: 'hash', slotName: 'hash', width: 150 },
  { title: 'From', dataIndex: 'from', slotName: 'from', width: 150 },
  { title: 'To', dataIndex: 'to', slotName: 'to', width: 150 },
  { title: 'BNB数量', dataIndex: 'value', slotName: 'value', width: 150 },
  { title: '时间', dataIndex: 'timeStamp', slotName: 'timeStamp', width: 180 },
  { title: 'TraceID', dataIndex: 'traceId', slotName: 'traceId', width: 100 },
  { title: '类型', dataIndex: 'type', slotName: 'type', width: 80 },
  { title: '状态', dataIndex: 'isError', slotName: 'isError', width: 80 },
]

const shortHash = (val: string) => {
  if (!val) return ''
  return val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
}

const formatTime = (val: string) => {
  if (!val) return ''
  // Convert Unix timestamp to readable format
  return dayjs(parseInt(val) * 1000).format('YYYY-MM-DD HH:mm:ss')
}

const formatBnbValue = (val: string | number) => {
  if (!val) return '0'
  const num = typeof val === 'string' ? parseFloat(val) : val
  // Convert wei to BNB (1 BNB = 10^18 wei)
  const bnbValue = num / Math.pow(10, 18)
  return bnbValue.toFixed(6)
}

// Get color based on trace depth (trace hierarchy visualization)
const getTraceColor = (traceId: string) => {
  if (!traceId) return 'gray'
  const depth = traceId.split('_').length - 1
  const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan']
  return colors[depth % colors.length]
}

const refreshInterval = ref<number>(60)
const isPolling = ref(false)
let timer: any = null

const togglePolling = () => {
  if (isPolling.value) {
    stopPolling()
  } else {
    startPolling()
  }
}

const startPolling = () => {
  if (isPolling.value) return
  isPolling.value = true
  fetchData()
  timer = setInterval(fetchData, (refreshInterval.value || 5) * 1000)
}

const stopPolling = () => {
  isPolling.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const fetchData = async () => {
  try {
    const params = { ...searchParams.value }
    // Remove empty parameters
    Object.keys(params).forEach(key => {
      if (!params[key as keyof API.InternalTransactionsQuery]) {
        delete params[key as keyof API.InternalTransactionsQuery]
      }
    })

    const res: any = await getInternalTransactions(params)
    console.log('API Response:', res) // Debug log
    if (res && res.status === '1') {
      transactions.value = res.result || []
      pagination.value = {
        page: res.page,
        page_size: res.page_size,
        total: res.total,
        total_pages: res.total_pages,
      }
      Message.success(`成功查询到 ${res.total} 条记录`)
    } else {
      Message.error(res?.message || '查询失败')
      transactions.value = []
    }
  } catch (e) {
    console.error('Query failed:', e)
    Message.error('查询失败，请检查网络连接')
  }
}

const resetFilters = () => {
  searchParams.value = {
    address: '',
    startblock: undefined,
    endblock: undefined,
    page: 1,
    offset: 20,
    sort: 'desc',
    min_block_txs: undefined,
    min_subcalls: undefined,
  }
  transactions.value = []
  pagination.value = {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  }
}

// Quick filter presets
const applyPreset = (preset: string) => {
  resetFilters()
  switch (preset) {
    case 'multicall':
      searchParams.value.min_subcalls = 3
      Message.info('已应用Multicall交易筛选 (≥3 subcalls)')
      break
    case 'complex':
      searchParams.value.min_subcalls = 5
      Message.info('已应用复杂交易筛选 (≥5 subcalls)')
      break
    case 'batch':
      searchParams.value.min_block_txs = 2
      Message.info('已应用批量区块筛选 (≥2 txs/block)')
      break
  }
}

// Pagination configuration
const paginationConfig = computed(() => ({
  total: pagination.value.total,
  current: pagination.value.page,
  pageSize: pagination.value.page_size,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
}))

const handlePageChange = (page: number) => {
  searchParams.value.page = page
  fetchData()
}

// Multi-select related
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// Batch copy From addresses
const batchCopyFromAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }

  const fromAddresses = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.hash))
    .map(item => item.from)
    .filter(Boolean)

  // Deduplicate addresses using Set
  const uniqueAddresses = [...new Set(fromAddresses)]

  if (!uniqueAddresses.length) {
    Message.warning('没有可复制的From地址')
    return
  }

  const addresses = uniqueAddresses.join('\n')
  copyToClipboard(addresses, `已复制 ${uniqueAddresses.length} 个去重后的From地址`, '复制失败')
}

// Batch copy To addresses
const batchCopyToAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }

  const toAddresses = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.hash))
    .map(item => item.to)
    .filter(Boolean)

  // Deduplicate addresses using Set
  const uniqueAddresses = [...new Set(toAddresses)]

  if (!uniqueAddresses.length) {
    Message.warning('没有可复制的To地址')
    return
  }

  const addresses = uniqueAddresses.join('\n')
  copyToClipboard(addresses, `已复制 ${uniqueAddresses.length} 个去重后的To地址`, '复制失败')
}

// Export to CSV
const exportToCSV = () => {
  if (!transactions.value.length) {
    Message.warning('没有可导出的数据')
    return
  }

  const headers = ['区块号', '交易哈希', 'From地址', 'To地址', 'BNB数量', '时间', 'TraceID', '类型', '状态']
  const csvContent = [
    headers.join(','),
    ...transactions.value.map(item => [
      item.blockNumber,
      item.hash,
      item.from,
      item.to,
      formatBnbValue(item.value),
      formatTime(item.timeStamp),
      item.traceId,
      item.type,
      item.isError === '0' ? '成功' : '失败'
    ].join(','))
  ].join('\n')

  // Create download link
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `internal_transactions_${dayjs().format('YYYYMMDD_HHmmss')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  Message.success('CSV文件已导出')
}

onUnmounted(() => {
  stopPolling()
})
</script>
