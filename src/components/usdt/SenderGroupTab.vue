<template>
  <div>
    <!-- Filter Section -->
    <a-card title="🔍 筛选条件" :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="groupFilters">
        <!-- Time Range -->
        <a-form-item label="时间范围">
          <a-range-picker
            v-model="groupFilters.timeRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 400px;"
            @change="handleTimeRangeChange"
          />
        </a-form-item>

        <!-- Block Range (Recommended) -->
        <a-form-item label="区块号范围" tooltip="更精确的查询方式，推荐使用">
          <a-input-number
            v-model="groupFilters.startBlock"
            placeholder="起始区块号"
            style="width: 150px;"
            :min="0"
          />
          <span style="margin: 0 8px;">~</span>
          <a-input-number
            v-model="groupFilters.endBlock"
            placeholder="结束区块号"
            style="width: 150px;"
            :min="0"
          />
        </a-form-item>

        <!-- Amount Range (Record Level) -->
        <a-form-item label="单笔金额">
          <a-input-number
            v-model="groupFilters.minAmount"
            placeholder="最小金额"
            style="width: 120px;"
            :min="0"
          />
          <span style="margin: 0 8px;">~</span>
          <a-input-number
            v-model="groupFilters.maxAmount"
            placeholder="最大金额"
            style="width: 120px;"
            :min="0"
          />
          <span style="margin-left: 8px;">USDT</span>
        </a-form-item>

        <!-- Min TX Count (Group Level) -->
        <a-form-item label="最少转账次数">
          <a-input-number
            v-model="groupFilters.minTxCount"
            placeholder="最少次数"
            style="width: 120px;"
            :min="1"
          />
          <span style="margin-left: 8px;">笔</span>
        </a-form-item>

        <!-- Total Amount Range (Group Level) -->
        <a-form-item label="总金额范围">
          <a-input-number
            v-model="groupFilters.minTotalAmount"
            placeholder="最小总金额"
            style="width: 130px;"
            :min="0"
          />
          <span style="margin: 0 8px;">~</span>
          <a-input-number
            v-model="groupFilters.maxTotalAmount"
            placeholder="最大总金额"
            style="width: 130px;"
            :min="0"
          />
          <span style="margin-left: 8px;">USDT</span>
        </a-form-item>

        <!-- To Address -->
        <a-form-item label="接收地址" tooltip="筛选转给特定地址的交易">
          <a-input
            v-model="groupFilters.toAddress"
            placeholder="0x..."
            style="width: 300px;"
          />
        </a-form-item>

        <!-- Sort -->
        <a-form-item label="排序">
          <a-select v-model="groupFilters.sortBy" style="width: 140px;">
            <a-option value="tx_count">转账次数</a-option>
            <a-option value="total_amount">总金额</a-option>
            <a-option value="last_tx_time">最近转账时间</a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="排序方式">
          <a-select v-model="groupFilters.order" style="width: 100px;">
            <a-option value="desc">降序</a-option>
            <a-option value="asc">升序</a-option>
          </a-select>
        </a-form-item>

        <!-- Actions -->
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="fetchSenderGroups">
              <template #icon><icon-search /></template>
              查询
            </a-button>
            <a-button @click="resetFilters">
              <template #icon><icon-refresh /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- Quick Presets -->
      <a-space style="margin-top: 12px;">
        <a-tag>快速筛选：</a-tag>
        <a-button size="small" @click="applyPreset('highFrequency')">高频用户 (≥10次)</a-button>
        <a-button size="small" @click="applyPreset('largeAmount')">大额用户 (总额≥10万)</a-button>
        <a-button size="small" @click="applyPreset('recent7days')">近7天活跃</a-button>
      </a-space>

      <!-- Blacklist Management Section -->
      <a-divider style="margin: 16px 0;" />
      <div>
        <a-space style="margin-bottom: 8px;" align="center">
          <a-tag color="blue" size="large">
            <template #icon><icon-exclamation-circle /></template>
            黑名单管理
          </a-tag>
          <a-tag v-if="selectedRowKeys.length > 0" color="orange" size="large">
            已选中 <strong>{{ selectedRowKeys.length }}</strong> 个发送者地址
          </a-tag>
          <span v-else style="color: #999; font-size: 14px;">请在下方表格中选择要加入黑名单的地址</span>
        </a-space>
        <a-space>
          <a-button
            type="primary"
            status="danger"
            :disabled="selectedRowKeys.length === 0"
            @click="showAddBlacklistModal"
          >
            <template #icon><icon-close-circle /></template>
            加入黑名单
          </a-button>
          <a-button type="outline" @click="showBlacklistManager">
            <template #icon><icon-list /></template>
            查看黑名单 <a-badge v-if="blacklistCount > 0" :count="blacklistCount" />
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- Statistics Summary -->
    <a-card v-if="senderGroups.length > 0" style="margin-bottom: 16px;">
      <a-descriptions title="📊 统计概览" :column="3" size="small">
        <a-descriptions-item label="发送者总数">{{ pagination.total }}</a-descriptions-item>
        <a-descriptions-item label="当前页数">{{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.limit) }}</a-descriptions-item>
        <a-descriptions-item label="每页显示">{{ pagination.limit }} 条</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- Sender Group Table -->
    <a-table
      :columns="senderColumns"
      :data="senderGroups"
      :pagination="paginationConfig"
      @page-change="handlePageChange"
      row-key="from_address"
      :loading="loading"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
      :scroll="{ x: 1500 }"
      style="margin-top: 20px"
    >
      <template #from_address="{ record }">
        <a-space>
          <a-link
            :href="`https://bscscan.com/address/${record.from_address}`"
            target="_blank"
          >
            {{ shortHash(record.from_address) }}
          </a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.from_address)">
            <icon-copy />
          </a-button>
          <a-tooltip content="查看该发送者的交易详情">
            <a-button type="text" size="mini" @click="showSenderDetails(record)">
              <icon-eye />
            </a-button>
          </a-tooltip>
        </a-space>
      </template>

      <template #tx_count="{ record }">
        <a-tag color="blue" size="large">{{ record.tx_count }} 笔</a-tag>
      </template>

      <template #total_amount="{ record }">
        <a-tag :color="getTotalAmountColor(record.total_amount)" size="large">
          {{ formatAmount(record.total_amount) }} USDT
        </a-tag>
      </template>

      <template #avg_amount="{ record }">
        <span>{{ formatAmount(record.avg_amount) }} USDT</span>
      </template>

      <template #amount_range="{ record }">
        <span>{{ formatAmount(record.min_amount) }} ~ {{ formatAmount(record.max_amount) }}</span>
      </template>

      <template #time_range="{ record }">
        <a-space direction="vertical" size="mini">
          <span style="font-size: 12px; color: #999;">首次: {{ formatTime(record.first_tx_time) }}</span>
          <span style="font-size: 12px;">最近: {{ formatRelativeTime(record.last_tx_time) }}</span>
        </a-space>
      </template>

      <template #unique_receivers="{ record }">
        <a-tag color="green">{{ record.unique_receivers }} 个</a-tag>
      </template>

      <template #actions="{ record }">
        <a-button type="primary" size="small" @click="showSenderDetails(record)">
          查看详情
        </a-button>
      </template>
    </a-table>

    <!-- Sender Details Drawer -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="📋 交易详情"
      :width="900"
      :footer="false"
      unmountOnClose
    >
      <template #title>
        <a-space>
          <span>📋 交易详情</span>
          <a-button size="mini" type="text" @click="exportSenderDetails">
            <icon-download />
            导出CSV
          </a-button>
        </a-space>
      </template>

      <!-- Sender Info -->
      <a-card v-if="selectedSender" style="margin-bottom: 16px;" :bordered="false">
        <a-descriptions title="📌 发送者信息" :column="2" size="small">
          <a-descriptions-item label="地址">
            <a-space>
              <span style="font-family: monospace;">{{ selectedSender.from_address }}</span>
              <a-button type="text" size="mini" @click="copyToClipboard(selectedSender.from_address)">
                <icon-copy />
              </a-button>
              <a-link
                :href="`https://bscscan.com/address/${selectedSender.from_address}`"
                target="_blank"
              >
                在BSCScan查看
              </a-link>
            </a-space>
          </a-descriptions-item>
        </a-descriptions>

        <a-descriptions title="📊 统计概览（基于当前筛选条件）" :column="4" size="small" style="margin-top: 16px;">
          <a-descriptions-item label="转账次数">{{ selectedSender.tx_count }} 笔</a-descriptions-item>
          <a-descriptions-item label="总金额">{{ formatAmount(selectedSender.total_amount) }} USDT</a-descriptions-item>
          <a-descriptions-item label="平均金额">{{ formatAmount(selectedSender.avg_amount) }} USDT</a-descriptions-item>
          <a-descriptions-item label="接收者数">{{ selectedSender.unique_receivers }} 个</a-descriptions-item>
        </a-descriptions>

        <a-alert v-if="appliedFiltersText" type="info" style="margin-top: 12px;">
          💡 提示: 当前显示的交易已应用筛选条件 ({{ appliedFiltersText }})
        </a-alert>
      </a-card>

      <!-- Transaction Details Table -->
      <a-table
        :columns="detailColumns"
        :data="senderDetails"
        :pagination="detailPaginationConfig"
        @page-change="handleDetailPageChange"
        row-key="tx_hash"
        :loading="detailLoading"
        :scroll="{ x: 800 }"
        size="small"
      >
        <template #tx_hash="{ record }">
          <a-space>
            <a-link :href="`https://bscscan.com/tx/${record.tx_hash}`" target="_blank">
              {{ shortHash(record.tx_hash) }}
            </a-link>
            <a-button type="text" size="mini" @click="copyToClipboard(record.tx_hash)">
              <icon-copy />
            </a-button>
          </a-space>
        </template>

        <template #to_address="{ record }">
          <a-space>
            <a-link :href="`https://bscscan.com/address/${record.to_address}`" target="_blank">
              {{ shortHash(record.to_address) }}
            </a-link>
            <a-button type="text" size="mini" @click="copyToClipboard(record.to_address)">
              <icon-copy />
            </a-button>
          </a-space>
        </template>

        <template #amount="{ record }">
          <a-tag :color="getAmountColor(record.amount)">{{ record.amount }} USDT</a-tag>
        </template>

        <template #timestamp="{ record }">
          <span style="font-size: 12px;">{{ formatTime(record.timestamp) }}</span>
        </template>
      </a-table>
    </a-drawer>

    <!-- Blacklist Manager Modal -->
    <BlacklistManagerModal
      v-model="blacklistModalVisible"
      @removed="handleBlacklistRemoved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconSearch,
  IconRefresh,
  IconCopy,
  IconEye,
  IconDownload,
  IconExclamationCircle,
  IconCloseCircle,
  IconList,
} from '@arco-design/web-vue/es/icon'
import { getUsdtSenderGroupStats, getUsdtReceipts, addBlacklistAddresses, getBlacklist } from '@/api/monitor.ts'
import BlacklistManagerModal from './BlacklistManagerModal.vue'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// Group filters (both record-level and group-level)
const groupFilters = ref<{
  // Record-level filters (will be inherited by detail view)
  minAmount: number | undefined
  maxAmount: number | undefined
  startTime: string | undefined
  endTime: string | undefined
  startBlock: number | undefined
  endBlock: number | undefined
  toAddress: string | undefined
  timeRange: [string, string] | undefined
  // Group-level filters (only for group list)
  minTxCount: number | undefined
  minTotalAmount: number | undefined
  maxTotalAmount: number | undefined
  sortBy: string
  order: string
  page: number
  limit: number
}>({
  minAmount: undefined,
  maxAmount: undefined,
  startTime: undefined,
  endTime: undefined,
  startBlock: undefined,
  endBlock: undefined,
  toAddress: undefined,
  timeRange: undefined,
  minTxCount: undefined,
  minTotalAmount: undefined,
  maxTotalAmount: undefined,
  sortBy: 'tx_count',
  order: 'desc',
  page: 1,
  limit: 20,
})

