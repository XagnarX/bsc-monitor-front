<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="接收地址">
        <a-input v-model="searchParams.address" placeholder="输入地址查询特定地址" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="发送地址">
        <a-input v-model="searchParams.fromAddress" placeholder="发送地址（模糊匹配）" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最小金额">
        <a-input-number v-model="searchParams.minAmount" placeholder="最小金额" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="最大金额">
        <a-input-number v-model="searchParams.maxAmount" placeholder="最大金额" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="起始区块号">
        <a-input-number v-model="searchParams.startBlock" placeholder="起始区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="结束区块号">
        <a-input-number v-model="searchParams.endBlock" placeholder="结束区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="页码">
        <a-input-number v-model="searchParams.page" :min="1" placeholder="页码" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="每页条数">
        <a-input-number v-model="searchParams.limit" :min="1" :max="100" placeholder="每页条数" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="排序">
        <a-select v-model="searchParams.sortBy" placeholder="选择排序字段" style="width: 120px;">
          <a-option value="timestamp">时间</a-option>
          <a-option value="amount">金额</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="排序方式">
        <a-select v-model="searchParams.order" placeholder="排序方式" style="width: 100px;">
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
      <a-form-item>
        <a-button type="outline" @click="showTokenListModal">目标地址列表</a-button>
      </a-form-item>
    </a-form>

    <!-- Quick Filter Presets -->
    <a-space style="margin: 12px 0;">
      <a-tag>快速筛选：</a-tag>
      <a-button size="small" @click="applyPreset('large')">大额交易 (≥10000 USDT)</a-button>
      <a-button size="small" @click="applyPreset('medium')">中额交易 (1000-10000 USDT)</a-button>
    </a-space>

    <a-space style="margin: 12px 0;">
      <a-button type="primary" size="small" @click="batchCopyFromAddresses">批量复制From地址</a-button>
      <a-button type="primary" size="small" @click="batchCopyToAddresses">批量复制To地址</a-button>
      <a-button type="primary" size="small" @click="exportToCSV">导出CSV</a-button>
    </a-space>

    <!-- Stats Summary -->
    <a-card v-if="receipts.length > 0" style="margin-bottom: 16px;">
      <a-descriptions title="数据概览" :column="4" size="small">
        <a-descriptions-item label="总记录数">{{ summary.count }}</a-descriptions-item>
        <a-descriptions-item label="总金额">{{ summary.total_amount }} USDT</a-descriptions-item>
        <a-descriptions-item label="平均金额">{{ summary.avg_amount }} USDT</a-descriptions-item>
        <a-descriptions-item label="选中条数">{{ selectedRowKeys.length }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-table
      :columns="columns"
      :data="receipts"
      :pagination="paginationConfig"
      @page-change="handlePageChange"
      row-key="tx_hash"
      style="margin-top: 20px"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
      :scroll="{ x: 1500 }"
    >
      <template #tx_hash="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/tx/${record.tx_hash}`" target="_blank">{{ shortHash(record.tx_hash) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.tx_hash)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #from_address="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/address/${record.from_address}`" target="_blank">{{ shortHash(record.from_address) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.from_address)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #to_address="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/address/${record.to_address}`" target="_blank">{{ shortHash(record.to_address) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.to_address)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #amount="{ record }">
        <a-tag :color="getAmountColor(record.amount)" size="medium">{{ record.amount }} USDT</a-tag>
      </template>
      <template #timestamp="{ record }">
        <span>{{ formatTime(record.timestamp) }}</span>
      </template>
      <template #block_number="{ record }">
        <a-link :href="`https://bscscan.com/block/${record.block_number}`" target="_blank">{{ record.block_number }}</a-link>
      </template>
    </a-table>

    <!-- BNB Target Address List Modal -->
    <a-modal
      v-model:visible="tokenModalVisible"
      title="BNB目标地址列表"
      :width="1000"
      @ok="tokenModalVisible = false"
      @cancel="tokenModalVisible = false"
      :footer="false"
    >
      <a-form layout="inline" :model="tokenSearchParams" style="margin-bottom: 16px;">
        <a-form-item label="搜索���址">
          <a-input v-model="tokenSearchParams.search" placeholder="输入地址关键字" style="width: 300px;" @change="fetchTokenList" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model="tokenSearchParams.status" placeholder="筛选状态" style="width: 150px;" @change="fetchTokenList">
            <a-option value="all">全部</a-option>
            <a-option value="received">已收款</a-option>
            <a-option value="pending">未收款</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetTokenSearch">重置</a-button>
        </a-form-item>
      </a-form>

      <a-space style="margin-bottom: 16px;">
        <a-tag color="blue">总地址数: {{ tokenPagination.total }}</a-tag>
        <a-tag color="green">已收款: {{ tokens.filter(t => t.usdt_count > 0).length }}</a-tag>
        <a-tag color="orange">未收款: {{ tokens.filter(t => t.usdt_count === 0).length }}</a-tag>
      </a-space>

      <a-table
        :columns="tokenColumns"
        :data="tokens"
        :pagination="tokenPaginationConfig"
        @page-change="handleTokenPageChange"
        row-key="address"
        :loading="tokenLoading"
      >
        <template #address="{ record }">
          <a-space>
            <a-link :href="`https://bscscan.com/address/${record.address}`" target="_blank">{{ shortHash(record.address) }}</a-link>
            <a-button type="text" size="mini" @click="copyToClipboard(record.address)">
              <icon-copy />
            </a-button>
            <a-button type="text" size="mini" @click="applyAddressFilter(record.address)">
              <icon-filter />
            </a-button>
          </a-space>
        </template>
        <template #bnb_amount="{ record }">
          <span>{{ record.bnb_amount }} BNB</span>
        </template>
        <template #usdt_count="{ record }">
          <a-tag :color="record.usdt_count > 0 ? 'green' : 'gray'" size="medium">{{ record.usdt_count }}</a-tag>
        </template>
        <template #created_at="{ record }">
          <span>{{ formatTime(record.created_at) }}</span>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconFilter } from '@arco-design/web-vue/es/icon'
