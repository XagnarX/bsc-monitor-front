<template>
  <div class="token-filter-analysis">
    <!-- 合约地址输入 -->
    <a-form layout="inline" :model="searchParams" style="margin-bottom: 20px;">
      <a-form-item label="合约地址">
        <a-input v-model="searchParams.contractAddress" placeholder="输入Token合约地址" style="width: 400px;" />
      </a-form-item>
    </a-form>

    <!-- 筛选条件 -->
    <a-form layout="inline" :model="searchParams" style="margin-bottom: 20px;">
      <a-form-item label="起始区块">
        <a-input-number v-model="searchParams.startBlock" placeholder="起始区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="终止区块">
        <a-input-number v-model="searchParams.endBlock" placeholder="终止区块号" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="最小金额">
        <a-input-number v-model="searchParams.minAmount" placeholder="最小金额" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="最大金额">
        <a-input-number v-model="searchParams.maxAmount" placeholder="最大金额" style="width: 150px;" />
      </a-form-item>
      <a-form-item label="decimals">
        <a-input-number v-model="searchParams.decimals" :min="0" :max="36" placeholder="精度" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="显示条数">
        <a-input-number v-model="searchParams.limit" :min="1" placeholder="显示条数" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="刷新时间(秒)">
        <a-input-number v-model="refreshInterval" :min="1" placeholder="刷新间隔" style="width: 120px;" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="togglePolling">
          {{ getPollingButtonText() }}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 批量操作按钮 -->
    <a-space style="margin: 12px 0;">
      <a-button :type="currentView === 'all' ? 'primary' : 'secondary'" size="small" @click="viewAllData">查看全部数据</a-button>
    </a-space>

    <!-- 买入地址筛选 -->
    <a-card style="margin-bottom: 16px;">
      <template #title>
        买入地址筛选
      </template>
      <template #extra>
        <a-space>
          <a-tag color="green" size="large">买入总量 (正): {{ buyTotalAmount }} +数量</a-tag>
          <a-button type="primary" size="small" @click="fetchAllBuyAddresses">查询全部买入</a-button>
        </a-space>
      </template>

      <a-space direction="vertical" style="width: 100%;">
        <div v-for="(pair, index) in buyAddresses" :key="`buy-${index}`" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <a-input v-model="pair.from" placeholder="FROM地址" style="flex: 1;" />
          <a-input v-model="pair.to" placeholder="TO地址" style="flex: 1;" />
          <a-button
            @click="viewRowData('buy', index)"
            :type="currentView === `buy-${index}` ? 'primary' : 'secondary'"
            size="small"
          >
            {{ pair.loading ? 'Loading...' : 'Query & View' }}
          </a-button>
          <a-button @click="removeBuyAddress(index)" v-if="buyAddresses.length > 1" status="danger" size="small">删除</a-button>
        </div>
        <a-button @click="addBuyAddress" type="dashed" block>
          <icon-plus /> 添加买入地址
        </a-button>
      </a-space>
    </a-card>

    <!-- 卖出地址筛选 -->
    <a-card style="margin-bottom: 16px;">
      <template #title>
        卖出地址筛选
      </template>
      <template #extra>
        <a-space>
          <a-tag color="red" size="large">卖出总量 (负): {{ sellTotalAmount }} -数量</a-tag>
          <a-button type="primary" size="small" @click="fetchAllSellAddresses">查询全部卖出</a-button>
        </a-space>
      </template>

      <a-space direction="vertical" style="width: 100%;">
        <div v-for="(pair, index) in sellAddresses" :key="`sell-${index}`" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <a-input v-model="pair.from" placeholder="FROM地址" style="flex: 1;" />
          <a-input v-model="pair.to" placeholder="TO地址" style="flex: 1;" />
          <a-button
            @click="viewRowData('sell', index)"
            :type="currentView === `sell-${index}` ? 'primary' : 'secondary'"
            size="small"
          >
            {{ pair.loading ? 'Loading...' : 'Query & View' }}
          </a-button>
          <a-button @click="removeSellAddress(index)" v-if="sellAddresses.length > 1" status="danger" size="small">删除</a-button>
        </div>
        <a-button @click="addSellAddress" type="dashed" block>
          <icon-plus /> 添加卖出地址
        </a-button>
      </a-space>
    </a-card>

    <!-- 综合汇总 -->
    <a-card>
      <a-descriptions :column="1" size="small">
        <a-descriptions-item label="净流入/流出">
          <a-tag :color="netAmount >= 0 ? 'green' : 'red'" size="large">
            {{ netAmount >= 0 ? '+' : '' }}{{ netAmountDisplay }} - 总计
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 交易列表 -->
    <a-table
      v-if="transactions.length > 0"
      :columns="columns"
      :data="transactions"
      :pagination="false"
      row-key="tx_hash"
      style="margin-top: 20px"
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
          <template v-if="record.from_address_tag">
            <a-tag color="blue" size="small">
              {{ record.from_address_tag }}
            </a-tag>
          </template>
          <template v-else>
            <a-link :href="`https://bscscan.com/address/${record.from_address}`" target="_blank">{{ shortHash(record.from_address) }}</a-link>
          </template>
          <a-button type="text" size="mini" @click="copyToClipboard(record.from_address)">
            <icon-copy />
          </a-button>
          <a-button type="text" size="mini" @click="showTagModal(record.from_address)">
            <icon-tag />
          </a-button>
          <a-button type="text" size="mini" @click="showRecordDetail(record, 'from')">
            <icon-eye />
          </a-button>
        </a-space>
      </template>
      <template #to_address="{ record }">
        <a-space>
          <template v-if="record.to_address_tag">
            <a-tag color="blue" size="small">
              {{ record.to_address_tag }}
            </a-tag>
          </template>
          <template v-else>
            <a-link :href="`https://bscscan.com/address/${record.to_address}`" target="_blank">{{ shortHash(record.to_address) }}</a-link>
          </template>
          <a-button type="text" size="mini" @click="copyToClipboard(record.to_address)">
            <icon-copy />
          </a-button>
          <a-button type="text" size="mini" @click="showRecordDetail(record, 'to')">
            <icon-eye />
          </a-button>
        </a-space>
      </template>
      <template #contract_address="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/token/${record.contract_address}`" target="_blank">{{ shortHash(record.contract_address) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.contract_address)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #amount="{ record }">
        <a-tag :color="record.type === 'buy' ? 'green' : 'red'">
          {{ formatAmount(record.amount) }}
        </a-tag>
      </template>
      <template #timestamp="{ record }">
        <span>{{ formatTime(record.timestamp) }}</span>
      </template>
    </a-table>

    <!-- 地址标签管理模态框 -->
    <a-modal v-model:visible="tagModalVisible" title="地址标签管理" width="800px" @ok="handleTagModalOk" @cancel="handleTagModalCancel">
      <div style="margin-bottom: 16px;">
        <strong>地址：</strong> {{ currentAddress }}
      </div>

      <!-- 添加标签 -->
      <div style="margin-bottom: 16px;">
        <strong>添加标签：</strong>
        <a-form :model="tagForm" layout="vertical" style="margin-top: 8px;">
          <a-form-item label="标签名">
            <a-auto-complete v-model="tagForm.tag" :data="uniqueTags" placeholder="输入标签名" allow-clear />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model="tagForm.description" placeholder="输入标签描述（可选）" :rows="2" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="addTag" :loading="tagLoading">添加标签</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 已有标签列表 -->
      <div>
        <strong>已有标签：</strong>
        <div style="margin-top: 8px;">
          <template v-if="currentAddressTags.length > 0">
            <div v-for="tag in currentAddressTags" :key="tag.tag" style="margin-bottom: 8px; padding: 8px; border: 1px solid #e8e8e8; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>{{ tag.tag }}</strong>
                  <div v-if="tag.description" style="color: #666; font-size: 12px; margin-top: 4px;">{{ tag.description }}</div>
                </div>
                <a-button type="text" status="danger" size="mini" @click="removeTag(tag)">
                  <icon-delete />
                </a-button>
              </div>
            </div>
          </template>
          <template v-else>
            <a-empty description="暂无标签" />
          </template>
        </div>
      </div>
    </a-modal>

    <!-- 记录详情模态框 -->
    <a-modal v-model:visible="detailModalVisible" title="记录详情" width="1000px" @ok="handleDetailModalOk" @cancel="handleDetailModalCancel">
      <div v-if="currentDetailRecord">
        <a-descriptions :column="2" size="small" style="margin-bottom: 20px;">
          <a-descriptions-item label="区块号">
            {{ currentDetailRecord.block_number }}
          </a-descriptions-item>
          <a-descriptions-item label="交易类型">
            <a-tag :color="currentDetailRecord.type === 'buy' ? 'green' : 'red'">
              {{ currentDetailRecord.type === 'buy' ? '买入' : '卖出' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="From地址">
            <a-link :href="`https://bscscan.com/address/${currentDetailRecord.from_address}`" target="_blank">
              {{ currentDetailRecord.from_address }}
            </a-link>
          </a-descriptions-item>
          <a-descriptions-item label="To地址">
            <a-link :href="`https://bscscan.com/address/${currentDetailRecord.to_address}`" target="_blank">
              {{ currentDetailRecord.to_address }}
            </a-link>
          </a-descriptions-item>
          <a-descriptions-item label="代币合约">
            <a-link :href="`https://bscscan.com/token/${currentDetailRecord.contract_address}`" target="_blank">
              {{ currentDetailRecord.contract_address }}
            </a-link>
          </a-descriptions-item>
          <a-descriptions-item label="数量">
            <a-tag :color="currentDetailRecord.type === 'buy' ? 'green' : 'red'">
              {{ formatAmount(currentDetailRecord.amount) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="交易哈希">
            <a-link :href="`https://bscscan.com/tx/${currentDetailRecord.tx_hash}`" target="_blank">
              {{ currentDetailRecord.tx_hash }}
            </a-link>
          </a-descriptions-item>
          <a-descriptions-item label="时间">
            {{ formatTime(currentDetailRecord.timestamp) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>相似记录</a-divider>
        <div v-if="similarRecords.length > 0">
          <a-table
            :columns="detailColumns"
            :data="similarRecords"
            :pagination="{ pageSize: 10 }"
            row-key="tx_hash"
            size="small"
          >
            <template #tx_hash="{ record }">
              <a-link :href="`https://bscscan.com/tx/${record.tx_hash}`" target="_blank">{{ shortHash(record.tx_hash) }}</a-link>
            </template>
            <template #from_address="{ record }">
              <a-link :href="`https://bscscan.com/address/${record.from_address}`" target="_blank">{{ shortHash(record.from_address) }}</a-link>
            </template>
            <template #to_address="{ record }">
              <a-link :href="`https://bscscan.com/address/${record.to_address}`" target="_blank">{{ shortHash(record.to_address) }}</a-link>
            </template>
            <template #amount="{ record }">
              <a-tag :color="record.type === 'buy' ? 'green' : 'red'">
                {{ formatAmount(record.amount) }}
              </a-tag>
            </template>
            <template #timestamp="{ record }">
              <span>{{ formatTime(record.timestamp) }}</span>
            </template>
          </a-table>
        </div>
        <a-empty v-else description="暂无相似记录" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconPlus, IconDelete, IconTag, IconInfoCircle, IconEye } from '@arco-design/web-vue/es/icon'
import { addReceiverBlacklist, getAddressTags, addAddressTag, deleteAddressTag, getUniqueAddressTags, batchAddAddressTags, getTokenFilterAnalysisAggregate } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

// Address pair interface
interface AddressPair {
  from: string
  to: string
  data?: any[]  // Query result data for each row
  loading?: boolean  // Loading state
}

// Buy address list (default one row)
const buyAddresses = ref<AddressPair[]>([
  { from: '', to: '', data: [], loading: false }
])

// Sell address list (default one row)
const sellAddresses = ref<AddressPair[]>([
  { from: '', to: '', data: [], loading: false }
])

// 搜索参数
const searchParams = ref({
  contractAddress: '',
  startBlock: null as number | null,
  endBlock: null as number | null,
  minAmount: null as number | null,
  maxAmount: null as number | null,
  decimals: 18,
  limit: 100,
})

// 从 URL 参数初始化 searchParams
const initializeFromUrl = () => {
  const query = route.query
  if (query.contractAddress) searchParams.value.contractAddress = String(query.contractAddress)
  if (query.startBlock) searchParams.value.startBlock = parseInt(String(query.startBlock))
  if (query.endBlock) searchParams.value.endBlock = parseInt(String(query.endBlock))
  if (query.minAmount) searchParams.value.minAmount = parseFloat(String(query.minAmount))
  if (query.maxAmount) searchParams.value.maxAmount = parseFloat(String(query.maxAmount))
  if (query.decimals) searchParams.value.decimals = parseInt(String(query.decimals)) || 18
  if (query.limit) searchParams.value.limit = parseInt(String(query.limit)) || 100

  // 从 URL 初始化买入地址
  if (query.buyPairs) {
    try {
      const buyPairsStr = String(query.buyPairs)
      const buyPairsArray = JSON.parse(decodeURIComponent(buyPairsStr))
      if (Array.isArray(buyPairsArray) && buyPairsArray.length > 0) {
        buyAddresses.value = buyPairsArray.map(pair => ({
          from: pair.from || '',
          to: pair.to || '',
          data: []
        }))
      }
    } catch (e) {
      console.error('Parse buy address failed:', e)
    }
  }

  // 从 URL 初始化卖出地址
  if (query.sellPairs) {
    try {
      const sellPairsStr = String(query.sellPairs)
      const sellPairsArray = JSON.parse(decodeURIComponent(sellPairsStr))
      if (Array.isArray(sellPairsArray) && sellPairsArray.length > 0) {
        sellAddresses.value = sellPairsArray.map(pair => ({
          from: pair.from || '',
          to: pair.to || '',
          data: []
        }))
      }
    } catch (e) {
      console.error('Parse sell address failed:', e)
    }
  }
}

// 监听 searchParams 变化，更新 URL（避免无限循环）
let isUpdatingFromUrl = false
watch(searchParams, (newValue) => {
  if (isUpdatingFromUrl) return

  // 构建查询参数对象，包含所有非空值
  const query: Record<string, any> = {}
  if (newValue.contractAddress) query.contractAddress = newValue.contractAddress

  // 处理区块参数，包括 0 和空字符串
  if (newValue.startBlock !== null && newValue.startBlock !== undefined) {
    const startBlockStr = String(newValue.startBlock)
    if (startBlockStr !== '') {
      const startBlockNum = Number(startBlockStr)
      if (!isNaN(startBlockNum)) query.startBlock = startBlockNum
    }
  }
  if (newValue.endBlock !== null && newValue.endBlock !== undefined) {
    const endBlockStr = String(newValue.endBlock)
    if (endBlockStr !== '') {
      const endBlockNum = Number(endBlockStr)
      if (!isNaN(endBlockNum)) query.endBlock = endBlockNum
    }
  }

  // 处理金额参数，包括 0 和空字符串
  if (newValue.minAmount !== null && newValue.minAmount !== undefined) {
    const minAmountStr = String(newValue.minAmount)
    if (minAmountStr !== '') {
      const minAmountNum = Number(minAmountStr)
      if (!isNaN(minAmountNum)) query.minAmount = minAmountNum
    }
  }
  if (newValue.maxAmount !== null && newValue.maxAmount !== undefined) {
    const maxAmountStr = String(newValue.maxAmount)
    if (maxAmountStr !== '') {
      const maxAmountNum = Number(maxAmountStr)
      if (!isNaN(maxAmountNum)) query.maxAmount = maxAmountNum
    }
  }

  if (newValue.decimals !== undefined) query.decimals = newValue.decimals
  if (newValue.limit) query.limit = newValue.limit

  // 将地址对编码为 URL 参数
  if (buyAddresses.value.length > 0) {
    const buyPairsData = buyAddresses.value.map(pair => ({ from: pair.from, to: pair.to }))
    query.buyPairs = encodeURIComponent(JSON.stringify(buyPairsData))
  }
  if (sellAddresses.value.length > 0) {
    const sellPairsData = sellAddresses.value.map(pair => ({ from: pair.from, to: pair.to }))
    query.sellPairs = encodeURIComponent(JSON.stringify(sellPairsData))
  }

  console.log('更新 URL 参数:', query) // 调试日志

  // 更新 URL，不触发导航
  router.replace({ query }).catch(() => {})
}, { deep: true })

// 监听地址变化，更新 URL
watch([buyAddresses, sellAddresses], () => {
  if (isUpdatingFromUrl) return

  const query: Record<string, any> = {}
  if (searchParams.value.contractAddress) query.contractAddress = searchParams.value.contractAddress

  // 包含其他搜索参数，处理空字符串情况
  if (searchParams.value.startBlock !== null && searchParams.value.startBlock !== undefined) {
    const startBlockStr = String(searchParams.value.startBlock)
    if (startBlockStr !== '') {
      const startBlockNum = Number(startBlockStr)
      if (!isNaN(startBlockNum)) query.startBlock = startBlockNum
    }
  }
  if (searchParams.value.endBlock !== null && searchParams.value.endBlock !== undefined) {
    const endBlockStr = String(searchParams.value.endBlock)
    if (endBlockStr !== '') {
      const endBlockNum = Number(endBlockStr)
      if (!isNaN(endBlockNum)) query.endBlock = endBlockNum
    }
  }
  if (searchParams.value.minAmount !== null && searchParams.value.minAmount !== undefined) {
    const minAmountStr = String(searchParams.value.minAmount)
    if (minAmountStr !== '') {
      const minAmountNum = Number(minAmountStr)
      if (!isNaN(minAmountNum)) query.minAmount = minAmountNum
    }
  }
  if (searchParams.value.maxAmount !== null && searchParams.value.maxAmount !== undefined) {
    const maxAmountStr = String(searchParams.value.maxAmount)
    if (maxAmountStr !== '') {
      const maxAmountNum = Number(maxAmountStr)
      if (!isNaN(maxAmountNum)) query.maxAmount = maxAmountNum
    }
  }
  if (searchParams.value.decimals !== undefined) query.decimals = searchParams.value.decimals
  if (searchParams.value.limit) query.limit = searchParams.value.limit

  // 将地址对编码为 URL 参数
  if (buyAddresses.value.length > 0) {
    const buyPairsData = buyAddresses.value.map(pair => ({ from: pair.from, to: pair.to }))
    query.buyPairs = encodeURIComponent(JSON.stringify(buyPairsData))
  }
  if (sellAddresses.value.length > 0) {
    const sellPairsData = sellAddresses.value.map(pair => ({ from: pair.from, to: pair.to }))
    query.sellPairs = encodeURIComponent(JSON.stringify(sellPairsData))
  }

  console.log('地址变化更新 URL 参数:', query) // 调试日志

  router.replace({ query }).catch(() => {})
}, { deep: true })

// 监听路由变化，更新 searchParams
watch(() => route.query, (newQuery) => {
  isUpdatingFromUrl = true

  if (newQuery.contractAddress) searchParams.value.contractAddress = String(newQuery.contractAddress)
  else searchParams.value.contractAddress = ''

  if (newQuery.startBlock) searchParams.value.startBlock = parseInt(String(newQuery.startBlock))
  else searchParams.value.startBlock = null

  if (newQuery.endBlock) searchParams.value.endBlock = parseInt(String(newQuery.endBlock))
  else searchParams.value.endBlock = null

  if (newQuery.minAmount) searchParams.value.minAmount = parseFloat(String(newQuery.minAmount))
  else searchParams.value.minAmount = null

  if (newQuery.maxAmount) searchParams.value.maxAmount = parseFloat(String(newQuery.maxAmount))
  else searchParams.value.maxAmount = null

  if (newQuery.decimals) searchParams.value.decimals = parseInt(String(newQuery.decimals)) || 18
  else searchParams.value.decimals = 18

  if (newQuery.limit) searchParams.value.limit = parseInt(String(newQuery.limit)) || 100
  else searchParams.value.limit = 100

  isUpdatingFromUrl = false
}, { deep: true })

// 组件挂载后初始化
onMounted(() => {
  // 组件加载时初始化参数
  initializeFromUrl()
})

// 当前查看状态
const currentView = ref<string>('all')

// 交易数据（当前显示的数据）
const transactions = ref<any[]>([])
// 买入/卖出总量
const buyTotalAmount = ref<string>('0')
const sellTotalAmount = ref<string>('0')

// 轮询相关
const refreshInterval = ref<number>(60)
const isPolling = ref(false)
let timer: any = null

// 表格列定义
const columns = [
  { title: '区块号', dataIndex: 'block_number', width: 120 },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash', width: 150 },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address', width: 150 },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address', width: 150 },
  { title: '代币合约', dataIndex: 'contract_address', slotName: 'contract_address', width: 150 },
  { title: '数量', dataIndex: 'amount', slotName: 'amount', width: 150 },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp', width: 180 },
]

// 详情表格列定义
const detailColumns = [
  { title: '区块号', dataIndex: 'block_number', width: 120 },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash', width: 150 },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address', width: 150 },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address', width: 150 },
  { title: '数量', dataIndex: 'amount', slotName: 'amount', width: 150 },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp', width: 180 },
]

const shortHash = (val: string) => {
  if (!val) return ''
  return val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
}

const formatTime = (val: string) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}

const formatAmount = (val: string | number) => {
  if (!val) return '0'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '0'
  // 后端返回的 amount_decimal 已经是可读格式，直接返回并保留6位小数
  return num.toFixed(6)
}

// 获取轮询按钮文本
const getPollingButtonText = () => {
  // 始终基于轮询状态显示按钮文本，保持一致性
  // 如果轮询已停止，显示"开始轮询接口"
  // 如果轮询正在进行中，显示"停止轮询"
  return isPolling.value ? '停止轮询' : '开始轮询接口'
}

// 切换轮询状态
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
  console.log('🚀 [轮询] 开始轮询')

  // 重置视图为全部数据（避免显示异常）
  currentView.value = 'all'

  // 先查询全部数据
  fetchAllData()

  // 确保列表显示（fetchAllData可能不调用updateDisplayedData）
  updateDisplayedData()

  timer = setInterval(() => {
    console.log('🔄 [轮询] 执行轮询查询')
    // 轮询逻辑：只查询全部数据
    fetchAllData()

    // 轮询时也要确保列表显示
    updateDisplayedData()
  }, (refreshInterval.value || 5) * 1000)

  console.log('✅ [轮询] 轮询已启动，间隔:', (refreshInterval.value || 5), '秒')
}

const stopPolling = () => {
  isPolling.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
    console.log('⏹️ [轮询] 轮询已停止')
  }
}

