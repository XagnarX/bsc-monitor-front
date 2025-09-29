<template lang="pug">
  div#receiverBlacklist
    .top
      span 接收者黑名单管理
      a-space
        a-button(shape="round" @click="fetchData") 刷新
          template(#icon)
            icon-refresh
    .mb-16
    a-form(layout="inline" :model="searchParams")
      a-form-item(label="接收者地址")
        a-input(v-model="searchParams.to_address" placeholder="输入地址进行检索（支持完整地址或部分地址）" allow-clear style="width: 400px;" @press-enter="fetchData")
          template(#suffix)
            a-button(type="text" size="mini" @click="pasteAddress" v-if="!searchParams.to_address")
              | 粘贴
      a-form-item(label="数据源")
        a-select(v-model="searchParams.data_source" placeholder="选择数据源" allow-clear style="width: 200px;" @change="fetchData")
          a-option(value="query") Query
          a-option(value="bnb") BNB
      a-form-item
        a-button(type="primary" @click="fetchData") 查询
      a-form-item
        a-button(@click="resetSearch") 重置
    .mb-16
    // 搜索状态显示
    a-alert(v-if="hasSearchCondition" type="info" style="margin-bottom: 16px;" closable @close="resetSearch")
      template(#title)
        span 当前搜索条件：
        a-tag(v-if="searchParams.to_address" color="blue" style="margin-left: 8px;") 地址: {{ formatAddress(searchParams.to_address) }}
        a-tag(v-if="searchParams.data_source" color="green" style="margin-left: 8px;") 数据源: {{ searchParams.data_source }}
    a-space(style="margin-bottom: 16px;")
      a-popconfirm(content="确认批量删除选中的黑名单地址？" @ok="batchDeleteAddresses")
        a-button(type="primary" size="small" status="danger") 批量删除
    a-table(
      :columns="columns"
      :data="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
    )
      template(#to_address="{ record }")
        a-space
          a-link(:href="`https://bscscan.com/address/${record.to_address}`" target="_blank") {{ formatAddress(record.to_address) }}
          a-button(type="text" size="mini" @click="copyToClipboard(record.to_address)")
            template(#icon)
              icon-copy
      template(#data_source="{ record }")
        a-tag(:color="getDataSourceColor(record.data_source)") {{ record.data_source }}
      template(#created_at="{ record }")
        span {{ formatTime(record.created_at) }}
      template(#action="{ record }")
        a-popconfirm(content="确认删除该黑名单地址？" @ok="deleteAddress(record)")
          a-button(type="outline" status="danger" size="mini") 删除
            template(#icon)
              icon-delete
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconDelete, IconRefresh } from '@arco-design/web-vue/es/icon'
import { getReceiverBlacklist, deleteReceiverBlacklist } from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'
import type { TableColumnData } from '@arco-design/web-vue'

interface BlacklistRecord {
  id: number
  to_address: string
  data_source: string
  tag?: string
  created_at: string
}

interface SearchParams {
  to_address?: string
  data_source?: string
}

interface TableChangeParams {
  current: number
  pageSize: number
}

const columns = ref<TableColumnData[]>([
  {
    title: '接收者地址',
    dataIndex: 'to_address',
    slotName: 'to_address',
    width: 300,
  },
  {
    title: '数据源',
    dataIndex: 'data_source',
    slotName: 'data_source',
    width: 120,
  },
  {
    title: '标签',
    dataIndex: 'tag',
    width: 150,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    fixed: 'right',
  },
])

const dataList = ref<BlacklistRecord[]>([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const searchParams = reactive<SearchParams>({
  to_address: undefined,
  data_source: undefined,
})

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showPageSize: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

// 检查是否有搜索条件
const hasSearchCondition = computed(() => {
  return !!(searchParams.to_address || searchParams.data_source)
})

// 多选相关
const selectedRowKeys = ref<number[]>([])
const rowSelection = reactive({
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchParams.to_address) {
      params.to_address = searchParams.to_address.trim()
    }
    if (searchParams.data_source) {
      params.data_source = searchParams.data_source
    }
    
    const res = await getReceiverBlacklist(params)
    if (res.data) {
      dataList.value = res.data.blacklist || []
      total.value = res.data.total || 0
      
      // 如果是地址查询，显示查询结果提示
      if (searchParams.to_address) {
        const count = res.data.blacklist?.length || 0
        if (count > 0) {
          Message.success(`找到 ${count} 条匹配的黑名单记录`)
        } else {
          Message.info('未找到匹配的黑名单记录')
        }
      }
    } else {
      Message.error('获取黑名单数据失败')
    }
  } catch (e) {
    Message.error('获取黑名单数据失败')
  } finally {
    loading.value = false
  }
}

// 表格变化处理
const handleTableChange = ({ current, pageSize: size }: TableChangeParams) => {
  currentPage.value = current
  pageSize.value = size
  fetchData()
}

// 格式化地址
const formatAddress = (addr: string) => {
  if (!addr) return ''
  if (addr.length <= 16) return addr
  return addr.slice(0, 8) + '...' + addr.slice(-8)
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取数据源颜色
const getDataSourceColor = (dataSource: string) => {
  switch (dataSource) {
    case 'query':
      return 'blue'
    case 'bnb':
      return 'green'
    default:
      return 'gray'
  }
}

// 复制到剪贴板

// 删除单个地址
const deleteAddress = async (record: BlacklistRecord) => {
  try {
    await deleteReceiverBlacklist({
      to_address: record.to_address,
      data_source: record.data_source,
    })
    Message.success('删除成功')
    fetchData()
  } catch (e) {
    Message.error('删除失败')
  }
}

// 批量删除地址
const batchDeleteAddresses = async () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要删除的地址')
    return
  }
  
  const selectedRecords = dataList.value.filter(item => selectedRowKeys.value.includes(item.id))
  
  try {
    // 逐个删除（因为删除接口是单个删除）
    for (const record of selectedRecords) {
      await deleteReceiverBlacklist({
        to_address: record.to_address,
        data_source: record.data_source,
      })
    }
    Message.success(`成功删除 ${selectedRecords.length} 个地址`)
    selectedRowKeys.value = []
    fetchData()
  } catch (e) {
    Message.error('批量删除失败')
  }
}

// 重置搜索
const resetSearch = () => {
  searchParams.to_address = undefined
  searchParams.data_source = undefined
  currentPage.value = 1
  fetchData()
}

// 粘贴地址
const pasteAddress = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      searchParams.to_address = text.trim()
      Message.success('地址已粘贴')
    }
  } catch (err) {
    Message.error('粘贴失败，请手动输入地址')
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
#receiverBlacklist {
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    span {
      font-size: 18px;
      font-weight: 600;
    }
  }
}
</style> 