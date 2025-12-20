<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="交易哈希">
        <a-input v-model="searchParams.tx_hashes" placeholder="多个交易哈希用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="From地址">
        <a-input v-model="searchParams.from_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="To地址">
        <a-input v-model="searchParams.to_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="代币合约">
        <a-input v-model="searchParams.token_contracts" placeholder="多个合约地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="代币类型">
        <a-select v-model="searchParams.token_types" placeholder="选择代币类型" style="width: 200px;" mode="multiple" allow-clear>
          <a-option value="NATIVE">BNB转账</a-option>
          <a-option value="ERC20">ERC20代币</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="函数名称">
        <a-input v-model="searchParams.function_names" placeholder="多个函数名称用逗号分隔" style="width: 300px;" />
      </a-form-item>
      <a-form-item label="最小金额">
        <a-input v-model="searchParams.min_amount" placeholder="最小金额(支持小数)" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最大金额">
        <a-input v-model="searchParams.max_amount" placeholder="最大金额(支持小数)" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="decimals">
        <a-input-number v-model="searchParams.decimals" :min="0" :max="36" placeholder="精度" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="最小区块号">
        <a-input-number v-model="searchParams.min_block_num" placeholder="请输入最小区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最大区块号">
        <a-input-number v-model="searchParams.max_block_num" placeholder="请输入最大区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="显示条数">
        <a-input-number v-model="searchParams.limit" :min="1" :max="1000" placeholder="显示条数" style="width: 120px;" />
      </a-form-item>
      <a-form-item label="刷新时间(秒)">
        <a-input-number v-model="refreshInterval" :min="1" placeholder="刷新间隔" style="width: 120px;" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="togglePolling">{{ isPolling ? '停止轮询' : '开始轮询接口' }}</a-button>
      </a-form-item>
    </a-form>
    
    <a-space style="margin: 12px 0;">
      <a-button type="primary" size="small" @click="batchCopyToAddresses">去重并批量复制To地址</a-button>
      <a-button type="primary" size="small" @click="fillToAddressesToFrom">将To地址填入From筛选</a-button>
      <a-popconfirm content="确认批量将选中的To地址添加到黑名单？" @ok="batchAddToBlacklist">
        <a-button type="primary" size="small" status="danger">批量添加到黑名单</a-button>
      </a-popconfirm>
      <a-button type="primary" size="small" @click="showBatchTagModal">批量添加地址标签</a-button>
      <a-button type="primary" size="small" @click="fetchStats">查看统计信息</a-button>
    </a-space>

    <a-table
      :columns="columns"
      :data="transfers"
      :pagination="false"
      row-key="id"
      style="margin-top: 20px"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
      :loading="loading"
    >
      <template #tx_hash="{ record }">
        <a-space>
          <a-link :href="record.bscscan_tx_url" target="_blank">{{ shortHash(record.tx_hash) }}</a-link>
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
          <a-popconfirm content="确认将该To地址添加到黑名单？" @ok="addToBlacklist(record)">
            <a-button type="text" size="mini" status="danger">
              <icon-delete />
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
      
      <template #token_contract="{ record }">
        <a-space v-if="record.token_contract">
          <a-link :href="record.bscscan_token_url" target="_blank">{{ shortHash(record.token_contract) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.token_contract)">
            <icon-copy />
          </a-button>
        </a-space>
        <span v-else>-</span>
      </template>
      
      <template #amount="{ record }">
        <span v-if="record.amount_decimal">{{ record.amount_decimal }}</span>
        <span v-else>{{ formatAmount(record.amount, record.token_type) }}</span>
      </template>
      
      <template #token_type="{ record }">
        <a-tag :color="record.token_type === 'NATIVE' ? 'green' : 'blue'">
          {{ record.token_type === 'NATIVE' ? 'BNB' : 'ERC20' }}
        </a-tag>
      </template>
      
      <template #timestamp="{ record }">
        {{ formatTime(record.timestamp) }}
      </template>
    </a-table>

    <!-- 批量标签模态框 -->
    <a-modal v-model:visible="batchTagModalVisible" title="批量添加地址标签" @ok="handleBatchTagSubmit">
      <a-form :model="batchTagForm" layout="vertical">
        <a-form-item label="地址列表">
          <a-textarea v-model="batchTagForm.addresses" placeholder="请输入地址，每行一个" :rows="5" />
        </a-form-item>
        <a-form-item label="标签名称">
          <a-input v-model="batchTagForm.tag" placeholder="请输入标签名称" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 统计信息模态框 -->
    <a-modal v-model:visible="statsModalVisible" title="批量转账统计信息" width="600px">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="总批量交易数">{{ stats.total_batch_transactions }}</a-descriptions-item>
        <a-descriptions-item label="总转账记录数">{{ stats.total_transfer_records }}</a-descriptions-item>
        <a-descriptions-item label="平均每批转账数">{{ stats.avg_records_per_batch }}</a-descriptions-item>
        <a-descriptions-item label="最大批量转账数">{{ stats.max_batch_size }}</a-descriptions-item>
        <a-descriptions-item label="最常用函数">{{ stats.top_function }}</a-descriptions-item>
        <a-descriptions-item label="最常用函数次数">{{ stats.top_function_count }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconTag, IconDelete } from '@arco-design/web-vue/es/icon'
import { queryBatchTransfers, addReceiverBlacklist, addAddressTag, getBatchTransfersStats } from '@/api/monitor'
import { copyToClipboard } from '@/utils/clipboard'

const route = useRoute()
const router = useRouter()

interface BatchTransferRecord {
  id: number
  tx_hash: string
  batch_index: number
  from_address: string
  from_address_tag?: string
  to_address: string
  to_address_tag?: string
  amount: string
  amount_decimal?: string
  token_contract?: string
  token_type: 'NATIVE' | 'ERC20'
  function_name: string
  block_number: number
  timestamp: string
  created_at: string
  bscscan_tx_url: string
  bscscan_token_url?: string
}

interface StatsData {
  total_batch_transactions: number
  total_transfer_records: number
  avg_records_per_batch: number
  max_batch_size: number
  top_function: string
  top_function_count: number
}

// API响应类型定义
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface BatchTransfersResponse {
  total: number
  limit: number
  offset: number
  records: BatchTransferRecord[]
}

const transfers = ref<BatchTransferRecord[]>([])
const selectedRowKeys = ref<string[]>([])
const loading = ref(false)
const isPolling = ref(false)
const refreshInterval = ref(60)
let pollingTimer: number | null = null

const batchTagModalVisible = ref(false)
const statsModalVisible = ref(false)
const stats = ref<StatsData>({
  total_batch_transactions: 0,
  total_transfer_records: 0,
  avg_records_per_batch: 0,
  max_batch_size: 0,
  top_function: '',
  top_function_count: 0
})

const batchTagForm = reactive({
  addresses: '',
  tag: ''
})

const searchParams = reactive({
  tx_hashes: '',
  from_addresses: '',
  to_addresses: '',
  token_contracts: '',
  token_types: [] as string[],
  function_names: '',
  min_amount: '',
  max_amount: '',
  decimals: 18,
  min_block_num: undefined as number | undefined,
  max_block_num: undefined as number | undefined,
  limit: 100
})

// 从 URL 参数初始化 searchParams
const initializeFromUrl = () => {
  const query = route.query
  if (query.tx_hashes) searchParams.tx_hashes = String(query.tx_hashes)
  if (query.from_addresses) searchParams.from_addresses = String(query.from_addresses)
  if (query.to_addresses) searchParams.to_addresses = String(query.to_addresses)
  if (query.token_contracts) searchParams.token_contracts = String(query.token_contracts)
  if (query.token_types) {
    const types = String(query.token_types)
    searchParams.token_types = types ? types.split(',') : []
  }
  if (query.function_names) searchParams.function_names = String(query.function_names)
  if (query.min_amount) searchParams.min_amount = String(query.min_amount)
  if (query.max_amount) searchParams.max_amount = String(query.max_amount)
  if (query.decimals) searchParams.decimals = parseInt(String(query.decimals)) || 18
  if (query.min_block_num) searchParams.min_block_num = parseInt(String(query.min_block_num))
  if (query.max_block_num) searchParams.max_block_num = parseInt(String(query.max_block_num))
  if (query.limit) searchParams.limit = parseInt(String(query.limit)) || 100
}

// 监听 searchParams 变化，更新 URL（避免无限循环）
let isUpdatingFromUrl = false
watch(searchParams, (newValue) => {
  if (isUpdatingFromUrl) return

  // 构建查询参数对象，只包含非空值
  const query: Record<string, any> = {}
  if (newValue.tx_hashes) query.tx_hashes = newValue.tx_hashes
  if (newValue.from_addresses) query.from_addresses = newValue.from_addresses
  if (newValue.to_addresses) query.to_addresses = newValue.to_addresses
  if (newValue.token_contracts) query.token_contracts = newValue.token_contracts
  if (newValue.token_types && newValue.token_types.length > 0) query.token_types = newValue.token_types.join(',')
  if (newValue.function_names) query.function_names = newValue.function_names
  if (newValue.min_amount) query.min_amount = newValue.min_amount
  if (newValue.max_amount) query.max_amount = newValue.max_amount
  if (newValue.decimals !== null && newValue.decimals !== undefined) query.decimals = newValue.decimals
  if (newValue.min_block_num !== null && newValue.min_block_num !== undefined) query.min_block_num = newValue.min_block_num
  if (newValue.max_block_num !== null && newValue.max_block_num !== undefined) query.max_block_num = newValue.max_block_num
  if (newValue.limit) query.limit = newValue.limit

  // 更新 URL，不触发导航
  router.replace({ query }).catch(() => {})
}, { deep: true })

// 监听路由变化，更新 searchParams
watch(() => route.query, (newQuery) => {
  isUpdatingFromUrl = true
  if (newQuery.tx_hashes) searchParams.tx_hashes = String(newQuery.tx_hashes)
  else searchParams.tx_hashes = ''

  if (newQuery.from_addresses) searchParams.from_addresses = String(newQuery.from_addresses)
  else searchParams.from_addresses = ''

  if (newQuery.to_addresses) searchParams.to_addresses = String(newQuery.to_addresses)
  else searchParams.to_addresses = ''

  if (newQuery.token_contracts) searchParams.token_contracts = String(newQuery.token_contracts)
  else searchParams.token_contracts = ''

  if (newQuery.token_types) {
    const types = String(newQuery.token_types)
    searchParams.token_types = types ? types.split(',') : []
  } else {
    searchParams.token_types = []
  }

  if (newQuery.function_names) searchParams.function_names = String(newQuery.function_names)
  else searchParams.function_names = ''

  if (newQuery.min_amount) searchParams.min_amount = String(newQuery.min_amount)
  else searchParams.min_amount = ''

  if (newQuery.max_amount) searchParams.max_amount = String(newQuery.max_amount)
  else searchParams.max_amount = ''

  if (newQuery.decimals) searchParams.decimals = parseInt(String(newQuery.decimals)) || 18
  else searchParams.decimals = 18

  if (newQuery.min_block_num) searchParams.min_block_num = parseInt(String(newQuery.min_block_num))
  else searchParams.min_block_num = undefined

  if (newQuery.max_block_num) searchParams.max_block_num = parseInt(String(newQuery.max_block_num))
  else searchParams.max_block_num = undefined

  if (newQuery.limit) searchParams.limit = parseInt(String(newQuery.limit)) || 100
  else searchParams.limit = 100

  isUpdatingFromUrl = false
}, { deep: true })

const columns = [
  {
    title: '',
    dataIndex: 'selection',
    width: 50,
    slotName: 'selection'
  },
  {
    title: '区块号',
    dataIndex: 'block_number',
    width: 120
  },
  {
    title: '交易哈希',
    dataIndex: 'tx_hash',
    width: 200,
    slotName: 'tx_hash'
  },

  {
    title: 'From',
    dataIndex: 'from_address',
    width: 200,
    slotName: 'from_address'
  },
  {
    title: 'To',
    dataIndex: 'to_address',
    width: 200,
    slotName: 'to_address'
  },
  // {
  //   title: '代币合约',
  //   dataIndex: 'token_contract',
  //   width: 200,
  //   slotName: 'token_contract'
  // },
  {
    title: '转账金额',
    dataIndex: 'amount',
    width: 150,
    slotName: 'amount'
  },
  {
    title: '代币类型',
    dataIndex: 'token_type',
    width: 100,
    slotName: 'token_type'
  },
  // {
  //   title: '函数名称',
  //   dataIndex: 'function_name',
  //   width: 150
  // },
  {
    title: '时间',
    dataIndex: 'timestamp',
    width: 180,
    slotName: 'timestamp'
  }
]

const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false
}

