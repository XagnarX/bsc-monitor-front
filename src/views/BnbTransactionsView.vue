<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="From地址">
        <a-input v-model="searchParams.from_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="To地址">
        <a-input v-model="searchParams.to_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="最小区块号">
        <a-input-number v-model="searchParams.min_block_num" placeholder="请输入最小区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最大区块号">
        <a-input-number v-model="searchParams.max_block_num" placeholder="请输入最大区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最小BNB数量">
        <a-input v-model="searchParams.min_value" placeholder="最小数量(BNB)" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最大BNB数量">
        <a-input v-model="searchParams.max_value" placeholder="最大数量(BNB)" style="width: 200px;" />
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
      <a-button type="primary" size="small" @click="batchCopyToAddresses">去重并批量复制To地址</a-button>
      <a-button type="primary" size="small" @click="fillToAddressesToFrom">将To地址填入From筛选</a-button>
      <a-popconfirm content="确认批量将选中的接收者添加到黑名单？" @ok="batchAddToBlacklist">
        <a-button type="primary" size="small" status="danger">批量添加到黑名单</a-button>
      </a-popconfirm>
      <a-button type="primary" size="small" @click="showBatchTagModal">批量添加地址标签</a-button>
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
          <a-popconfirm content="确认将该接收者添加到黑名单？" @ok="addToBlacklist(record)">
            <a-button type="text" size="mini" status="danger">
              <icon-delete />
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
      <template #value="{ record }">
        <span>{{ formatBnbValue(record.value) }} BNB</span>
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
import { ref, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconDelete, IconTag, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import { getBnbTransactions, addReceiverBlacklist, deleteReceiverBlacklist, batchDeleteReceiverBlacklist, getAddressTags, addAddressTag, deleteAddressTag, getUniqueAddressTags, batchAddAddressTags } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

const searchParams = ref<Record<string, any>>({
  from_addresses: '',
  to_addresses: '',
  min_value: '',
  max_value: '',
  limit: 1000,
  min_block_num: null,
  max_block_num: null,
})

const transactions = ref<any[]>([])

const columns = [
  { title: '区块号', dataIndex: 'block_number' },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash' },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address' },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address' },
  { title: 'BNB数量', dataIndex: 'value', slotName: 'value' },
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

const formatBnbValue = (val: string | number) => {
  if (!val) return '0'
  const num = typeof val === 'string' ? parseFloat(val) : val
  // 将wei转换为BNB（1 BNB = 10^18 wei）
  const bnbValue = num / Math.pow(10, 18)
  return bnbValue.toFixed(6)
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
    
    // 处理BNB数量转换为wei
    if (params.min_value) {
      params.min_value = (parseFloat(params.min_value) * Math.pow(10, 18)).toString()
    }
    if (params.max_value) {
      params.max_value = (parseFloat(params.max_value) * Math.pow(10, 18)).toString()
    }
    
    const res = await getBnbTransactions(params)
    transactions.value = res.data?.transactions || []
  } catch (e) {
    Message.error('查询失败')
  }
}


// 多选相关
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// 去重并批量复制To地址
const batchCopyToAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的记录')
    return
  }

  const toAddresses = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.to_address)
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

// 将To地址填入From筛选
const fillToAddressesToFrom = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要处理的记录')
    return
  }

  const toAddresses = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.to_address)
    .filter(Boolean)

  // Deduplicate addresses using Set
  const uniqueAddresses = [...new Set(toAddresses)]

  if (!uniqueAddresses.length) {
    Message.warning('没有可填入的To地址')
    return
  }

  // Fill into From address filter with comma separation
  searchParams.value.from_addresses = uniqueAddresses.join(',')
  Message.success(`已将 ${uniqueAddresses.length} 个去重后的To地址填入From筛选`)
}

// 添加接收者到黑名单
const addToBlacklist = async (record: any) => {
  if (!record.to_address) {
    Message.error('接收者地址不能为空')
    return
  }
  try {
    await addReceiverBlacklist({
      to_address: record.to_address,
      data_source: 'bnb',
      tag: 'bnb_transaction'
    })
    Message.success('已添加到黑名单')
    // 从当前列表中移除包含该接收者地址的交易记录
    transactions.value = transactions.value.filter(item => item.to_address !== record.to_address)
  } catch (e) {
    Message.error('添加到黑名单失败')
  }
}

// 批量添加接收者到黑名单
const batchAddToBlacklist = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要添加到黑名单的接收者')
    return
  }
  
  const selectedReceivers = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.to_address)
    .filter(Boolean) // 过滤掉空地址
  
  if (!selectedReceivers.length) {
    Message.warning('没有可添加到黑名单的接收者')
    return
  }
  
  try {
    // 逐个添加到黑名单
    for (const address of selectedReceivers) {
      await addReceiverBlacklist({
        to_address: address,
        data_source: 'bnb',
        tag: 'bnb_batch_add'
      })
    }
    Message.success(`成功添加 ${selectedReceivers.length} 个接收者到黑名单`)
    selectedRowKeys.value = [] // 清空选择
    // 从当前列表中移除包含这些接收者地址的交易记录
    transactions.value = transactions.value.filter(item => !selectedReceivers.includes(item.to_address))
  } catch (e) {
    Message.error('批量添加到黑名单失败')
  }
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