<template lang="pug">
  div#targetMonitor
    .top
      a-button(type="primary" @click="editRef.visible=true") 添加监控
        template(#icon)
          icon-plus
      a-space
        a-button(shape="round" @click="fetchData") 刷新
          template(#icon)
            icon-refresh
    //.mb-16
    //a-form(layout="inline" :model="searchCondition" @finish="doSearch")
    //  a-form-item(label="邮箱")
    //    a-input(v-model:value="searchCondition.email_like" placeholder="请输入邮箱" allow-clear @pressEnter="doSearch" )
    //  a-form-item(label="用户名" )
    //    a-input(v-model:value="searchCondition.username_like" placeholder="请输入用户名" allow-clear @pressEnter="doSearch")
    //  a-form-item
    //    a-button(type="primary" html-type="submit" ) 搜索
    .mb-16
    a-table(
      :columns="columns"
      :data="dataList"
      :pagination="pagination"
      @change="doTableChange"
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
          a-button(type="outline" status="danger" ) 删除
            template(#icon)
              icon-delete
    add-monitor(ref="editRef" @reload-list="fetchData")
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { delTarget, getAllTargets } from '@/api/monitor.ts'
import { IconCopy, IconDelete, IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import AddMonitor from '@/components/AddMonitor.vue'

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
let editRef = ref<InstanceType<typeof AddMonitor> | null>(null)

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  fetchData()
}
// 搜索条件
const searchCondition = ref({})

const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
})
const pagination = computed(() => {
  return {
    current: searchParams.current,
    pageSize: searchParams.pageSize,
    total: total.value,
    showTotal: true,
    showPageSize: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})
const doTableChange = ({ current, pageSize }) => {
  searchParams.current = current
  searchParams.pageSize = pageSize
  fetchData()
}

// 获取数据
const fetchData = async () => {
  const res = await getAllTargets()
  // const res = mock
  console.log(res.data)
  if (res.data) {
    dataList.value = res.data.targets ?? []
    total.value = res.data.total ?? 0
  } else {
    Message.error('获取数据失败，' + res.message)
  }
}

const doDelete = (record: API.Target) => {
  if (!record.address && !record.tag) {
    return
  }
  delTarget({ address: record.address, tag: record.tag }).then((res) => {
    Message.success('删除成功');
    fetchData()
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
</script>

<style scoped lang="scss">
#targetMonitor {
  .top {
    display: flex;
    justify-content: space-between;
  }
}
</style>