const convertAmountToWei = (amount: string, decimals: number = 18): string => {
  if (!amount) return ''

  // 移除空格
  const cleanAmount = amount.trim()

  // 尝试解析为数字
  const numericAmount = parseFloat(cleanAmount)
  if (!isNaN(numericAmount)) {
    // 使用 decimals 作为精度
    const weiAmount = BigInt(Math.floor(numericAmount * Math.pow(10, decimals)))
    return weiAmount.toString()
  }

  // 如果无法解析为数字，返回原值
  return cleanAmount
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { ...searchParams }
    if (params.token_types.length === 0) {
      delete (params as any).token_types
    }

    // 转换金额格式
    if (params.min_amount) {
      params.min_amount = convertAmountToWei(params.min_amount, params.decimals || 18)
    }
    if (params.max_amount) {
      params.max_amount = convertAmountToWei(params.max_amount, params.decimals || 18)
    }

    const response = await queryBatchTransfers(params) as unknown as ApiResponse<BatchTransfersResponse>
    console.log('完整API响应:', response)
    console.log('response.data:', response.data)
    console.log('response.code:', response.code)
    console.log('response.data.records:', response.data.records)

    if (response.code === 200) {
      console.log('查询成功，设置数据:', response.data.records)
      transfers.value = response.data.records || []
    } else {
      console.log('查询失败，错误信息:', response.message)
      Message.error(response.message || '查询失败')
    }
  } catch (error) {
    console.error('查询批量转账记录失败:', error)
    Message.error('查询失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await getBatchTransfersStats() as unknown as ApiResponse<StatsData>
    if (response.code === 200) {
      stats.value = response.data
      statsModalVisible.value = true
    } else {
      Message.error(response.message || '获取统计信息失败')
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    Message.error('获取统计信息失败')
  }
}

const togglePolling = () => {
  if (isPolling.value) {
    stopPolling()
  } else {
    startPolling()
  }
}

const startPolling = () => {
  if (refreshInterval.value < 1) {
    Message.error('刷新间隔必须大于0秒')
    return
  }
  
  isPolling.value = true
  fetchData()
  pollingTimer = setInterval(() => {
    fetchData()
  }, refreshInterval.value * 1000)
  
  Message.success(`开始轮询，间隔${refreshInterval.value}秒`)
}

const stopPolling = () => {
  isPolling.value = false
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  Message.info('已停止轮询')
}

const shortHash = (hash: string) => {
  if (!hash) return ''
  return hash.length > 10 ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : hash
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

const formatAmount = (amount: string, tokenType: string) => {
  if (!amount) return '0'

  // 使用 decimals 来确定精度（默认为18）
  const decimals = searchParams.decimals || 18

  // 如果是ERC20代币或NATIVE转账，都使用 decimals 精度转换
  if (tokenType === 'ERC20' || tokenType === 'NATIVE') {
    const weiAmount = BigInt(amount)
    const decimalAmount = Number(weiAmount) / Math.pow(10, decimals)
    return decimalAmount.toFixed(6)
  }

  return amount
}


const batchCopyToAddresses = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }

  // Convert selectedRowKeys to strings for comparison
  const selectedIds = selectedRowKeys.value.map(key => String(key))
  const selectedRecords = transfers.value.filter(record => selectedIds.includes(String(record.id)))
  const toAddresses = selectedRecords.map(record => record.to_address).filter(Boolean)

  // Deduplicate addresses using Set
  const uniqueAddresses = [...new Set(toAddresses)]

  if (uniqueAddresses.length === 0) {
    Message.warning('没有可复制的To地址')
    return
  }

  const addresses = uniqueAddresses.join('\n')
  copyToClipboard(addresses)
  Message.success(`已复制 ${uniqueAddresses.length} 个去重后的To地址`)
}