// Add buy address row
const addBuyAddress = () => {
  buyAddresses.value.push({ from: '', to: '', data: [], loading: false })
}

// Delete buy address row
const removeBuyAddress = (index: number) => {
  buyAddresses.value.splice(index, 1)
  // If deleted row is current view, switch to all data
  const removedView = `buy-${index}`
  if (currentView.value === removedView) {
    currentView.value = 'all'
    updateDisplayedData()
  }
}

// Add sell address row
const addSellAddress = () => {
  sellAddresses.value.push({ from: '', to: '', data: [], loading: false })
}

// Delete sell address row
const removeSellAddress = (index: number) => {
  sellAddresses.value.splice(index, 1)
  // If deleted row is current view, switch to all data
  const removedView = `sell-${index}`
  if (currentView.value === removedView) {
    currentView.value = 'all'
    updateDisplayedData()
  }
}

// 获取数据
const fetchRowData = async (type: 'buy' | 'sell', index: number) => {
  if (!searchParams.value.contractAddress) {
    Message.warning('请输入合约地址')
    return
  }

  try {
    // 构建聚合请求参数
    const params: any = {
      contractAddress: searchParams.value.contractAddress,
      decimals: searchParams.value.decimals,
      limit: searchParams.value.limit,
    }

    // 添加区块范围
    if (searchParams.value.startBlock !== null && searchParams.value.startBlock !== undefined) {
      const startBlockStr = String(searchParams.value.startBlock)
      if (startBlockStr !== '') {
        params.startBlock = Number(startBlockStr)
      }
    }
    if (searchParams.value.endBlock !== null && searchParams.value.endBlock !== undefined) {
      const endBlockStr = String(searchParams.value.endBlock)
      if (endBlockStr !== '') {
        params.endBlock = Number(endBlockStr)
      }
    }

    // 添加金额过滤（转换为最小单位，发送字符串）
    if (searchParams.value.minAmount !== null && searchParams.value.minAmount !== undefined) {
      const minAmountStr = String(searchParams.value.minAmount)
      if (minAmountStr !== '') {
        const minAmountNum = Number(minAmountStr)
        if (!isNaN(minAmountNum)) {
          params.minAmount = String(minAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }
    if (searchParams.value.maxAmount !== null && searchParams.value.maxAmount !== undefined) {
      const maxAmountStr = String(searchParams.value.maxAmount)
      if (maxAmountStr !== '') {
        const maxAmountNum = Number(maxAmountStr)
        if (!isNaN(maxAmountNum)) {
          params.maxAmount = String(maxAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }

    // 添加地址组（根据type决定提交哪些）
    const buyAddressGroups = buyAddresses.value
      .filter(pair => pair.from || pair.to)  // 过滤空组
      .map(pair => ({
        from: pair.from,
        to: pair.to
      }))
    const sellAddressGroups = sellAddresses.value
      .filter(pair => pair.from || pair.to)  // 过滤空组
      .map(pair => ({
        from: pair.from,
        to: pair.to
      }))

    console.log('📦 [优化] 过滤后的地址组:', { buyAddressGroups, sellAddressGroups })

    // 根据 type 决定提交哪些地址组
    if (type === 'buy') {
      // 查询全部买入时，只提交买入地址组
      if (buyAddressGroups.length > 0) {
        params.buyAddressGroups = buyAddressGroups
      }
    } else if (type === 'sell') {
      // 查询全部卖出时，只提交卖出地址组
      if (sellAddressGroups.length > 0) {
        params.sellAddressGroups = sellAddressGroups
      }
    }

    console.log(`📤 [调试] fetchRowData 提交地址组类型: ${type}`, {
      submitBuyGroups: !!params.buyAddressGroups,
      submitSellGroups: !!params.sellAddressGroups
    })

    console.log('聚合请求参数:', params)

    // 调用聚合接口
    const result = await getTokenFilterAnalysisAggregate(params)
    console.log('聚合接口响应:', result)

    // axios拦截器已经返回了response.data，所以result就是整个响应对象
    if ((result as any).code !== 200) {
      throw new Error((result as any).message || '查询失败')
    }

    const data = (result as any).data

    // 🔍 调试：打印数据结构
    console.log('🔍 [调试] API返回的data结构:', {
      hasSummary: !!data.summary,
      hasBuyGroups: !!data.buyGroups,
      hasSellGroups: !!data.sellGroups,
      buyGroupsLength: data.buyGroups?.length,
      sellGroupsLength: data.sellGroups?.length,
      summary: data.summary
    })

    // 处理返回数据
    // 先清空所有数据（确保没有残留旧数据）
    buyAddresses.value.forEach(pair => {
      console.log(`🧹 [调试] 清空买入地址组数据`)
      pair.data = []
    })
    sellAddresses.value.forEach(pair => {
      console.log(`🧹 [调试] 清空卖出地址组数据`)
      pair.data = []
    })

    // 处理返回的买入数据
    if (data.buyGroups) {
      data.buyGroups.forEach((group: any, groupIndex: number) => {
        if (buyAddresses.value[groupIndex]) {
          // Use amount_decimal field from backend (ensure it's a string)
          buyAddresses.value[groupIndex].data = (group.transactions || []).map((tx: any) => ({
            ...tx,
            amount: String(tx.amount_decimal || tx.amount || '0') /* Ensure amount is a string */
          }))

          console.log(`✅ [调试] 更新买入地址组${groupIndex}:`, buyAddresses.value[groupIndex]?.data?.length || 0, '条数据')

          // Check group status
          if (group.status === 'failed') {
            console.error(`Buy group ${groupIndex} query failed:`, group.error)
            Message.warning(`Buy group ${groupIndex} query failed: ${group.error}`)
          }
        }
      })
    }

    // 处理返回的卖出数据
    if (data.sellGroups) {
      data.sellGroups.forEach((group: any, groupIndex: number) => {
        console.log(`🔍 [调试] 处理卖出组${groupIndex}:`, {
          status: group.status,
          transactionsCount: group.transactions?.length,
          group
        })

        if (sellAddresses.value[groupIndex]) {
          // Use amount_decimal field from backend (ensure it's a string)
          sellAddresses.value[groupIndex].data = (group.transactions || []).map((tx: any) => ({
            ...tx,
            amount: String(tx.amount_decimal || tx.amount || '0')
          }))

          console.log(`✅ [调试] 更新卖出地址组${groupIndex}:`, sellAddresses.value[groupIndex]?.data?.length || 0, '条数据')
          console.log(`🔍 [调试] 卖出组${groupIndex}数据:`, sellAddresses.value[groupIndex].data)

          // Check group status
          if (group.status === 'failed') {
            console.error(`Sell group ${groupIndex} query failed:`, group.error)
            Message.warning(`Sell group ${groupIndex} query failed: ${group.error}`)
          }
        }
      })
    }

    console.log('🔍 [调试] 所有数据组处理完成:', {
      buyAddresses: buyAddresses.value.map(s => s.data?.length || 0),
      sellAddresses: sellAddresses.value.map(s => s.data?.length || 0)
    })

    // 更新总量（统一流程：使用本地计算方式）
    updateTotalAmounts()

    // 更新显示数据（获取所有数据后始终刷新）
    updateDisplayedData()

    // 显示成功消息
    const totalGroups = data.summary?.groupSuccessCount || 0
    const totalTransactions = data.summary?.totalTransactionCount || 0
    Message.success(`Query successful! ${totalGroups} address groups, ${totalTransactions} records`)

  } catch (e: any) {
    console.error('Query failed:', e)
    Message.error('Query failed: ' + (e?.message || 'Unknown error'))
  }
}

// 查询单个买入地址
const fetchBuyAddress = async (index: number) => {
  if (!buyAddresses.value[index]) return

  // 如果from和to都为空，不发送请求
  const { from, to } = buyAddresses.value[index]
  if (!from && !to) {
    console.log('⚠️ [优化] 买入地址组为空，跳过请求')
    return
  }

  // Set loading state
  buyAddresses.value[index].loading = true

  // Clear data before querying (ensure consistency)
  // 清空当前组
  buyAddresses.value[index].data = []

  // 清空所有其他组（只查询一个组时，其他组应该为空）
  buyAddresses.value.forEach((pair, i) => {
    if (i !== index) {
      console.log(`🧹 [调试] 清空买入地址组${i}的数据`)
      pair.data = []
    }
  })

  try {
    // Build aggregation request parameters
    const params: any = {
      contractAddress: searchParams.value.contractAddress,
      decimals: searchParams.value.decimals,
      limit: searchParams.value.limit,
    }

    // 添加区块范围
    if (searchParams.value.startBlock !== null && searchParams.value.startBlock !== undefined) {
      const startBlockStr = String(searchParams.value.startBlock)
      if (startBlockStr !== '') {
        params.startBlock = Number(startBlockStr)
      }
    }
    if (searchParams.value.endBlock !== null && searchParams.value.endBlock !== undefined) {
      const endBlockStr = String(searchParams.value.endBlock)
      if (endBlockStr !== '') {
        params.endBlock = Number(endBlockStr)
      }
    }

    // 添加金额过滤
    if (searchParams.value.minAmount !== null && searchParams.value.minAmount !== undefined) {
      const minAmountStr = String(searchParams.value.minAmount)
      if (minAmountStr !== '') {
        const minAmountNum = Number(minAmountStr)
        if (!isNaN(minAmountNum)) {
          params.minAmount = String(minAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }
    if (searchParams.value.maxAmount !== null && searchParams.value.maxAmount !== undefined) {
      const maxAmountStr = String(searchParams.value.maxAmount)
      if (maxAmountStr !== '') {
        const maxAmountNum = Number(maxAmountStr)
        if (!isNaN(maxAmountNum)) {
          params.maxAmount = String(maxAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }

    // 只添加当前买入地址组（如果from或to不为空）
    const currentBuyGroup = {
      from: buyAddresses.value[index].from,
      to: buyAddresses.value[index].to
    }
    if (currentBuyGroup.from || currentBuyGroup.to) {
      params.buyAddressGroups = [currentBuyGroup]
    }

    console.log('📦 [优化] 当前买入地址组:', params.buyAddressGroups)

    console.log('查询买入地址参数:', params)

    // 调用聚合接口
    const result = await getTokenFilterAnalysisAggregate(params)

    // axios拦截器已经返回了response.data，所以result就是整个响应对象
    if ((result as any).code !== 200) {
      throw new Error((result as any).message || '查询失败')
    }

    const data = (result as any).data

    // Process returned data
    if (data.buyGroups && data.buyGroups[0]) {
      const group = data.buyGroups[0]

      // Only set data if query was successful
      if (group.status !== 'failed') {
        buyAddresses.value[index].data = (group.transactions || []).map((tx: any) => ({
          ...tx,
          amount: String(tx.amount_decimal || tx.amount || '0')
        }))
        Message.success(`Buy address row ${index + 1} query successful, got ${group.transactions?.length || 0} records`)
      } else {
        // Query failed, data remains empty (already cleared at start)
        Message.error(`Buy address row ${index + 1} query failed: ${group.error}`)
      }
    }

    // Update displayed data
    if (currentView.value === `buy-${index}` || currentView.value === 'all') {
      updateDisplayedData()
    }

  } catch (e: any) {
    console.error('Query failed:', e)
    Message.error('Query failed: ' + (e?.message || 'Unknown error'))
  } finally {
    // Update totals (统一流程：只在finally中调用一次)
    console.log(`📊 [调试] finally 块执行，准备调用 updateTotalAmounts`)
    updateTotalAmounts()

    // Clear loading state
    console.log(`📊 [调试] 准备重置 loading 状态:`, {
      index,
      hasBuyAddress: !!buyAddresses.value[index],
      oldLoading: buyAddresses.value[index]?.loading
    })
    if (buyAddresses.value[index]) {
      buyAddresses.value[index].loading = false
      console.log(`✅ [调试] loading 状态已重置:`, {
        index,
        newLoading: buyAddresses.value[index].loading
      })
    }
  }
}

// Query single sell address
const fetchSellAddress = async (index: number) => {
  if (!sellAddresses.value[index]) return

  // 如果from和to都为空，不发送请求
  const { from, to } = sellAddresses.value[index]
  if (!from && !to) {
    console.log('⚠️ [优化] 卖出地址组为空，跳过请求')
    return
  }

  // Set loading state
  sellAddresses.value[index].loading = true

  // Clear data before querying (ensure consistency)
  // 清空当前组
  sellAddresses.value[index].data = []

  // 清空所有其他组（只查询一个组时，其他组应该为空）
  sellAddresses.value.forEach((pair, i) => {
    if (i !== index) {
      console.log(`🧹 [调试] 清空卖出地址组${i}的数据`)
      pair.data = []
    }
  })

  try {
    // Build aggregation request parameters
    const params: any = {
      contractAddress: searchParams.value.contractAddress,
      decimals: searchParams.value.decimals,
      limit: searchParams.value.limit,
    }

    // 添加区块范围
    if (searchParams.value.startBlock !== null && searchParams.value.startBlock !== undefined) {
      const startBlockStr = String(searchParams.value.startBlock)
      if (startBlockStr !== '') {
        params.startBlock = Number(startBlockStr)
      }
    }
    if (searchParams.value.endBlock !== null && searchParams.value.endBlock !== undefined) {
      const endBlockStr = String(searchParams.value.endBlock)
      if (endBlockStr !== '') {
        params.endBlock = Number(endBlockStr)
      }
    }

    // 添加金额过滤
    if (searchParams.value.minAmount !== null && searchParams.value.minAmount !== undefined) {
      const minAmountStr = String(searchParams.value.minAmount)
      if (minAmountStr !== '') {
        const minAmountNum = Number(minAmountStr)
        if (!isNaN(minAmountNum)) {
          params.minAmount = String(minAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }
    if (searchParams.value.maxAmount !== null && searchParams.value.maxAmount !== undefined) {
      const maxAmountStr = String(searchParams.value.maxAmount)
      if (maxAmountStr !== '') {
        const maxAmountNum = Number(maxAmountStr)
        if (!isNaN(maxAmountNum)) {
          params.maxAmount = String(maxAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }

    // 只添加当前卖出地址组（如果from或to不为空）
    const currentSellGroup = {
      from: sellAddresses.value[index].from,
      to: sellAddresses.value[index].to
    }
    if (currentSellGroup.from || currentSellGroup.to) {
      params.sellAddressGroups = [currentSellGroup]
    }

    console.log('📦 [优化] 当前卖出地址组:', params.sellAddressGroups)

    console.log('查询卖出地址参数:', params)

    // 调用聚合接口
    const result = await getTokenFilterAnalysisAggregate(params)

    // axios拦截器已经返回了response.data，所以result就是整个响应对象
    if ((result as any).code !== 200) {
      throw new Error((result as any).message || '查询失败')
    }

    const data = (result as any).data

    // Process returned data
    if (data.sellGroups && data.sellGroups[0]) {
      const group = data.sellGroups[0]

      // Only set data if query was successful
      if (group.status !== 'failed') {
        sellAddresses.value[index].data = (group.transactions || []).map((tx: any) => ({
          ...tx,
          amount: String(tx.amount_decimal || tx.amount || '0')
        }))
        Message.success(`Sell address row ${index + 1} query successful, got ${group.transactions?.length || 0} records`)
      } else {
        // Query failed, data remains empty (already cleared at start)
        Message.error(`Sell address row ${index + 1} query failed: ${group.error}`)
      }
    }

    // Update displayed data
    if (currentView.value === `sell-${index}` || currentView.value === 'all') {
      updateDisplayedData()
    }

  } catch (e: any) {
    console.error('Query failed:', e)
    Message.error('Query failed: ' + (e?.message || 'Unknown error'))
  } finally {
    // Update totals (统一流程：只在finally中调用一次)
    console.log(`📊 [调试] finally 块执行，准备调用 updateTotalAmounts`)
    updateTotalAmounts()

    // Clear loading state
    console.log(`📊 [调试] 准备重置 loading 状态:`, {
      index,
      hasSellAddress: !!sellAddresses.value[index],
      oldLoading: sellAddresses.value[index]?.loading
    })
    if (sellAddresses.value[index]) {
      sellAddresses.value[index].loading = false
      console.log(`✅ [调试] loading 状态已重置:`, {
        index,
        newLoading: sellAddresses.value[index].loading
      })
    }
  }
}

// 查询全部数据（所有买入和卖出地址组）
const fetchAllData = async () => {
  try {
    // 构建聚合请求参数
    const params: any = {
      contractAddress: searchParams.value.contractAddress,
      decimals: searchParams.value.decimals,
      limit: searchParams.value.limit,
    }

    // 添加区块范围
    if (searchParams.value.startBlock !== null && searchParams.value.startBlock !== undefined) {
      const startBlockStr = String(searchParams.value.startBlock)
      if (startBlockStr !== '') {
        params.startBlock = Number(startBlockStr)
      }
    }
    if (searchParams.value.endBlock !== null && searchParams.value.endBlock !== undefined) {
      const endBlockStr = String(searchParams.value.endBlock)
      if (endBlockStr !== '') {
        params.endBlock = Number(endBlockStr)
      }
    }

    // 添加金额过滤
    if (searchParams.value.minAmount !== null && searchParams.value.minAmount !== undefined) {
      const minAmountStr = String(searchParams.value.minAmount)
      if (minAmountStr !== '') {
        const minAmountNum = Number(minAmountStr)
        if (!isNaN(minAmountNum)) {
          params.minAmount = String(minAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }
    if (searchParams.value.maxAmount !== null && searchParams.value.maxAmount !== undefined) {
      const maxAmountStr = String(searchParams.value.maxAmount)
      if (maxAmountStr !== '') {
        const maxAmountNum = Number(maxAmountStr)
        if (!isNaN(maxAmountNum)) {
          params.maxAmount = String(maxAmountNum * Math.pow(10, searchParams.value.decimals))
        }
      }
    }

    // 添加所有买入地址组（过滤掉from和to都为空的组）
    params.buyAddressGroups = buyAddresses.value
      .filter(pair => pair.from || pair.to)  // 过滤空组
      .map(pair => ({
        from: pair.from,
        to: pair.to
      }))

    // 添加所有卖出地址组（过滤掉from和to都为空的组）
    params.sellAddressGroups = sellAddresses.value
      .filter(pair => pair.from || pair.to)  // 过滤空组
      .map(pair => ({
        from: pair.from,
        to: pair.to
      }))

    console.log('📦 [优化] 过滤后的地址组:', {
      buyAddressGroups: params.buyAddressGroups,
      sellAddressGroups: params.sellAddressGroups
    })

    console.log('查询全部数据参数:', params)

    // 调用聚合接口
    const result = await getTokenFilterAnalysisAggregate(params)

    // axios拦截器已经返回了response.data，所以result就是整个响应对象
    if ((result as any).code !== 200) {
      throw new Error((result as any).message || '查询失败')
    }

    const data = (result as any).data

    // 🔍 调试：打印数据结构
    console.log('🔍 [调试] fetchAllData API返回的data结构:', {
      hasSummary: !!data.summary,
      hasBuyGroups: !!data.buyGroups,
      hasSellGroups: !!data.sellGroups,
      buyGroupsLength: data.buyGroups?.length,
      sellGroupsLength: data.sellGroups?.length,
      summary: data.summary
    })

    // 先清空所有数据（确保没有残留旧数据）
    buyAddresses.value.forEach(pair => {
      console.log(`🧹 [调试] 清空买入地址组数据`)
      pair.data = []
    })
    sellAddresses.value.forEach(pair => {
      console.log(`🧹 [调试] 清空卖出地址组数据`)
      pair.data = []
    })

    // 处理买入组数据
    if (data.buyGroups && Array.isArray(data.buyGroups)) {
      data.buyGroups.forEach((group: any, index: number) => {
        if (buyAddresses.value[index]) {
          buyAddresses.value[index].data = (group.transactions || []).map((tx: any) => ({
            ...tx,
            amount: String(tx.amount_decimal || tx.amount || '0')
          }))

          console.log(`✅ [调试] fetchAllData 更新买入地址组${index}:`, buyAddresses.value[index]?.data?.length || 0, '条数据')

          if (group.status === 'failed') {
            Message.error(`Buy address row ${index + 1} query failed: ${group.error}`)
          }
        }
      })
    }

    // 处理卖出组数据
    if (data.sellGroups && Array.isArray(data.sellGroups)) {
      data.sellGroups.forEach((group: any, index: number) => {
        console.log(`🔍 [调试] fetchAllData 处理卖出组${index}:`, {
          status: group.status,
          transactionsCount: group.transactions?.length,
          group
        })

        if (sellAddresses.value[index]) {
          sellAddresses.value[index].data = (group.transactions || []).map((tx: any) => ({
            ...tx,
            amount: String(tx.amount_decimal || tx.amount || '0')
          }))

          console.log(`✅ [调试] fetchAllData 更新卖出地址组${index}:`, sellAddresses.value[index]?.data?.length || 0, '条数据')
          console.log(`🔍 [调试] fetchAllData 卖出组${index}数据:`, sellAddresses.value[index].data)

          if (group.status === 'failed') {
            Message.error(`Sell address row ${index + 1} query failed: ${group.error}`)
          }
        }
      })
    }

    console.log('🔍 [调试] fetchAllData 所有数据组处理完成:', {
      buyAddresses: buyAddresses.value.map(s => s.data?.length || 0),
      sellAddresses: sellAddresses.value.map(s => s.data?.length || 0)
    })

    // 更新总量（统一流程：使用本地计算方式）
    updateTotalAmounts()

    // 更新显示数据
    updateDisplayedData()

    Message.success('Query completed')

  } catch (e: any) {
    console.error('Query failed:', e)
    Message.error('Query failed: ' + (e?.message || 'Unknown error'))
  }
}

// 查询全部买入地址
const fetchAllBuyAddresses = async () => {
  await fetchRowData('buy', 0)

  // 自动切换到全部数据视图（用户点击"查询全部买入"期望看到所有数据）
  currentView.value = 'all'
  updateDisplayedData()
}

// 查询全部卖出地址
const fetchAllSellAddresses = async () => {
  await fetchRowData('sell', 0)

  // 自动切换到全部数据视图（用户点击"查询全部卖出"期望看到所有数据）
  currentView.value = 'all'
  updateDisplayedData()
}

// 更新总量（从API响应）
const updateTotalAmountsFromAPI = (summary: any) => {
  console.log('🔍 [调试] updateTotalAmountsFromAPI 接收到的summary:', summary)

  if (!summary) {
    console.log('⚠️ [调试] summary为空，使用默认值')
    buyTotalAmount.value = '0'
    sellTotalAmount.value = '0'
    return
  }

  // 使用后端返回的金额（已经是可读格式）
  buyTotalAmount.value = summary.buyTotalAmount || '0'
  sellTotalAmount.value = summary.sellTotalAmount || '0'

  console.log('🔍 [调试] 更新后显示的总量:', {
    buyTotalAmount: buyTotalAmount.value,
    sellTotalAmount: sellTotalAmount.value
  })
}

// View data for a specific row
const viewRowData = async (type: 'buy' | 'sell', index: number) => {
  const addresses = type === 'buy' ? buyAddresses.value : sellAddresses.value
  const pair = addresses[index]

  console.log(`🎯 [调试] viewRowData 被调用:`, {
    type,
    index,
    time: new Date().toISOString(),
    loading: pair.loading,
    from: pair.from,
    to: pair.to,
    dataLength: pair.data?.length
  })

  // Always query data (允许快速点击：不检查loading状态)
  try {
    console.log(`🚀 [调试] 开始执行 ${type} 地址查询，index=${index}`)
    // Query based on type
    if (type === 'buy') {
      await fetchBuyAddress(index)
    } else {
      await fetchSellAddress(index)
    }
    console.log(`✅ [调试] ${type} 地址查询完成，index=${index}`)
  } catch (e: any) {
    console.error('Query failed:', e)
    return
  }

  // Then show details
  currentView.value = `${type}-${index}`
  updateDisplayedData()
  Message.success(`Switched to ${type === 'buy' ? 'buy' : 'sell'} address row ${index + 1} data`)
}

// 查看全部数据
const viewAllData = async () => {
  // 先查询全部数据
  await fetchAllData()

  // 然后切换到全部数据视图
  currentView.value = 'all'
  updateDisplayedData()
  Message.success('Switched to all data')
}

// 更新显示的数据
const updateDisplayedData = () => {
  let allData: any[] = []

  if (currentView.value === 'all') {
    // 显示所有行的汇总数据
    buyAddresses.value.forEach(pair => {
      if (pair.data) {
        allData = allData.concat(pair.data)
      }
    })
    sellAddresses.value.forEach(pair => {
      if (pair.data) {
        allData = allData.concat(pair.data)
      }
    })
  } else {
    // 显示指定行的数据
    const [type, indexStr] = currentView.value.split('-')
    const index = parseInt(indexStr)
    const addresses = type === 'buy' ? buyAddresses.value : sellAddresses.value
    if (addresses[index]?.data) {
      allData = addresses[index].data
    }
  }

  transactions.value = allData
}

// 更新总量（统一流程：清空并重新计算所有总量）
const updateTotalAmounts = () => {
  let buyTotal = 0
  let sellTotal = 0

  console.log('🧹 [统一流程] 清空并重新计算所有总量...', {
    callTime: new Date().toISOString(),
    callStack: new Error().stack
  })

  buyAddresses.value.forEach((pair, index) => {
    console.log(`🔍 [调试] 买入地址组${index}:`, {
      dataLength: pair.data?.length,
      loading: pair.loading,
      from: pair.from,
      to: pair.to,
      data: pair.data
    })

    if (pair.data) {
      const groupTotal = pair.data.reduce((sum, tx) => sum + Number(tx.amount), 0)
      buyTotal += groupTotal
      console.log(`🔍 [调试] 买入地址组${index}小计:`, groupTotal)
    }
  })

  sellAddresses.value.forEach((pair, index) => {
    console.log(`🔍 [调试] 卖出地址组${index}:`, {
      dataLength: pair.data?.length,
      loading: pair.loading,
      from: pair.from,
      to: pair.to,
      data: pair.data
    })

    if (pair.data) {
      const groupTotal = pair.data.reduce((sum, tx) => sum + Number(tx.amount), 0)
      sellTotal += groupTotal
      console.log(`🔍 [调试] 卖出地址组${index}小计:`, groupTotal)
    }
  })

  const oldBuyTotal = buyTotalAmount.value
  const oldSellTotal = sellTotalAmount.value

  console.log('🔍 [统一流程] 本次计算总量:', {
    buyTotal,
    sellTotal,
    oldBuyTotal,
    oldSellTotal,
    buyChanged: buyTotal.toLocaleString() !== oldBuyTotal,
    sellChanged: sellTotal.toLocaleString() !== oldSellTotal
  })

  buyTotalAmount.value = buyTotal.toLocaleString()
  sellTotalAmount.value = sellTotal.toLocaleString()

  console.log('✅ [统一流程] 总量更新完成:', {
    buyTotalAmount: buyTotalAmount.value,
    sellTotalAmount: sellTotalAmount.value
  })
}

// 计算净流入/流出
const netAmount = computed(() => {
  let buyTotal = 0
  let sellTotal = 0

  buyAddresses.value.forEach(pair => {
    if (pair.data) {
      buyTotal += pair.data.reduce((sum, tx) => sum + Number(tx.amount), 0)
    }
  })

  sellAddresses.value.forEach(pair => {
    if (pair.data) {
      sellTotal += pair.data.reduce((sum, tx) => sum + Number(tx.amount), 0)
    }
  })

  return buyTotal - sellTotal
})

const netAmountDisplay = computed(() => {
  const amount = netAmount.value
  return amount.toLocaleString()
})

// 地址标签管理相关
const tagModalVisible = ref(false)
const currentAddress = ref('')
const currentAddressTags = ref<any[]>([])
const uniqueTags = ref<string[]>([])
const tagLoading = ref(false)
const tagForm = ref({
  tag: '',
  description: ''
})

// 记录详情相关
const detailModalVisible = ref(false)
const currentDetailRecord = ref<any>(null)
const similarRecords = ref<any[]>([])

// 显示标签管理模态框
const showTagModal = async (address: string) => {
  currentAddress.value = address
  tagModalVisible.value = true
  await loadAddressTags(address)
  await loadUniqueTags()
}

// 加载地址标签
const loadAddressTags = async (address: string) => {
  try {
    console.log('请求地址标签:', address) // 调试日志
    const res = await getAddressTags({ address })
    console.log('完整响应:', res) // 调试日志
    const tags = res.data?.tags || []
    console.log('提取的标签数据:', tags) // 调试日志

    // 处理不同格式的标签数据
    if (Array.isArray(tags)) {
      if (tags.length === 0) {
        currentAddressTags.value = []
      } else if (typeof tags[0] === 'string') {
        // 字符串数组，转换为对象数组
        currentAddressTags.value = tags.map((tag: string, index: number) => ({
          id: index,
          tag: tag,
          description: ''
        }))
      } else if (typeof tags[0] === 'object') {
        // 对象数组，直接使用
        currentAddressTags.value = tags
      } else {
        currentAddressTags.value = []
      }
    } else {
      currentAddressTags.value = []
    }

    console.log('转换后的标签:', currentAddressTags.value) // 调试日志
  } catch (e) {
    console.error('Load address tags failed:', e)
    currentAddressTags.value = []
    Message.error('Load address tags failed')
  }
}

// 加载所有唯一标签
const loadUniqueTags = async () => {
  try {
    const res = await getUniqueAddressTags()
    uniqueTags.value = res.data?.tags || []
  } catch (e) {
    console.error('Load tag list failed')
  }
}

// 添加标签
const addTag = async () => {
  if (!tagForm.value.tag.trim()) {
    Message.warning('请输入标签名')
    return
  }

  tagLoading.value = true
  try {
    await addAddressTag({
      address: currentAddress.value,
      tag: tagForm.value.tag.trim(),
      description: tagForm.value.description.trim()
    })
    Message.success('Tag added successfully')
    tagForm.value.tag = ''
    tagForm.value.description = ''
    await loadAddressTags(currentAddress.value)
    await loadUniqueTags()
  } catch (e) {
    Message.error('Add tag failed')
  } finally {
    tagLoading.value = false
  }
}

// 删除标签
const removeTag = async (tag: any) => {
  try {
    await deleteAddressTag({
      address: currentAddress.value,
      tag: tag.tag
    })
    Message.success('Tag deleted successfully')
    await loadAddressTags(currentAddress.value)
  } catch (e) {
    Message.error('Delete tag failed')
  }
}

// 模态框确认
const handleTagModalOk = () => {
  tagModalVisible.value = false
}

// 模态框取消
const handleTagModalCancel = () => {
  tagModalVisible.value = false
  tagForm.value.tag = ''
  tagForm.value.description = ''
}

// 查看记录详情
const showRecordDetail = async (record: any, type: string) => {
  currentDetailRecord.value = record
  detailModalVisible.value = true

  // 查找相似记录
  // 根据from_address、to_address、contract_address等条件筛选
  try {
    // TODO: 调用API获取相似记录
    // 这里先用模拟数据
    const mockSimilarRecords = transactions.value.filter(item =>
      item.tx_hash !== record.tx_hash && (
        (type === 'from' && item.from_address === record.from_address) ||
        (type === 'to' && item.to_address === record.to_address) ||
        item.contract_address === record.contract_address
      )
    )
    similarRecords.value = mockSimilarRecords
  } catch (e) {
    console.error('Get similar records failed:', e)
    similarRecords.value = []
  }
}

// 详情模态框确认
const handleDetailModalOk = () => {
  detailModalVisible.value = false
  currentDetailRecord.value = null
  similarRecords.value = []
}

// 详情模态框取消
const handleDetailModalCancel = () => {
  detailModalVisible.value = false
  currentDetailRecord.value = null
  similarRecords.value = []
}

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.token-filter-analysis {
  padding: 20px;
}
</style>
