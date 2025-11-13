<template>
  <a-modal
    v-model:visible="visible"
    title="🚫 黑名单管理"
    :width="1200"
    :footer="false"
    unmountOnClose
    @cancel="handleClose"
  >
    <!-- Search Section -->
    <a-form layout="inline" :model="searchParams" style="margin-bottom: 16px;">
      <a-form-item label="搜索地址">
        <a-input
          v-model="searchParams.address"
          placeholder="输入地址关键字"
          style="width: 300px;"
          allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="fetchBlacklist">
            <template #icon><icon-search /></template>
            搜索
          </a-button>
          <a-button @click="resetSearch">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- Statistics -->
    <a-space style="margin-bottom: 16px;">
      <a-tag color="blue" size="large">
        <template #icon><icon-list /></template>
        总共 {{ pagination.total }} 个黑名单地址
      </a-tag>
      <a-tag v-if="selectedRowKeys.length > 0" color="orange" size="large">
        <template #icon><icon-check-circle /></template>
        已选中 {{ selectedRowKeys.length }} 个
      </a-tag>
    </a-space>

    <!-- Batch Actions -->
    <a-space style="margin-bottom: 16px;" v-if="selectedRowKeys.length > 0">
      <a-button
        type="primary"
        status="danger"
        @click="handleBatchRemove"
      >
        <template #icon><icon-delete /></template>
        批量移除选中的 {{ selectedRowKeys.length }} 个地址
      </a-button>
    </a-space>

    <!-- Blacklist Table -->
    <a-table
      :columns="columns"
      :data="blacklistData"
      :pagination="paginationConfig"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      row-key="id"
      :loading="loading"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
      :scroll="{ x: 1000, y: 500 }"
    >
      <template #address="{ record }">
        <a-space>
          <a-typography-text copyable :copy-text="record.address">
            <span style="font-family: monospace;">{{ shortHash(record.address) }}</span>
          </a-typography-text>
          <a-link
            :href="`https://bscscan.com/address/${record.address}`"
            target="_blank"
          >
            <icon-link />
          </a-link>
        </a-space>
      </template>

      <template #reason="{ record }">
        <a-tag v-if="record.reason" color="gray">{{ record.reason }}</a-tag>
        <span v-else style="color: #999;">-</span>
      </template>

      <template #created_at="{ record }">
        <a-space direction="vertical" size="mini">
          <span style="font-size: 12px;">{{ formatTime(record.created_at) }}</span>
          <span style="font-size: 11px; color: #999;">{{ formatRelativeTime(record.created_at) }}</span>
        </a-space>
      </template>

      <template #created_by="{ record }">
        <a-tag v-if="record.created_by" color="blue" size="small">{{ record.created_by }}</a-tag>
        <span v-else style="color: #999;">-</span>
      </template>

      <template #actions="{ record }">
        <a-popconfirm
          content="确定要移除这个地址吗？移除后该地址将重新出现在统计列表中（如果符合筛选条件）。"
          @ok="handleRemoveSingle(record.address)"
        >
          <a-button type="text" status="danger" size="small">
            <template #icon><icon-delete /></template>
            移除
          </a-button>
        </a-popconfirm>
      </template>
    </a-table>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconSearch,
  IconRefresh,
  IconList,
  IconCheckCircle,
  IconDelete,
  IconLink,
} from '@arco-design/web-vue/es/icon'
import { getBlacklist, removeBlacklistAddresses } from '@/api/monitor.ts'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'removed': [addresses: string[]]
}>()

// Visible state
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Watch visible to fetch data
watch(visible, (newVal) => {
  if (newVal) {
    fetchBlacklist()
  }
})

// Search params
const searchParams = ref({
  address: '',
})

// Blacklist data
const blacklistData = ref<any[]>([])
const loading = ref(false)

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
})

// Selected rows
const selectedRowKeys = ref<number[]>([])
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
}

// Table columns
const columns = [
  {
    title: '地址',
    dataIndex: 'address',
    slotName: 'address',
    width: 300,
  },
  {
    title: '原因',
    dataIndex: 'reason',
    slotName: 'reason',
    width: 200,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 180,
  },
  {
    title: '创建人',
    dataIndex: 'created_by',
    slotName: 'created_by',
    width: 120,
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100,
    fixed: 'right',
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

// Fetch blacklist
const fetchBlacklist = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }

    if (searchParams.value.address) {
      params.address = searchParams.value.address
    }

    const res: any = await getBlacklist(params)

    if (res && res.code === 200) {
      blacklistData.value = res.data.data || []
      pagination.value = {
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
      }
    } else {
      Message.error(res?.message || '加载黑名单失败')
      blacklistData.value = []
    }
  } catch (e) {
    console.error('Load blacklist failed:', e)
    Message.error('加载黑名单失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// Reset search
const resetSearch = () => {
  searchParams.value.address = ''
  pagination.value.page = 1
  fetchBlacklist()
}

// Pagination config
const paginationConfig = computed(() => ({
  total: pagination.value.total,
  current: pagination.value.page,
  pageSize: pagination.value.limit,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
}))

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchBlacklist()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.limit = pageSize
  pagination.value.page = 1
  fetchBlacklist()
}

// Remove single address
const handleRemoveSingle = async (address: string) => {
  const loadingMsg = Message.loading('正在移除...')
  try {
    const res: any = await removeBlacklistAddresses({ addresses: [address] })

    if (res && res.code === 200) {
      Message.success(`成功移除地址 ${shortHash(address)}`)
      emit('removed', [address])
      await fetchBlacklist()
      selectedRowKeys.value = []
    } else {
      Message.error(res?.message || '移除失败')
    }
  } catch (e) {
    console.error('Remove address failed:', e)
    Message.error('移除失败，请检查网络连接')
  } finally {
    loadingMsg.close()
  }
}

// Batch remove
const handleBatchRemove = async () => {
  const selectedAddresses = blacklistData.value
    .filter(item => selectedRowKeys.value.includes(item.id))
    .map(item => item.address)

  if (selectedAddresses.length === 0) {
    Message.warning('请先选择要移除的地址')
    return
  }

  const loadingMsg = Message.loading(`正在移除 ${selectedAddresses.length} 个地址...`)
  try {
    const res: any = await removeBlacklistAddresses({ addresses: selectedAddresses })

    if (res && res.code === 200) {
      Message.success(`成功移除 ${res.data.removed_count} 个地址`)
      emit('removed', selectedAddresses)
      await fetchBlacklist()
      selectedRowKeys.value = []
    } else {
      Message.error(res?.message || '批量移除失败')
    }
  } catch (e) {
    console.error('Batch remove failed:', e)
    Message.error('批量移除失败，请检查网络连接')
  } finally {
    loadingMsg.close()
  }
}

// Handle close
const handleClose = () => {
  selectedRowKeys.value = []
  searchParams.value.address = ''
}
</script>