const fillToAddressesToFrom = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要处理的记录')
    return
  }

  // Convert selectedRowKeys to strings for comparison
  const selectedIds = selectedRowKeys.value.map(key => String(key))
  const selectedRecords = transfers.value.filter(record => selectedIds.includes(String(record.id)))
  const toAddresses = selectedRecords.map(record => record.to_address).filter(Boolean)

  // Deduplicate addresses using Set
  const uniqueAddresses = [...new Set(toAddresses)]

  if (uniqueAddresses.length === 0) {
    Message.warning('没有可填入的To地址')
    return
  }

  // Fill into From address filter with comma separation
  searchParams.from_addresses = uniqueAddresses.join(',')
  Message.success(`已将 ${uniqueAddresses.length} 个去重后的To地址填入From筛选`)
}

const addToBlacklist = async (record: BatchTransferRecord) => {
  try {
    const response = await addReceiverBlacklist({
      to_address: record.to_address,
      data_source: 'batch_transfers'
    }) as unknown as ApiResponse<any>
    if (response.code === 200) {
      Message.success('已添加到黑名单')
      fetchData()
    } else {
      Message.error(response.message || '添加到黑名单失败')
    }
  } catch (error) {
    console.error('添加到黑名单失败:', error)
    Message.error('添加到黑名单失败')
  }
}