import { getUsdtReceipts, getUsdtTargets } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

// Props
const props = defineProps<{
  fromAddress?: string
}>()

// Emit
const emit = defineEmits<{
  clearAddressFilter: []
}>()

// Search parameters
const searchParams = ref<{
  address: string
  fromAddress: string
  minAmount: number | undefined
  maxAmount: number | undefined
  startBlock: number | undefined
  endBlock: number | undefined
  page: number
  limit: number
  sortBy: string
  order: string
}>({
  address: '',
  fromAddress: '',
  minAmount: undefined,
  maxAmount: undefined,
  startBlock: undefined,
  endBlock: undefined,
  page: 1,
  limit: 20,
  sortBy: 'timestamp',
  order: 'desc',
})

// Watch fromAddress prop
watch(() => props.fromAddress, (newVal) => {
  if (newVal) {
    searchParams.value.fromAddress = newVal
    fetchData()
  }
}, { immediate: true })

// USDT receipts data
const receipts = ref<any[]>([])
const summary = ref({
  count: 0,
  total_amount: '0.00',
  avg_amount: '0.00',
})

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
})

// Table columns
const columns = [
  { title: '区块号', dataIndex: 'block_number', slotName: 'block_number', width: 120 },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash', width: 150 },
  { title: 'From地址', dataIndex: 'from_address', slotName: 'from_address', width: 150 },
  { title: 'To地址', dataIndex: 'to_address', slotName: 'to_address', width: 150 },
  { title: '金额', dataIndex: 'amount', slotName: 'amount', width: 150 },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp', width: 180 },
]

// Token modal
const tokenModalVisible = ref(false)
const tokenLoading = ref(false)
const tokens = ref<any[]>([])
const tokenSearchParams = ref({
  search: '',
  status: 'all',
  page: 1,
  limit: 20,
})
const tokenPagination = ref({
  total: 0,
  page: 1,
  limit: 20,
})
const tokenColumns = [
  { title: '地址', dataIndex: 'address', slotName: 'address', width: 250 },
  { title: 'BNB金额', dataIndex: 'bnb_amount', slotName: 'bnb_amount', width: 150 },
  { title: 'USDT次数', dataIndex: 'usdt_count', slotName: 'usdt_count', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', slotName: 'created_at', width: 180 },
]

// Utility functions
const shortHash = (val: string) => {
  if (!val) return ''
  return val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
}

const formatTime = (val: string) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}

const getAmountColor = (amount: string) => {
  const num = parseFloat(amount)
  if (num >= 10000) return 'red'
  if (num >= 5000) return 'orange'
  if (num >= 1000) return 'blue'
  return 'green'
}

// Fetch data
const fetchData = async () => {
  try {
    const params = { ...searchParams.value }
    Object.keys(params).forEach(key => {
      if (!params[key as keyof typeof params]) {
        delete params[key as keyof typeof params]
      }
    })

    const res: any = await getUsdtReceipts(params)
    if (res && res.code === 200) {
      receipts.value = res.data.data || []
      summary.value = res.data.summary || { count: 0, total_amount: '0.00', avg_amount: '0.00' }
      pagination.value = {
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
      }
      Message.success(`成功查询到 ${res.data.total} 条记录`)
    } else {
      Message.error(res?.message || '查询失败')
      receipts.value = []
    }
  } catch (e) {
    console.error('Query failed:', e)
    Message.error('查询失败，请检查网络连接')
  }
}