// Applied filters (returned from backend, used for detail view)
const appliedFilters = ref<any>({})

// Sender groups data
const senderGroups = ref<any[]>([])
const loading = ref(false)

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
})

// Sender columns
const senderColumns = [
  {
    title: '发送者地址',
    dataIndex: 'from_address',
    slotName: 'from_address',
    width: 180,
    fixed: 'left',
  },
  {
    title: '转账次数',
    dataIndex: 'tx_count',
    slotName: 'tx_count',
    width: 120,
    sortable: { sortDirections: ['ascend', 'descend'] },
  },
  {
    title: '总金额',
    dataIndex: 'total_amount',
    slotName: 'total_amount',
    width: 150,
    sortable: { sortDirections: ['ascend', 'descend'] },
  },
  {
    title: '平均金额',
    dataIndex: 'avg_amount',
    slotName: 'avg_amount',
    width: 130,
  },
  {
    title: '金额范围',
    slotName: 'amount_range',
    width: 180,
  },
  {
    title: '时间范围',
    slotName: 'time_range',
    width: 200,
  },
  {
    title: '接收者数',
    dataIndex: 'unique_receivers',
    slotName: 'unique_receivers',
    width: 110,
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 120,
    fixed: 'right',
  },
]

// Detail drawer
const drawerVisible = ref(false)
const selectedSender = ref<any>(null)
const senderDetails = ref<any[]>([])
const detailLoading = ref(false)
const detailPagination = ref({
  total: 0,
  page: 1,
  limit: 20,
})

