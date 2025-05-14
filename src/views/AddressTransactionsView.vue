<template lang="pug">
  div#addressTransactions
    .top 交易明细
    .mb-16
      span 地址：{{ address }}
      span(style="margin-left: 24px;") 统计周期：{{ periodLabel }}
    a-table(:columns="columns" :data="dataList" :pagination="false" stripe)
      template(#tx_hash="{ record }")
        a-link(:href="record.tx_url" target="_blank") {{ record.tx_hash }}
      template(#block_number="{ record }")
        a-link(:href="record.block_url" target="_blank") {{ record.block_number }}
      template(#from_address="{ record }")
        a-link(:href="record.from_url" target="_blank") {{ record.from_address }}
      template(#to_address="{ record }")
        a-link(:href="record.to_url" target="_blank") {{ record.to_address }}
      template(#timestamp="{ record }")
        span {{ formatDate(record.timestamp) }}
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAddressTransactions } from '@/api/monitor.ts'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import type { AxiosResponse } from 'axios'

const route = useRoute()
const address = route.query.address as string || ''
const period = route.query.period as string || '24h'

type PeriodType = '1h' | '24h' | '7d' | '30d'
const periodLabelMap: Record<PeriodType, string> = {
  '1h': '1小时',
  '24h': '24小时',
  '7d': '7天',
  '30d': '30天',
}
const periodLabel = periodLabelMap[period as PeriodType] || period

const columns = [
  { title: '交易哈希', dataIndex: 'tx_hash', slotName: 'tx_hash' },
  { title: '区块号', dataIndex: 'block_number', slotName: 'block_number' },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address' },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address' },
  { title: '金额', dataIndex: 'value' },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp' },
]

type Transaction = {
  tx_hash: string
  tx_url: string
  block_number: string
  block_url: string
  from_address: string
  from_url: string
  to_address: string
  to_url: string
  value: string
  timestamp: string
}

const dataList = ref<Transaction[]>([])

interface ApiResponse {
  transactions: Transaction[]
  message?: string
}

const fetchData = async () => {
  try {
    const res = await getAddressTransactions({ address, period }) as AxiosResponse<ApiResponse>
    if (res.data?.transactions) {
      dataList.value = res.data.transactions
    } else {
      dataList.value = []
      Message.error(res.data?.message || '未获取到数据')
    }
  } catch (e) {
    Message.error('请求失败')
  }
}
onMounted(fetchData)

const formatDate = (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
</script>

<style scoped lang="scss">
#addressTransactions {
  .top {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
  }
}
</style> 