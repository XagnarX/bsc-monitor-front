<template>
  <div>
    <!-- 搜索和过滤区域 -->
    <a-form layout="inline" :model="searchParams" @submit.prevent="fetchData">
      <a-form-item label="合约地址">
        <a-input v-model="searchParams.contract_address" placeholder="输入合约地址" style="width: 300px;" allow-clear />
      </a-form-item>
      <a-form-item label="链ID">
        <a-select v-model="searchParams.chain_id" placeholder="选择链ID" style="width: 150px;" allow-clear>
          <a-option :value="56">BSC (56)</a-option>
          <a-option :value="1">Ethereum (1)</a-option>
          <a-option :value="137">Polygon (137)</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="验证状态">
        <a-select v-model="searchParams.verified" placeholder="选择验证状态" style="width: 150px;" allow-clear>
          <a-option :value="true">已验证</a-option>
          <a-option :value="false">未验证</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="fetchData">查询</a-button>
      </a-form-item>
      <a-form-item>
        <a-button @click="resetSearch">重置</a-button>
      </a-form-item>
    </a-form>

    <!-- 操作按钮区域 -->
    <a-space style="margin: 16px 0;">
      <a-button type="primary" @click="showAddModal">
        <template #icon><icon-plus /></template>
        添加代币
      </a-button>
      <a-button @click="fetchData">
        <template #icon><icon-refresh /></template>
        刷新
      </a-button>
      <a-button @click="exportTokens">
        <template #icon><icon-download /></template>
        导出CSV
      </a-button>
    </a-space>

    <!-- 代币列表表格 -->
    <a-table
      :columns="columns"
      :data="tokens"
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100']
      }"
      :loading="loading"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #token_contract="{ record }">
        <a-space>
          <a-link :href="`https://bscscan.com/token/${record.token_contract}`" target="_blank">
            {{ shortHash(record.token_contract) }}
          </a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.token_contract)">
            <icon-copy />
          </a-button>
        </a-space>
      </template>
      <template #is_verified="{ record }">
        <a-switch 
          v-model="record.is_verified" 
          @change="updateVerifyStatus(record)"
          :loading="verifyLoading[record.token_contract]"
        />
      </template>
      <template #created_at="{ record }">
        <span>{{ formatTime(record.created_at) }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-button type="text" size="small" @click="showEditModal(record)">
            <template #icon><icon-edit /></template>
            编辑
          </a-button>
          <a-popconfirm content="确认删除该代币？" @ok="deleteTokenById(record)">
            <a-button type="text" size="small" status="danger">
              <template #icon><icon-delete /></template>
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 添加/编辑代币模态框 -->
    <a-modal 
      v-model:visible="modalVisible" 
      :title="isEdit ? '编辑代币' : '添加代币'"
      width="600px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :ok-loading="submitLoading"
    >
      <a-form :model="tokenForm" layout="vertical" ref="formRef">
        <a-form-item 
          label="合约地址" 
          field="token_contract"
          :rules="[
            { required: true, message: '请输入合约地址' },
            { match: /^0x[a-fA-F0-9]{40}$/, message: '请输入正确的以太坊地址格式' }
          ]"
        >
          <a-input 
            v-model="tokenForm.token_contract" 
            placeholder="0x..." 
            :disabled="isEdit"
          />
        </a-form-item>
        <a-form-item 
          label="代币符号" 
          field="token_symbol"
          :rules="[{ required: true, message: '请输入代币符号' }]"
        >
          <a-input v-model="tokenForm.token_symbol" placeholder="如: USDT" />
        </a-form-item>
        <a-form-item 
          label="代币名称" 
          field="token_name"
          :rules="[{ required: true, message: '请输入代币名称' }]"
        >
          <a-input v-model="tokenForm.token_name" placeholder="如: Tether USD" />
        </a-form-item>
        <a-form-item 
          label="小数位数" 
          field="token_decimals"
          :rules="[
            { required: true, message: '请输入小数位数' },
            { type: 'number', min: 0, max: 255, message: '小数位数必须在0-255之间' }
          ]"
        >
          <a-input-number 
            v-model="tokenForm.token_decimals" 
            :min="0" 
            :max="255" 
            placeholder="18"
            style="width: 100%;"
          />
        </a-form-item>
        <a-form-item 
          label="链ID" 
          field="chain_id"
          :rules="[{ required: true, message: '请选择链ID' }]"
        >
          <a-select v-model="tokenForm.chain_id" placeholder="选择链ID" :disabled="isEdit">
            <a-option :value="56">BSC (56)</a-option>
            <a-option :value="1">Ethereum (1)</a-option>
            <a-option :value="137">Polygon (137)</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="验证状态">
          <a-switch v-model="tokenForm.is_verified">
            <template #checked>已验证</template>
            <template #unchecked>未验证</template>
          </a-switch>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { 
  IconPlus, 
  IconRefresh, 
  IconDownload, 
  IconEdit, 
  IconDelete, 
  IconCopy 
} from '@arco-design/web-vue/es/icon'
import { 
  getAllTokens, 
  addToken, 
  updateToken, 
  deleteToken, 
  updateTokenVerifyStatus 
} from '@/api/monitor.ts'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

// 接口类型定义
interface Token {
  id: number
  token_contract: string
  token_symbol: string
  token_name: string
  token_decimals: number
  chain_id: number
  is_verified: boolean
  created_at: string
  updated_at: string
  bscscan_url?: string
}

interface TokenForm {
  token_contract: string
  token_symbol: string
  token_name: string
  token_decimals: number | null
  chain_id: number | null
  is_verified: boolean
}