// Detail columns
const detailColumns = [
  {
    title: '交易哈希',
    dataIndex: 'tx_hash',
    slotName: 'tx_hash',
    width: 150,
  },
  {
    title: '接收地址',
    dataIndex: 'to_address',
    slotName: 'to_address',
    width: 150,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    slotName: 'amount',
    width: 120,
  },
  {
    title: '时间',
    dataIndex: 'timestamp',
    slotName: 'timestamp',
    width: 150,
  },
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

const formatRelativeTime = (val: string) => {
  if (!val) return ''
  return dayjs(val).fromNow()
}

const formatAmount = (val: string | number) => {
  if (!val) return '0.00'
  const num = typeof val === 'string' ? parseFloat(val) : val
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getTotalAmountColor = (amount: string) => {
  const num = parseFloat(amount)
  if (num >= 100000) return 'red'
  if (num >= 50000) return 'orange'
  if (num >= 10000) return 'blue'
  return 'green'
}

const getAmountColor = (amount: string) => {
  const num = parseFloat(amount)
  if (num >= 10000) return 'red'
  if (num >= 5000) return 'orange'
  if (num >= 1000) return 'blue'
  return 'green'
}

// Handle time range change
const handleTimeRangeChange = (dateStrings: [string, string] | undefined) => {
  if (dateStrings && dateStrings.length === 2) {
    groupFilters.value.startTime = dateStrings[0]
    groupFilters.value.endTime = dateStrings[1]
  } else {
    groupFilters.value.startTime = undefined
    groupFilters.value.endTime = undefined
  }
}

// Fetch sender groups
const fetchSenderGroups = async () => {
  loading.value = true
  try {
    const params: any = {
      page: groupFilters.value.page,
      limit: groupFilters.value.limit,
      sortBy: groupFilters.value.sortBy,
      order: groupFilters.value.order,
    }

    // Record-level filters
    if (groupFilters.value.minAmount) params.minAmount = groupFilters.value.minAmount
    if (groupFilters.value.maxAmount) params.maxAmount = groupFilters.value.maxAmount
    if (groupFilters.value.startTime) params.startTime = groupFilters.value.startTime
    if (groupFilters.value.endTime) params.endTime = groupFilters.value.endTime
    if (groupFilters.value.startBlock) params.startBlock = groupFilters.value.startBlock
    if (groupFilters.value.endBlock) params.endBlock = groupFilters.value.endBlock
    if (groupFilters.value.toAddress) params.toAddress = groupFilters.value.toAddress

    // Group-level filters
    if (groupFilters.value.minTxCount) params.minTxCount = groupFilters.value.minTxCount
    if (groupFilters.value.minTotalAmount) params.minTotalAmount = groupFilters.value.minTotalAmount
    if (groupFilters.value.maxTotalAmount) params.maxTotalAmount = groupFilters.value.maxTotalAmount

    const res: any = await getUsdtSenderGroupStats(params)

    if (res && res.code === 200) {
      senderGroups.value = res.data.data || []
      pagination.value = {
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
      }

      // Save applied filters from backend response
      appliedFilters.value = res.data.filters || {}

      Message.success(`成功查询到 ${res.data.total} 个发送者`)
    } else {
      Message.error(res?.message || '查询失败')
      senderGroups.value = []
    }
  } catch (e) {
    console.error('Query failed:', e)
    Message.error('查询失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// Reset filters
const resetFilters = () => {
  groupFilters.value = {
    minAmount: undefined,
    maxAmount: undefined,
    startTime: undefined,
    endTime: undefined,
    startBlock: undefined,
    endBlock: undefined,
    toAddress: undefined,
    timeRange: undefined,
    minTxCount: undefined,
    minTotalAmount: undefined,
    maxTotalAmount: undefined,
    sortBy: 'tx_count',
    order: 'desc',
    page: 1,
    limit: 20,
  }
  senderGroups.value = []
  appliedFilters.value = {}
}

// Quick presets
const applyPreset = (preset: string) => {
  resetFilters()
  switch (preset) {
    case 'highFrequency':
      groupFilters.value.minTxCount = 10
      Message.info('已应用高频用户筛选 (≥10次)')
      break
    case 'largeAmount':
      groupFilters.value.minTotalAmount = 100000
      Message.info('已应用大额用户筛选 (总额≥10万)')
      break
    case 'recent7days':
      groupFilters.value.startTime = dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss')
      groupFilters.value.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      groupFilters.value.timeRange = [groupFilters.value.startTime, groupFilters.value.endTime]
      Message.info('已应用近7天活跃筛选')
      break
  }
  fetchSenderGroups()
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
  groupFilters.value.page = page
  pagination.value.page = page
  fetchSenderGroups()
}

// Show sender details drawer
const showSenderDetails = async (sender: any) => {
  selectedSender.value = sender
  drawerVisible.value = true
  detailPagination.value.page = 1
  await fetchSenderDetails()
}

// Fetch sender details (inherit filters from group query)
const fetchSenderDetails = async () => {
  if (!selectedSender.value) return

  detailLoading.value = true
  try {
    const params: any = {
      fromAddress: selectedSender.value.from_address,
      page: detailPagination.value.page,
      limit: detailPagination.value.limit,
      sortBy: 'timestamp',
      order: 'desc',
      // Inherit record-level filters from appliedFilters
      ...appliedFilters.value,
    }

    const res: any = await getUsdtReceipts(params)

    if (res && res.code === 200) {
      senderDetails.value = res.data.data || []
      detailPagination.value = {
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
      }

      // Verify data consistency
      if (res.data.total !== selectedSender.value.tx_count) {
        console.warn(
          `Data inconsistency: detail total (${res.data.total}) != group tx_count (${selectedSender.value.tx_count})`
        )
      }
    } else {
      Message.error(res?.message || '加载详情失败')
      senderDetails.value = []
    }
  } catch (e) {
    console.error('Load details failed:', e)
    Message.error('加载详情失败，请检查网络连接')
  } finally {
    detailLoading.value = false
  }
}

// Detail pagination
const detailPaginationConfig = computed(() => ({
  total: detailPagination.value.total,
  current: detailPagination.value.page,
  pageSize: detailPagination.value.limit,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
}))

// Row selection for blacklist management
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// Blacklist management
const blacklistModalVisible = ref(false)
const blacklistCount = ref(0)

// Fetch blacklist count
const fetchBlacklistCount = async () => {
  try {
    const res: any = await getBlacklist({ page: 1, limit: 1 })
    if (res && res.code === 200) {
      blacklistCount.value = res.data.total || 0
    }
  } catch (e) {
    console.error('Fetch blacklist count failed:', e)
  }
}

// Show add to blacklist confirmation modal
const showAddBlacklistModal = () => {
  const selectedAddresses = senderGroups.value
    .filter(item => selectedRowKeys.value.includes(item.from_address))
    .map(item => item.from_address)

  if (selectedAddresses.length === 0) {
    Message.warning('请先选择要加入黑名单的地址')
    return
  }

  Modal.confirm({
    title: '确认加入黑名单',
    content: `确定要将选中的 ${selectedAddresses.length} 个发送者地址加入黑名单吗？加入后这些地址将不再出现在统计列表中。`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      const loadingMsg = Message.loading(`正在添加 ${selectedAddresses.length} 个地址到黑名单...`)
      try {
        const res: any = await addBlacklistAddresses({
          addresses: selectedAddresses,
          reason: '手动从发送者统计添加',
          created_by: 'admin',
        })

        if (res && res.code === 200) {
          Message.success(`成功添加 ${res.data.added_count} 个地址到黑名单`)
          selectedRowKeys.value = []
          await fetchSenderGroups()
          await fetchBlacklistCount()
        } else {
          Message.error(res?.message || '添加黑名单失败')
        }
      } catch (e) {
        console.error('Add to blacklist failed:', e)
        Message.error('添加黑名单失败，请检查网络连接')
      } finally {
        loadingMsg.close()
      }
    },
  })
}

// Show blacklist manager modal
const showBlacklistManager = () => {
  blacklistModalVisible.value = true
}

// Handle blacklist removed event
const handleBlacklistRemoved = async () => {
  await fetchSenderGroups()
  await fetchBlacklistCount()
  Message.success('黑名单已更新，列表已刷新')
}

// Initialize blacklist count on component mount
fetchBlacklistCount()

const handleDetailPageChange = (page: number) => {
  detailPagination.value.page = page
  fetchSenderDetails()
}

// Applied filters text (for user info)
const appliedFiltersText = computed(() => {
  const parts: string[] = []
  if (appliedFilters.value.minAmount || appliedFilters.value.maxAmount) {
    const min = appliedFilters.value.minAmount || '0'
    const max = appliedFilters.value.maxAmount || '∞'
    parts.push(`单笔金额 ${min}-${max}`)
  }
  if (appliedFilters.value.startTime && appliedFilters.value.endTime) {
    const start = dayjs(appliedFilters.value.startTime).format('MM/DD')
    const end = dayjs(appliedFilters.value.endTime).format('MM/DD')
    parts.push(`时间 ${start}-${end}`)
  }
  if (appliedFilters.value.startBlock && appliedFilters.value.endBlock) {
    parts.push(`区块 ${appliedFilters.value.startBlock}-${appliedFilters.value.endBlock}`)
  }
  if (appliedFilters.value.toAddress) {
    parts.push(`接收地址 ${shortHash(appliedFilters.value.toAddress)}`)
  }
  return parts.join(', ')
})

// Export sender details to CSV
const exportSenderDetails = () => {
  if (!senderDetails.value.length) {
    Message.warning('没有可导出的数据')
    return
  }

  const headers = ['交易哈希', 'From地址', 'To地址', '金额(USDT)', '时间']
  const csvContent = [
    headers.join(','),
    ...senderDetails.value.map(item => [
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
  link.setAttribute(
    'download',
    `sender_${shortHash(selectedSender.value.from_address)}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  Message.success('CSV文件已导出')
}
</script>