const batchAddToBlacklist = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要添加到黑名单的记录')
    return
  }

  // Convert selectedRowKeys to strings for comparison
  const selectedIds = selectedRowKeys.value.map(key => String(key))
  const selectedRecords = transfers.value.filter(record => selectedIds.includes(String(record.id)))

  if (selectedRecords.length === 0) {
    Message.warning('没有可添加到黑名单的To地址')
    return
  }
  
  try {
    const addresses = selectedRecords.map(record => record.to_address)
    for (const address of addresses) {
      await addReceiverBlacklist({
        to_address: address,
        data_source: 'batch_transfers'
      })
    }
    Message.success(`已批量添加${addresses.length}个地址到黑名单`)
    fetchData()
  } catch (error) {
    console.error('批量添加到黑名单失败:', error)
    Message.error('批量添加到黑名单失败')
  }
}

const showBatchTagModal = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要添加标签的记录')
    return
  }

  // Convert selectedRowKeys to strings for comparison
  const selectedIds = selectedRowKeys.value.map(key => String(key))
  const selectedRecords = transfers.value.filter(record => selectedIds.includes(String(record.id)))

  if (selectedRecords.length === 0) {
    Message.warning('没有可添加标签的To地址')
    return
  }

  const addresses = selectedRecords.map(record => record.to_address).filter(Boolean).join('\n')
  batchTagForm.addresses = addresses
  batchTagForm.tag = ''
  batchTagModalVisible.value = true
}

const showTagModal = (address: string) => {
  batchTagForm.addresses = address
  batchTagForm.tag = ''
  batchTagModalVisible.value = true
}

const handleBatchTagSubmit = async () => {
  if (!batchTagForm.tag.trim()) {
    Message.error('请输入标签名称')
    return
  }
  
  try {
    const addresses = batchTagForm.addresses.split('\n').filter(addr => addr.trim())
    for (const address of addresses) {
      await addAddressTag({
        address: address.trim(),
        tag: batchTagForm.tag.trim()
      })
    }
    Message.success(`已批量添加${addresses.length}个地址标签`)
    batchTagModalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('批量添加地址标签失败:', error)
    Message.error('批量添加地址标签失败')
  }
}

onMounted(() => {
  // 组件加载时初始化参数
  initializeFromUrl()

  // 自动获取数据
  fetchData()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.arco-table {
  margin-top: 20px;
}
</style> 