// Reset filters
const resetFilters = () => {
  searchParams.value = {
    address: '',
    fromAddress: '',
    minAmount: undefined,
    maxAmount: undefined,
    startBlock: undefined,
    endBlock: undefined,
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    order: 'desc',
  }
  receipts.value = []
  summary.value = {
    count: 0,
    total_amount: '0.00',
    avg_amount: '0.00',
  }
  emit('clearAddressFilter')
}

// Quick filter presets
const applyPreset = (preset: string) => {
  resetFilters()
  switch (preset) {
    case 'large':
      searchParams.value.minAmount = 10000
      Message.info('已应用大额交易筛选 (≥10000 USDT)')
      break
    case 'medium':
      searchParams.value.minAmount = 1000
      searchParams.value.maxAmount = 10000
      Message.info('已应用中额交易筛选 (1000-10000 USDT)')
      break
  }
  fetchData()
}

// Pagination
const paginationConfig = computed(() => ({
  total: pagination.value.total,
  current: pagination.value.page,
  pageSize: pagination.value.limit,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
}))

const handlePageChange = (page: number) => {
  searchParams.value.page = page
  fetchData()
}

// Multi-select
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// Batch copy
const batchCopyFromAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }
  const fromAddresses = receipts.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.from_address)
    .filter(Boolean)
  const uniqueAddresses = [...new Set(fromAddresses)]
  if (!uniqueAddresses.length) {
    Message.warning('没有可复制的From地址')
    return
  }
  const addresses = uniqueAddresses.join('\n')
  copyToClipboard(addresses, `已复制 ${uniqueAddresses.length} 个去重后的From地址`, '复制失败')
}

const batchCopyToAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }
  const toAddresses = receipts.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.to_address)
    .filter(Boolean)
  const uniqueAddresses = [...new Set(toAddresses)]
  if (!uniqueAddresses.length) {
    Message.warning('没有可复制的To地址')
    return
  }
  const addresses = uniqueAddresses.join('\n')
  copyToClipboard(addresses, `已复制 ${uniqueAddresses.length} 个去重后的To地址`, '复制失败')
}

// Export CSV
const exportToCSV = () => {
  if (!receipts.value.length) {
    Message.warning('没有可导出的数据')
    return
  }
  const headers = ['区块号', '交易哈希', 'From地址', 'To地址', '金额(USDT)', '时间']
  const csvContent = [
    headers.join(','),
    ...receipts.value.map(item => [
      item.block_number,
      item.tx_hash,
      item.from_address,
      item.to_address,
      item.amount,
      formatTime(item.timestamp)
    ].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `usdt_transfers_${dayjs().format('YYYYMMDD_HHmmss')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  Message.success('CSV文件已导出')
}

// Token list
const tokenPaginationConfig = computed(() => ({
  total: tokenPagination.value.total,
  current: tokenPagination.value.page,
  pageSize: tokenPagination.value.limit,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
}))

const handleTokenPageChange = (page: number) => {
  tokenSearchParams.value.page = page
  fetchTokenList()
}

const fetchTokenList = async () => {
  tokenLoading.value = true
  try {
    const params = { ...tokenSearchParams.value }
    Object.keys(params).forEach(key => {
      if (!params[key as keyof typeof params] || params[key as keyof typeof params] === 'all') {
        delete params[key as keyof typeof params]
      }
    })
    const res: any = await getUsdtTargets(params)
    if (res && res.code === 200) {
      tokens.value = res.data.data || []
      tokenPagination.value = {
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
      }
      Message.success(`成功加载 ${res.data.total} 个地址`)
    } else {
      Message.error(res?.message || '加载地址列表失败')
      tokens.value = []
    }
  } catch (e) {
    console.error('Load token list failed:', e)
    Message.error('加载地址列表失败，请检查网络连接')
  } finally {
    tokenLoading.value = false
  }
}

const resetTokenSearch = () => {
  tokenSearchParams.value = {
    search: '',
    status: 'all',
    page: 1,
    limit: 20,
  }
  fetchTokenList()
}

const applyAddressFilter = (address: string) => {
  searchParams.value.address = address
  tokenModalVisible.value = false
  fetchData()
  Message.info(`已应用地址筛选: ${shortHash(address)}`)
}

const showTokenListModal = async () => {
  tokenModalVisible.value = true
  fetchTokenList()
}
</script>
