<template lang="pug">
  div#targetMonitor
    .top
      span
      a-space
        a-button(shape="round" @click="fetchData") 刷新
          template(#icon)
            icon-refresh
    .mb-16
    a-form(layout="inline" :model="searchParams" @submit="startPolling")
      a-form-item(label="地址")
        a-input(v-model="searchParams.address" placeholder="请输入地址" @blur="queryTagList" allow-clear)
      a-form-item(label="标签")
        a-select(v-model="searchParams.tag" :options="tagOptions" placeholder="请选择标签" allow-clear allow-search)
      a-form-item(label="最小block_num" )
        a-input-number(v-model="searchParams.min_block_num" placeholder="请输入最小BlockNum" allow-clear)
      a-form-item(label="最大block_num" )
        a-input-number(v-model="searchParams.max_block_num" placeholder="请输入最大BlockNum" allow-clear)
      a-form-item(label="最小值" )
        a-input-number(v-model="searchParams.min_value" placeholder="请输入最小值" allow-clear)
      a-form-item(label="最大值" )
        a-input-number(v-model="searchParams.max_value" placeholder="请输入最大值" allow-clear)
      a-form-item(label="是否新地址" )
        a-select(v-model="searchParams.is_new_address" placeholder="请选择" :options="[{label:'是',value:true},{label: '否',value:false}]" allow-clear)
      a-form-item
        a-button(type="primary" html-type="submit" v-if="!isVisible" ) 开始监控
        a-button(type="primary" status="danger" @click="stopPolling" v-else) 停止监控
    .mb-16
    .table-scroll
      a-table(
        :columns="columns"
        :data="dataList"
        :pagination="pagination"
        @change="doTableChange"
        stripe
        style="min-width: 1400px;"
      )
        template(#address="{ record }")
          a-space
            a-link(:href="`https://bscscan.com/address/${record.Address}`" target="_blank") {{ formatAddress(record.Address) }}
            a-button(
              type="text"
              size="mini"
              @click="copyToClipboard(record.Address)"
            )
              template(#icon)
                icon-copy
        template(#action="{ record }")
          a-popconfirm(content="确认删除？" @ok="doDelete(record)")
            a-button(type="outline" status="danger" size="mini") 删除
              template(#icon)
                icon-delete
        template(#TxHash="{ record }")
          a-link(:href="`https://bscscan.com/tx/${record.TxHash}`" target="_blank") {{ formatHash(record.TxHash) }}
        template(#FromAddress="{ record }")
          a-link(:href="`https://bscscan.com/address/${record.FromAddress}`" target="_blank") {{ formatAddress(record.FromAddress) }}
        template(#BlockNumber="{ record }")
          a-link(:href="`https://bscscan.com/block/${record.BlockNumber}`" target="_blank") {{ record.BlockNumber }}
        template(#Value="{ record }")
          span {{ formatValue(record.Value) }}
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { analysis2, getAllTags, queryTagByFromAddress, deleteActivityAddress } from '@/api/monitor.ts'
import { IconCopy, IconRefresh, IconDelete } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import type { TableColumnData } from '@arco-design/web-vue'

interface TableRecord {
  ID?: number
  Address?: string
  Tag?: string
  TxHash?: string
  Value?: string
  FromAddress?: string
  BlockNumber?: number
  IsNewAddress?: boolean
  CreatedAt?: string
  UpdatedAt?: string
}

interface TableChangeParams {
  current: number
  pageSize: number
}

interface TagOption {
  label: string
  value: string
}

interface Tag {
  tag?: string
}

const columns = ref<TableColumnData[]>([
  {
    title: '地址',
    dataIndex: 'Address',
    slotName: 'address',
  },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
  },
  {
    title: '标签',
    dataIndex: 'Tag',
  },
  {
    title: '值',
    dataIndex: 'Value',
    slotName: 'Value',
  },
  {
    title: 'block_num',
    dataIndex: 'BlockNumber',
    slotName: 'BlockNumber',
  },
  {
    title: '是否新地址',
    dataIndex: 'IsNewAddress',
    render: ({ record }: { record: TableRecord }) => {
      return record.IsNewAddress ? '是' : '否'
    },
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    render: ({ record }: { record: TableRecord }) => {
      return dayjs(record.CreatedAt).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: '更新时间',
    dataIndex: 'UpdatedAt',
    render: ({ record }: { record: TableRecord }) => {
      return dayjs(record.UpdatedAt).format('YYYY-MM-DD HH:mm:ss')
    },
  },
])

// 数据
const dataList = ref<TableRecord[]>([])
const total = ref(0)

const isVisible = ref(false)
const timer = ref<any>(null)
// 清理定时器
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
})

const startPolling = () => {
  if (timer.value) return
  fetchData()
  timer.value = setInterval(fetchData, 10000)
  isVisible.value = true
}
const stopPolling = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
    isVisible.value = false
  }
}

const searchParams = reactive<API.AnalysisQuery>({
  is_new_address: true,
  order_by: 'block_number',
  order: 'desc',
})
const pagination = computed(() => {
  return {
    current: 1,
    pageSize: 10,
    total: total.value,
    showPageSize: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})
const doTableChange = ({ current, pageSize }: TableChangeParams) => {
  searchParams.limit = pageSize
  fetchData()
}

// 获取数据
const fetchData = async () => {
  const res = await analysis2(searchParams)
  if (res.data) {
    dataList.value = res.data.results ?? []
    total.value = res.data.total ?? 0
  } else {
    Message.error('获取数据失败')
  }
}

const mock = JSON.parse(
  '{\n' +
    '    "code": 200,\n' +
    '    "message": "success",\n' +
    '    "data": {\n' +
    '        "total": 2,\n' +
    '        "results": [\n' +
    '            {\n' +
    '                "ID": 1,\n' +
    '                "Address": "0x123...abc",\n' +
    '                "Tag": "bybit1",\n' +
    '                "TxHash": "0x789...def",\n' +
    '                "Value": "50",\n' +
    '                "FromAddress": "0x456...ghi",\n' +
    '                "BlockNumber": 49186142,\n' +
    '                "IsNewAddress": true,\n' +
    '                "CreatedAt": "2024-03-21T10:00:00Z",\n' +
    '                "UpdatedAt": "2024-03-21T10:00:00Z"\n' +
    '            },\n' +
    '            {\n' +
    '                "ID": 2,\n' +
    '                "Address": "0x123...abc",\n' +
    '                "Tag": "bybit1",\n' +
    '                "TxHash": "0x012...jkl",\n' +
    '                "Value": "30",\n' +
    '                "FromAddress": "0x456...ghi",\n' +
    '                "BlockNumber": 49186141,\n' +
    '                "IsNewAddress": true,\n' +
    '                "CreatedAt": "2024-03-21T09:59:00Z",\n' +
    '                "UpdatedAt": "2024-03-21T09:59:00Z"\n' +
    '            }\n' +
    '        ]\n' +
    '    }\n' +
    '}',
)

// 页面加载时请求一次
onMounted(() => {
  getAllTagList()
})
// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('地址已复制')
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    Message.success('地址已复制')
  }
}
const tagOptions = ref<TagOption[]>([])
const getAllTagList = async () => {
  const res = await getAllTags()
  if (res.data?.tags) {
    tagOptions.value = res.data.tags.map((tag: Tag) => ({
      label: tag.tag || '',
      value: tag.tag || ''
    }))
  }
}

const queryTagList = async () => {
  if (!searchParams.address) return
  const res = await queryTagByFromAddress({ monitor_address: searchParams.address })
  if (res.data?.tags) {
    tagOptions.value = res.data.tags.map((tag: Tag) => ({
      label: tag.tag || '',
      value: tag.tag || ''
    }))
  }
}

// 格式化地址：保留前8位和后8位
const formatAddress = (addr: string) => {
  if (!addr) return ''
  if (addr.length <= 16) return addr
  return addr.slice(0, 8) + '...' + addr.slice(-8)
}
// 格式化hash：保留前10位，后面用...
const formatHash = (hash: string) => {
  if (!hash) return ''
  if (hash.length <= 10) return hash
  return hash.slice(0, 10) + '...'
}

// 在 script 里添加 formatValue 方法
const formatValue = (val: string | number) => {
  const num = Number(val)
  if (isNaN(num)) return val
  return num.toFixed(5)
}

const doDelete = (record: TableRecord) => {
  if (!record.Address) {
    Message.error('地址不能为空')
    return
  }
  deleteActivityAddress({ address: record.Address }).then((res) => {
    if (res.code == 200) {
      Message.success('删除成功')
      fetchData()
    } else {
      Message.error('删除失败')
    }
  })
}
</script>

<style scoped lang="scss">
#targetMonitor {
  .top {
    display: flex;
    justify-content: space-between;
  }
}
.table-scroll {
  overflow-x: auto;
  width: 100%;
}
.table-scroll .arco-table {
  min-width: 1500px;
}
</style>