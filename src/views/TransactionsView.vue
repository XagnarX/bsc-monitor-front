<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="From地址">
        <a-input v-model="searchParams.from_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="Token合约">
        <a-input v-model="searchParams.token_contract" placeholder="token合约地址" style="width: 300px;" />
      </a-form-item>
      <a-form-item label="最小区块号">
        <a-input-number v-model="searchParams.min_block_num" placeholder="请输入最小区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最大区块号">
        <a-input-number v-model="searchParams.max_block_num" placeholder="请输入最大区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最小Token数量">
        <a-input v-model="searchParams.min_token_amount" placeholder="最小数量" style="width: 200px;" />
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
        <a-button type="primary" @click="togglePolling">{{ isPolling ? '停止轮询' : '开始轮询接口' }}</a-button>
      </a-form-item>
    </a-form>
    <a-space style="margin: 12px 0;">
      <a-button type="primary" size="small" @click="batchCopyToAddresses">批量复制To地址</a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data="transactions"
      :pagination="false"
      row-key="tx_hash"
      style="margin-top: 20px"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
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
      <template #token_amount="{ record }">
        <span>{{ formatTokenAmount(record.token_amount) }}</span>
      </template>
      <template #timestamp="{ record }">
        <span>{{ formatTime(record.timestamp) }}</span>
      </template>
    </a-table>
    
    <!-- 地址标签管理模态框 -->
    <a-modal v-model:visible="tagModalVisible" title="地址标签管理" width="600px" @ok="handleTagModalOk" @cancel="handleTagModalCancel">
      <div style="margin-bottom: 16px;">
        <strong>地址：</strong> {{ currentAddress }}
      </div>
      
      <!-- 现有标签列表 -->
      <div style="margin-bottom: 16px;">
        <strong>现有标签：</strong>
        <div style="margin-top: 8px;">
          <a-tag v-for="tag in currentAddressTags" :key="tag.id" color="blue" closable @close="removeTag(tag)">
            {{ tag.tag }}
            <a-tooltip v-if="tag.description" :content="tag.description">
              <icon-info-circle style="margin-left: 4px;" />
            </a-tooltip>
          </a-tag>
          <span v-if="currentAddressTags.length === 0" style="color: #999;">暂无标签</span>
        </div>
      </div>
      
      <!-- 添加新标签 -->
      <div>
        <strong>添加新标签：</strong>
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
    </a-modal>
    
    <!-- 批量地址标签管理模态框 -->
    <a-modal v-model:visible="batchTagModalVisible" title="批量添加地址标签" width="600px" @ok="handleBatchTagModalOk" @cancel="handleBatchTagModalCancel">
      <div style="margin-bottom: 16px;">
        <strong>选中的From地址数量：</strong> {{ selectedFromAddresses.length }}
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>地址列表：</strong>
        <div style="margin-top: 8px; max-height: 200px; overflow-y: auto; border: 1px solid #e8e8e8; padding: 8px; border-radius: 4px;">
          <div v-for="address in selectedFromAddresses" :key="address" style="margin-bottom: 4px;">
            <a-tag size="small">{{ shortHash(address) }}</a-tag>
          </div>
        </div>
      </div>
      
      <!-- 批量添加标签 -->
      <div>
        <strong>添加标签：</strong>
        <a-form :model="batchTagForm" layout="vertical" style="margin-top: 8px;">
          <a-form-item label="标签名">
            <a-auto-complete v-model="batchTagForm.tag" :data="uniqueTags" placeholder="输入标签名" allow-clear />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model="batchTagForm.description" placeholder="输入标签描述（可选）" :rows="2" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconDelete, IconTag, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import { getTransactions, getAddressTags, addAddressTag, updateAddressTag, deleteAddressTag, getUniqueAddressTags, batchAddAddressTags } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const searchParams = ref<Record<string, any>>({
  from_addresses: '',
  token_contract: '',
  min_token_amount: '',
  decimals: 18,
  limit: 1000,
  min_block_num: null,
  max_block_num: null,
})

// 从 URL 参数初始化 searchParams
const initializeFromUrl = () => {
  const query = route.query
  if (query.from_addresses) searchParams.value.from_addresses = String(query.from_addresses)
  if (query.token_contract) searchParams.value.token_contract = String(query.token_contract)
  if (query.min_token_amount) searchParams.value.min_token_amount = String(query.min_token_amount)
  if (query.decimals) searchParams.value.decimals = parseInt(String(query.decimals)) || 18
  if (query.limit) searchParams.value.limit = parseInt(String(query.limit)) || 1000
  if (query.min_block_num) searchParams.value.min_block_num = parseInt(String(query.min_block_num))
  if (query.max_block_num) searchParams.value.max_block_num = parseInt(String(query.max_block_num))
}

