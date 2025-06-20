<template>
  <div>
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="From地址">
        <a-input v-model="searchParams.from_addresses" placeholder="多个地址用逗号分隔" style="width: 400px;" />
      </a-form-item>
      <a-form-item label="Token合约">
        <a-input v-model="searchParams.token_contract" placeholder="token合约地址" style="width: 300px;" />
      </a-form-item>
      <a-form-item label="起始区块号">
        <a-input-number v-model="searchParams.startblocknum" placeholder="请输入起始区块号" style="width: 200px;" />
      </a-form-item>
      <a-form-item label="最小Token数量">
        <a-input v-model="searchParams.min_token_amount" placeholder="最小数量" style="width: 200px;" />
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
    <a-button type="primary" size="small" style="margin: 12px 0;" @click="batchCopyTokenContracts">批量复制接收者</a-button>
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
      <template #token_contract="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/address/${record.token_contract}`" target="_blank">{{ shortHash(record.token_contract) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.token_contract)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #timestamp="{ record }">
        <span>{{ formatTime(record.timestamp) }}</span>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy } from '@arco-design/web-vue/es/icon'
import { getTransactions } from '@/api/monitor.ts'
import dayjs from 'dayjs'

const searchParams = ref<Record<string, any>>({
  from_addresses: '',
  token_contract: '',
  min_token_amount: '',
  limit: 10000,
  startblocknum: null,
})

const transactions = ref<any[]>([])

const columns = [
  { title: '区块号', dataIndex: 'block_number' },
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash' },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address' },
  { title: 'ERC20合约', dataIndex: 'to_address', slotName: 'to_address' },
  { title: 'Token数量', dataIndex: 'token_amount_decimal' },
  { title: '接收者', dataIndex: 'token_contract', slotName: 'token_contract' },
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

const refreshInterval = ref<number>(5)
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
    if (params.min_token_amount) {
      // 只做一次转换，避免重复点击导致指数增长
      if (!/e\+?\d+$/i.test(String(params.min_token_amount))) {
        params.min_token_amount = (BigInt(params.min_token_amount) * 1000000000000000000n).toString()
      }
    }
    const res = await getTransactions(params)
    transactions.value = res.data?.transactions || []
  } catch (e) {
    Message.error('查询失败')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('已复制')
  } catch {
    Message.error('复制失败')
  }
}

// 多选相关
const selectedRowKeys = ref<string[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// 批量复制接收者
const batchCopyTokenContracts = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要复制的接收者')
    return
  }
  const contracts = transactions.value
    .filter(item => selectedRowKeys.value.includes(item.tx_hash))
    .map(item => item.token_contract)
    .filter(Boolean)
    .join('\n')
  if (!contracts) {
    Message.warning('没有可复制的接收者')
    return
  }
  try {
    await navigator.clipboard.writeText(contracts)
    Message.success('已复制所选接收者')
  } catch {
    Message.error('复制失败')
  }
}

onUnmounted(() => {
  stopPolling()
})
</script> 