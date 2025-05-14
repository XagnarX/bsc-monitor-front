<template lang="pug">
  div#targetMonitor
    .top
      a-space
        a-button(shape="round" @click="fetchData") 刷新
          template(#icon)
            icon-refresh
        a-button(type="primary" shape="round" @click="visible = true") 添加
          template(#icon)
            icon-plus
    .mb-16
    a-table(
      :columns="columns"
      :data="dataList"
      :pagination="false"
      size="mini"
      @change="doTableChange"
      stripe
      style="min-width: 1400px;"
    )
      template(#address="{ record }")
        a-space
          a-link(:href="`https://bscscan.com/address/${record.address}`" target="_blank") {{ record.address }}
          a-button(
            type="text"
            size="mini"
            @click="copyToClipboard(record.address)"
          )
            template(#icon)
              icon-copy
      template(#action="{ record }")
        a-popconfirm(content="确认删除？" @ok="doDelete(record)")
          a-button(type="outline" status="danger" size="mini") 删除
            template(#icon)
              icon-delete
    a-modal(v-model:visible="visible" title="添加监控目标" @ok="handleAdd" :ok-loading="addLoading" :ok-button-props="{ disabled: !isFormValid }")
      a-form(:model="form" :rules="rules" ref="formRef" layout="vertical")
        a-form-item(label="地址" field="address" required)
          a-input(v-model="form.address" placeholder="请输入监控地址")
        a-form-item(label="标签" field="tag" required)
          a-input(v-model="form.tag" placeholder="请输入标签")
        a-form-item(label="最小值" field="min_value" required)
          a-input-number(v-model="form.min_value" placeholder="请输入最小交易金额" style="width:100%")
        a-form-item(label="最大值" field="max_value")
          a-input-number(v-model="form.max_value" placeholder="请输入最大交易金额" style="width:100%")
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { delTarget, getAllTargets, addTarget } from '@/api/monitor.ts'
import { IconCopy, IconDelete, IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'

const columns = ref([
  {
    title: '地址',
    dataIndex: 'address',
    slotName: 'address',
  },
  {
    title: '标签',
    dataIndex: 'tag',
  },
  {
    title: '最小值',
    dataIndex: 'min_value',
  },
  {
    title: '最大值',
    dataIndex: 'max_value',
  },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action', // 使用插槽
  },
])

// 数据
const dataList = ref<API.Target[]>([])
const total = ref(0)

// 获取数据
const fetchData = async () => {
  const res = await getAllTargets()
  if (res.data) {
    dataList.value = res.data.targets ?? []
    total.value = res.data.total ?? 0
  } else {
    Message.error('获取数据失败')
  }
}

const doDelete = (record: API.Target) => {
  if (!record.address || !record.tag) {
    Message.error('地址或标签不能为空')
    return
  }
  delTarget({ address: record.address, tag: record.tag }).then((res) => {
    if (res.data) {
      Message.success('删除成功')
      fetchData()
    } else {
      Message.error('删除失败')
    }
  })
}

const mock = JSON.parse(
  '{\n' +
  '    "code": 200,\n' +
  '    "message": "success",\n' +
  '    "data": {\n' +
  '        "total": 2,\n' +
  '        "targets": [\n' +
  '            {\n' +
  '                "address": "0x123...abc",\n' +
  '                "tag": "bybit1",\n' +
  '                "min_value": "20",\n' +
  '                "max_value": "100"\n' +
  '            },\n' +
  '            {\n' +
  '                "address": "0x456...def",\n' +
  '                "tag": "bybit2",\n' +
  '                "min_value": "50",\n' +
  '                "max_value": "200"\n' +
  '            }\n' +
  '        ]\n' +
  '    }\n' +
  '}',
)

// 页面加载时请求一次
onMounted(() => {
  fetchData()
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

const visible = ref(false)
const addLoading = ref(false)
const formRef = ref()
const form = reactive({
  address: '',
  tag: '',
  min_value: null,
  max_value: null
})
const rules = {
  address: [{ required: true, message: '请输入监控地址' }],
  tag: [{ required: true, message: '请输入标签' }],
  min_value: [{ required: true, message: '请输入最小交易金额' }],
}
const resetForm = () => {
  form.address = ''
  form.tag = ''
  form.min_value = null
  form.max_value = null
}
const isFormValid = computed(() => {
  // 必填项都不为空且最小值为数字
  return (
    !!form.address &&
    !!form.tag &&
    form.min_value !== null &&
    !isNaN(Number(form.min_value))
  )
})
const handleAdd = async () => {
  let valid = false
  try {
    await formRef.value?.validate()
    valid = true
  } catch (e) {
    valid = false
  }
  if (!valid) return; // 校验不通过直接返回

  addLoading.value = true
  try {
    await addTarget({
      address: form.address,
      tag: form.tag,
      min_value: String(form.min_value),
      max_value: form.max_value !== null && form.max_value !== undefined ? String(form.max_value) : undefined
    }, {})
    Message.success('监控目标添加成功')
    visible.value = false
    resetForm()
    fetchData()
  } catch (e) {
    Message.error('添加失败')
  } finally {
    addLoading.value = false
  }
}

const doTableChange = () => {
  // 这里可以根据需要添加分页、排序等逻辑，目前为空实现
}
</script>

<style scoped lang="scss">
#targetMonitor {
  .top {
    display: flex;
    justify-content: space-between;
  }
  .arco-table .arco-table-td,
  .arco-table .arco-table-th {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
    padding-left: 4px !important;
    padding-right: 4px !important;
    font-size: 10px;
    line-height: 12px;
  }
  .arco-table .arco-table-cell {
    min-height: 12px !important;
    line-height: 12px !important;
  }
}
</style>