// 监听 searchParams 变化，更新 URL（避免无限循环）
let isUpdatingFromUrl = false
watch(searchParams, (newValue) => {
  if (isUpdatingFromUrl) return

  // 构建查询参数对象，只包含非空值
  const query: Record<string, any> = {}
  if (newValue.from_addresses) query.from_addresses = newValue.from_addresses
  if (newValue.token_contract) query.token_contract = newValue.token_contract
  if (newValue.min_token_amount) query.min_token_amount = newValue.min_token_amount
  if (newValue.decimals !== null && newValue.decimals !== undefined) query.decimals = newValue.decimals
  if (newValue.limit) query.limit = newValue.limit
  if (newValue.min_block_num !== null && newValue.min_block_num !== undefined) query.min_block_num = newValue.min_block_num
  if (newValue.max_block_num !== null && newValue.max_block_num !== undefined) query.max_block_num = newValue.max_block_num

  // 更新 URL，不触发导航
  router.replace({ query }).catch(() => {})
}, { deep: true })

// 监听路由变化，更新 searchParams
watch(() => route.query, (newQuery) => {
  isUpdatingFromUrl = true
  if (newQuery.from_addresses) searchParams.value.from_addresses = String(newQuery.from_addresses)
  else searchParams.value.from_addresses = ''

  if (newQuery.token_contract) searchParams.value.token_contract = String(newQuery.token_contract)
  else searchParams.value.token_contract = ''

  if (newQuery.min_token_amount) searchParams.value.min_token_amount = String(newQuery.min_token_amount)
  else searchParams.value.min_token_amount = ''

  if (newQuery.decimals) searchParams.value.decimals = parseInt(String(newQuery.decimals)) || 18
  else searchParams.value.decimals = 18

  if (newQuery.limit) searchParams.value.limit = parseInt(String(newQuery.limit)) || 1000
  else searchParams.value.limit = 1000

  if (newQuery.min_block_num) searchParams.value.min_block_num = parseInt(String(newQuery.min_block_num))
  else searchParams.value.min_block_num = null

  if (newQuery.max_block_num) searchParams.value.max_block_num = parseInt(String(newQuery.max_block_num))
  else searchParams.value.max_block_num = null

  isUpdatingFromUrl = false
}, { deep: true })

// 组件挂载后初始化
onMounted(() => {
  // 组件加载时初始化参数
  initializeFromUrl()

  // 如果 URL 中有查询参数，自动获取数据
  if (Object.keys(route.query).length > 0) {
    fetchData()
  }
})

const transactions = ref<any[]>([])

const columns = [
  { title: '区块号', dataIndex: 'block_number' },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash' },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address' },
  { title: 'To地址', dataIndex: 'to_address', slotName: 'to_address' },
  { title: 'Token数量', dataIndex: 'token_amount', slotName: 'token_amount' },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp' },
]

const shortHash = (val: string) => {
  if (!val) return ''
  return val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
}

const formatTime = (val: string) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}