// 响应式数据
const tokens = ref<Token[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const verifyLoading = ref<Record<string, boolean>>({})
const formRef = ref()

// 搜索参数
const searchParams = reactive({
  contract_address: '',
  chain_id: null as number | null,
  verified: null as boolean | null,
})

// 分页参数
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
})

// 表单数据
const tokenForm = reactive<TokenForm>({
  token_contract: '',
  token_symbol: '',
  token_name: '',
  token_decimals: null,
  chain_id: null,
  is_verified: false,
})

// 当前编辑的代币
const currentToken = ref<Token | null>(null)

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '合约地址',
    dataIndex: 'token_contract',
    slotName: 'token_contract',
    width: 180,
  },
  {
    title: '符号',
    dataIndex: 'token_symbol',
    width: 100,
  },
  {
    title: '名称',
    dataIndex: 'token_name',
    width: 200,
  },
  {
    title: '小数位数',
    dataIndex: 'token_decimals',
    width: 100,
  },
  {
    title: '链ID',
    dataIndex: 'chain_id',
    width: 80,
  },
  {
    title: '验证状态',
    dataIndex: 'is_verified',
    slotName: 'is_verified',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    slotName: 'action',
    width: 150,
    fixed: 'right',
  },
]

// 工具函数
const shortHash = (val: string) => {
  if (!val) return ''
  return val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
}

const formatTime = (val: string) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}


// 数据获取
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchParams.contract_address.trim()) params.contract_address = searchParams.contract_address.trim()
    if (searchParams.chain_id !== null) params.chain_id = searchParams.chain_id
    if (searchParams.verified !== null) params.verified = searchParams.verified
    
    const res = await getAllTokens(params)
    tokens.value = res.data?.tokens || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    Message.error('获取代币列表失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchParams.contract_address = ''
  searchParams.chain_id = null
  searchParams.verified = null
  fetchData()
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  fetchData()
}

// 显示添加模态框
const showAddModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

// 显示编辑模态框
const showEditModal = (token: Token) => {
  isEdit.value = true
  currentToken.value = token
  modalVisible.value = true
  
  // 填充表单数据
  tokenForm.token_contract = token.token_contract
  tokenForm.token_symbol = token.token_symbol
  tokenForm.token_name = token.token_name
  tokenForm.token_decimals = token.token_decimals
  tokenForm.chain_id = token.chain_id
  tokenForm.is_verified = token.is_verified
}

// 重置表单
const resetForm = () => {
  tokenForm.token_contract = ''
  tokenForm.token_symbol = ''
  tokenForm.token_name = ''
  tokenForm.token_decimals = 18
  tokenForm.chain_id = 56
  tokenForm.is_verified = false
  currentToken.value = null
}

// 模态框确认
const handleModalOk = async () => {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    submitLoading.value = true
    
    if (isEdit.value && currentToken.value) {
      // 编辑代币
      await updateToken(
        currentToken.value.token_contract,
        currentToken.value.chain_id,
        {
          token_symbol: tokenForm.token_symbol,
          token_name: tokenForm.token_name,
          token_decimals: tokenForm.token_decimals!,
          is_verified: tokenForm.is_verified,
        }
      )
      Message.success('代币信息更新成功')
    } else {
      // 添加代币
      await addToken({
        token_contract: tokenForm.token_contract,
        token_symbol: tokenForm.token_symbol,
        token_name: tokenForm.token_name,
        token_decimals: tokenForm.token_decimals!,
        chain_id: tokenForm.chain_id!,
        is_verified: tokenForm.is_verified,
      })
      Message.success('代币添加成功')
    }
    
    modalVisible.value = false
    fetchData()
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || (isEdit.value ? '更新代币失败' : '添加代币失败')
    Message.error(errorMsg)
  } finally {
    submitLoading.value = false
  }
}

// 模态框取消
const handleModalCancel = () => {
  modalVisible.value = false
  resetForm()
  formRef.value?.resetFields()
}

// 删除代币
const deleteTokenById = async (token: Token) => {
  try {
    await deleteToken(token.token_contract, token.chain_id)
    Message.success('代币删除成功')
    fetchData()
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || '删除代币失败'
    Message.error(errorMsg)
  }
}

// 更新验证状态
const updateVerifyStatus = async (token: Token) => {
  const key = token.token_contract
  verifyLoading.value[key] = true
  
  try {
    await updateTokenVerifyStatus(
      token.token_contract,
      token.chain_id,
      { is_verified: token.is_verified }
    )
    Message.success(`代币验证状态已更新为: ${token.is_verified ? '已验证' : '未验证'}`)
  } catch (e: any) {
    // 恢复原状态
    token.is_verified = !token.is_verified
    const errorMsg = e.response?.data?.message || '更新验证状态失败'
    Message.error(errorMsg)
  } finally {
    verifyLoading.value[key] = false
  }
}

// 导出CSV
const exportTokens = async () => {
  try {
    const params: any = { format: 'csv' }
    if (searchParams.contract_address.trim()) params.contract_address = searchParams.contract_address.trim()
    if (searchParams.chain_id !== null) params.chain_id = searchParams.chain_id
    if (searchParams.verified !== null) params.verified = searchParams.verified
    
    const res = await getAllTokens(params)
    
    // 创建下载链接
    const blob = new Blob([res.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tokens_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    Message.success('CSV导出成功')
  } catch (e) {
    Message.error('导出失败')
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.ant-table {
  min-height: 400px;
}
</style> 