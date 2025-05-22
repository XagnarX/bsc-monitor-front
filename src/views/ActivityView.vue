<template lang="pug">
  div#activityStats
    .top 活跃度统计
    a-form(layout="inline" :model="searchParams" @submit.prevent="fetchData")
      a-form-item(label="标签")
        a-input(v-model="searchParams.tag" placeholder="请输入标签" allow-clear)
      a-form-item(label="地址")
        a-input(v-model="searchParams.address" placeholder="请输入地址" allow-clear)
      a-form-item(label="过滤条件")
        a-select(v-model="searchParams.filter" :options="filterOptions" allow-clear)
      a-form-item(label="统计周期")
        a-select(v-model="searchParams.period" :options="periodOptions" allow-clear)
      a-form-item(label="开始时间")
        a-date-picker(v-model="searchParams.start_time" show-time format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开始时间" style="width:180px")
      a-form-item(label="结束时间")
        a-date-picker(v-model="searchParams.end_time" show-time format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择结束时间" style="width:180px")
      a-form-item
        a-button(type="primary" @click="startPolling" v-if="!isVisible" :loading="loading") 开始监控
        a-button(type="primary" status="danger" @click="stopPolling" v-else) 停止监控
        a-button(shape="round" @click="fetchData" style="margin-left: 8px;" :loading="loading") 刷新
          template(#icon)
            icon-refresh
    .mb-16
    a-table(:columns="columns" :data="dataList" :pagination="false" stripe size="mini")
      template(#address="{ record }")
        a-space
          a-link(:href="`https://bscscan.com/address/${record.address}`" target="_blank") {{ formatAddress(record.address) }}
          a-button(type="text" size="mini" @click="copyToClipboard(record.address)")
            template(#icon)
              icon-copy
      template(#tx_count="{ record }")
        a-button(type="text" @click="goToTransactions(record)") {{ record.tx_count }}
      template(#last_active="{ record }")
        span {{ formatDate(record.last_active) }}
      template(#period="{ record }")
        span {{ formatPeriod(record.period) }}
      template(#action="{ record }")
        a-space
          a-tooltip(:content="record.is_pinned ? '取消置顶' : '置顶'")
            a-button(
              type="text"
              size="mini"
              @click="togglePin(record)"
              :loading="pinLoading"
              :style="{ color: record.is_pinned ? '#165DFF' : '#C0C4CC' }"
            )
              template(#icon)
                icon-pushpin
          a-popconfirm(content="确认删除？" @ok="doDelete(record)")
            a-button(type="outline" status="danger" size="mini") 删除
              template(#icon)
                icon-delete
    a-drawer(
      v-model:visible="drawerVisible"
      title="交易明细"
      :width="drawerWidth"
      :footer="false"
      :body-style="{padding: '0', height: '100%'}"
      :mask-closable="false"
    )
      .drawer-table-scroll
        a-table(
          :columns="txColumns"
          :data="drawerTransactions"
          :pagination="false"
          size="mini"
        )
          template(#tx_hash="{ record }")
            a-space
              a-link(:href="`https://bscscan.com/tx/${record.tx_hash}`" target="_blank") {{ formatHash(record.tx_hash) }}
              a-button(type="text" size="mini" @click="copyToClipboard(record.tx_hash)")
                template(#icon)
                  icon-copy
          template(#from_address="{ record }")
            a-space
              a-link(:href="`https://bscscan.com/address/${record.from_address}`" target="_blank") {{ formatAddress(record.from_address) }}
              a-button(type="text" size="mini" @click="copyToClipboard(record.from_address)")
                template(#icon)
                  icon-copy
          template(#to_address="{ record }")
            a-space
              a-link(:href="`https://bscscan.com/address/${record.to_address}`" target="_blank") {{ formatAddress(record.to_address) }}
              a-button(type="text" size="mini" @click="copyToClipboard(record.to_address)")
                template(#icon)
                  icon-copy
          template(#timestamp="{ record }")
            span {{ formatDate(record.timestamp) }}
          template(#block_number="{ record }")
            a-space
              a-link(:href="`https://bscscan.com/block/${record.block_number}`" target="_blank") {{ record.block_number }}
              a-button(type="text" size="mini" @click="copyToClipboard(record.block_number)")
                template(#icon)
                  icon-copy
          template(#value="{ record }")
            span {{ formatValue(record.value) }}
</template>
<script setup lang="ts">
import { ref, onUnmounted, onMounted, watch } from 'vue'
import { getActivityStats, deleteActivityAddress, getAddressTransactions, getPinnedAddresses, addPinnedAddress, removePinnedAddress } from '@/api/monitor.ts'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import utc from 'dayjs/plugin/utc'
import type { AxiosResponse } from 'axios'
import { IconDelete, IconRefresh, IconCopy, IconPushpin } from '@arco-design/web-vue/es/icon'

interface ApiResponse {
  stats: ActivityRecord[]
  message?: string
}

interface Period {
  start: string
  end: string
}

interface ActivityRecord {
  address: string
  tag: string
  tx_count: number
  total_in: string
  total_out: string
  last_active: string
  period: Period
  is_pinned?: boolean
}

type FilterType = 'all' | 'active' | 'inactive'

interface SearchParams {
  tag: string
  address: string
  filter: FilterType
  period: string
  start_time: string
  end_time: string
}

const router = useRouter()

const columns = [
  { 
    title: '地址', 
    dataIndex: 'address', 
    slotName: 'address',
    width: 280
  },
  { 
    title: '操作', 
    dataIndex: 'action', 
    slotName: 'action',
    width: 160,
    fixed: 'right'
  },
  { title: '标签', dataIndex: 'tag' },
  { title: '交易次数', dataIndex: 'tx_count', slotName: 'tx_count' },
  { title: '总流入', dataIndex: 'total_in' },
  { title: '总流出', dataIndex: 'total_out' },
  { 
    title: '最后活跃时间', 
    dataIndex: 'last_active', 
    render: ({ record }: { record: ActivityRecord }) => record.last_active ? record.last_active.replace('T', ' ').slice(0, 19) : '',
  },
  { title: '统计周期', dataIndex: 'period', slotName: 'period' },
]

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '活跃', value: 'active' },
  { label: '不活跃', value: 'inactive' },
]
const periodOptions = [
  { label: '1小时', value: '1h' },
  { label: '12小时', value: '12h' },
  { label: '24小时', value: '24h' },
  { label: '3天', value: '3d' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
]

const searchParams = ref<SearchParams>({
  tag: '',
  address: '',
  filter: 'active',
  period: '1h',
  start_time: '',
  end_time: '',
})
const dataList = ref<ActivityRecord[]>([])
const isVisible = ref(false)
const timer = ref<number | null>(null)
const loading = ref(false)
const pinLoading = ref(false)
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerTransactions = ref<any[]>([])
const drawerAddress = ref('')
const drawerWidth = ref(800)
const pinnedAddresses = ref<Set<string>>(new Set())

dayjs.extend(utc)

const fetchData = async () => {
  loading.value = true
  try {
    const params = { ...searchParams.value }
    if (params.start_time) {
      params.start_time = dayjs(params.start_time).utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    }
    if (params.end_time) {
      params.end_time = dayjs(params.end_time).utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    }
    const res = await getActivityStats(params) as AxiosResponse<ApiResponse>
    setTimeout(() => {      
      if (res.data?.stats && Array.isArray(res.data.stats)) {
        dataList.value = res.data.stats.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return 0
        })
      } else {
        dataList.value = []
        Message.error(res.data?.message || '未获取到数据')
      }
      loading.value = false
    }, 3000)
  } catch (e) {
    Message.error('请求失败')
    loading.value = false
  }
}

const formatDate = (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
const formatPeriod = (period: Period) => {
  if (!period || !period.start || !period.end) return ''
  return `${dayjs(period.start).format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs(period.end).format('YYYY-MM-DD HH:mm:ss')}`
}

const startPolling = () => {
  if (timer.value) return
  fetchData()
  timer.value = setInterval(fetchData, 10000) // 10秒轮询
  isVisible.value = true
}
const stopPolling = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
    isVisible.value = false
  }
}

const formatHash = (hash: string) => {
  if (!hash) return ''
  return hash.slice(0, 10) + '...'
}

const formatValue = (value: string | number) => {
  if (!value) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(6)
}

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('复制成功')
  } catch (e) {
    Message.error('复制失败')
  }
}

const txColumns = [
  { 
    title: '交易哈希', 
    dataIndex: 'tx_hash',
    slotName: 'tx_hash',
    width: 180
  },
  { 
    title: '区块号', 
    dataIndex: 'block_number',
    slotName: 'block_number',
    width: 180
  },
  { 
    title: 'From', 
    dataIndex: 'from_address',
    slotName: 'from_address',
    width: 180
  },
  { 
    title: 'To', 
    dataIndex: 'to_address',
    slotName: 'to_address',
    width: 180
  },
  { 
    title: '金额', 
    dataIndex: 'value',
    slotName: 'value',
    width: 120
  },
  { title: '时间', dataIndex: 'timestamp', slotName: 'timestamp' },
]

const goToTransactions = async (record: ActivityRecord) => {
  drawerAddress.value = record.address
  drawerVisible.value = true
  drawerLoading.value = true

  // 拼接请求参数
  const address = record.address
  const period = searchParams.value.period
  const start_time = searchParams.value.start_time
    ? dayjs(searchParams.value.start_time).format('YYYY-MM-DDTHH:mm:ssZ')
    : undefined
  const end_time = searchParams.value.end_time
    ? dayjs(searchParams.value.end_time).format('YYYY-MM-DDTHH:mm:ssZ')
    : undefined

  try {
    const res = await getAddressTransactions({
      address,
      period,
      ...(start_time ? { start_time } : {}),
      ...(end_time ? { end_time } : {})
    })
    drawerTransactions.value = res.data?.transactions || []
  } catch (e) {
    Message.error('获取交易明细失败')
    drawerTransactions.value = []
  } finally {
    drawerLoading.value = false
  }
}

const doDelete = async (record: ActivityRecord) => {
  try {
    await deleteActivityAddress({ address: record.address, tag: record.tag })
    Message.success('删除成功')
    fetchData()
  } catch (e) {
    Message.error('删除失败')
  }
}

const togglePin = async (record: ActivityRecord) => {
  if (pinLoading.value) return
  pinLoading.value = true
  try {
    if (record.is_pinned) {
      await removePinnedAddress({ address: record.address, tag: record.tag })
      Message.success('已取消置顶')
    } else {
      await addPinnedAddress({ address: record.address, tag: record.tag })
      Message.success('已置顶')
    }
    await fetchData()
  } catch (e) {
    Message.error('操作失败')
  } finally {
    pinLoading.value = false
  }
}

onMounted(() => {
  startPolling()
  drawerWidth.value = Math.floor(window.innerWidth * 1 / 2)
  window.addEventListener('resize', updateDrawerWidth)
})

const updateDrawerWidth = () => {
  drawerWidth.value = Math.floor(window.innerWidth * 1 / 2)
}

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  window.removeEventListener('resize', updateDrawerWidth)
})

watch(drawerVisible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped lang="scss">
#activityStats {
  .top {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
  }
}

.drawer-table-scroll {
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style> 