const formatTokenAmount = (val: string | number) => {
  if (!val) return '0'
  const num = typeof val === 'string' ? parseFloat(val) : val
  // 使用 decimals 将最小单位转换为可读金额（默认为18）
  const decimals = searchParams.value.decimals || 18
  const readableAmount = num / Math.pow(10, decimals)
  return readableAmount.toFixed(6)
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
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    // 处理最小Token数量
    if (params.min_token_amount && params.decimals !== undefined) {
      // 只做一次转换，避免重复点击导致指数增长
      if (!/e\+?\d+$/i.test(String(params.min_token_amount))) {
        const decimals = parseInt(params.decimals)
        if (!isNaN(decimals)) {
          params.min_token_amount = (BigInt(params.min_token_amount) * BigInt(Math.pow(10, decimals))).toString()
        }
      }
    }
    const res = await getTransactions(params)
    console.log('完整响应:', res) // 调试日志

    // 多种数据结构适配（注意：res 是 axios 响应，实际数据在 res.data 中）
    let transactionsList = []
    if (res?.data?.transactions) {
      // 结构1: axios包装后: { data: { transactions: [...] } }
      transactionsList = res.data.transactions
    } else if (Array.isArray(res?.data)) {
      // 结构2: { data: [...] } - 直接数组 (这是当前API返回的格式)
      transactionsList = res.data
    } else if (res?.data && typeof res?.data === 'object') {
      // 结构3: { data: { ... } } - 对象，可能有其他字段
      // 尝试常见的数组字段名
      if (Array.isArray((res as any).data?.list)) transactionsList = (res as any).data.list
      else if (Array.isArray((res as any).data?.items)) transactionsList = (res as any).data.items
      else if (Array.isArray((res as any).data?.rows)) transactionsList = (res as any).data.rows
      else if (Array.isArray((res as any).data?.results)) transactionsList = (res as any).data.results
      else if (Array.isArray((res as any).data?.data)) transactionsList = (res as any).data.data
      else transactionsList = []
    } else {
      transactionsList = []
    }

    console.log('原始交易列表长度:', transactionsList.length)
    console.log('原始交易列表前2条:', JSON.stringify(transactionsList.slice(0, 2), null, 2)) // 详细打印原始数据

    // 字段映射：将 API 返回的字段名转换为前端期望的字段名
    transactionsList = transactionsList.map((item: any, index: number) => {
      // 兼容不同大小写的字段名
      const mappedItem = {
        tx_hash: item.TxHash || item.tx_hash || item.TxHashHex || item.hash || '',
        from_address: item.FromAddress || item.from_address || item.from || '',
        to_address: item.ToAddress || item.to_address || item.to || '',
        block_number: item.BlockNumber || item.block_number || item.blockNumber || 0,
        timestamp: item.Timestamp || item.timestamp || item.CreatedAt || item.createdAt || '',
        token_amount: item.TokenAmount || item.token_amount || item.Value || item.value || '0',
      }
      if (index < 2) {
        console.log(`第${index + 1}条映射结果:`, JSON.stringify(mappedItem, null, 2))
      }
      return mappedItem
    })

    console.log('映射后的交易列表前2条:', JSON.stringify(transactionsList.slice(0, 2), null, 2)) // 只打印前2条用于调试

    transactions.value = transactionsList
    console.log('设置的交易列表:', transactionsList) // 调试日志
  } catch (e: any) {
    console.error('查询失败:', e) // 详细错误日志
    const errorMsg = e?.response?.data?.message || e?.message || '未知错误'
    Message.error('查询失败: ' + errorMsg)
  }
}

// copyToClipboard function is now imported from utils/clipboard.ts

// 多选相关
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// 批量复制To地址
const batchCopyToAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的To地址')
    return
  }
  const toAddresses = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.to_address)
    .filter(Boolean)
    .join('\n')
  if (!toAddresses) {
    Message.warning('没有可复制的To地址')
    return
  }
  copyToClipboard(toAddresses, '已复制所选To地址', '复制失败')
}

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

// 批量地址标签管理相关
const batchTagModalVisible = ref(false)
const selectedFromAddresses = ref<string[]>([])
const batchTagForm = ref({
  tag: '',
  description: ''
})

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
    console.error('加载地址标签失败:', e)
    currentAddressTags.value = []
    Message.error('加载地址标签失败')
  }
}

// 加载所有唯一标签
const loadUniqueTags = async () => {
  try {
    const res = await getUniqueAddressTags()
    uniqueTags.value = res.data?.tags || []
  } catch (e) {
    console.error('加载标签列表失败')
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
    Message.success('添加标签成功')
    tagForm.value.tag = ''
    tagForm.value.description = ''
    await loadAddressTags(currentAddress.value)
    await loadUniqueTags()
  } catch (e) {
    Message.error('添加标签失败')
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
    Message.success('删除标签成功')
    await loadAddressTags(currentAddress.value)
  } catch (e) {
    Message.error('删除标签失败')
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

// 显示批量标签管理模态框
const showBatchTagModal = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择交易记录')
    return
  }
  
  // 获取选中交易的From地址（去重）
  const addresses = [...new Set(transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.from_address)
    .filter(Boolean))]
  
  if (!addresses.length) {
    Message.warning('没有可添加标签的From地址')
    return
  }
  
  selectedFromAddresses.value = addresses
  batchTagModalVisible.value = true
  loadUniqueTags()
}

// 批量标签模态框确认
const handleBatchTagModalOk = async () => {
  if (!batchTagForm.value.tag.trim()) {
    Message.warning('请输入标签名')
    return
  }
  
  if (!selectedFromAddresses.value.length) {
    Message.warning('没有可添加标签的地址')
    return
  }
  
  try {
    await batchAddAddressTags({
      addresses: selectedFromAddresses.value,
      tag: batchTagForm.value.tag.trim(),
      description: batchTagForm.value.description.trim()
    })
    Message.success(`成功为 ${selectedFromAddresses.value.length} 个地址添加标签`)
    batchTagModalVisible.value = false
    batchTagForm.value.tag = ''
    batchTagForm.value.description = ''
    selectedFromAddresses.value = []
  } catch (e) {
    Message.error('批量添加标签失败')
  }
}

// 批量标签模态框取消
const handleBatchTagModalCancel = () => {
  batchTagModalVisible.value = false
  batchTagForm.value.tag = ''
  batchTagForm.value.description = ''
  selectedFromAddresses.value = []
}

onUnmounted(() => {
  stopPolling()
})
</script> 