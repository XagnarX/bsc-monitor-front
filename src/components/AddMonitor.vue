<template lang="pug">
  .monitor-edit
    a-modal(
      v-model:visible="visible"
      title="添加监控"
      @cancel="handleCancel"
      @ok="handleSubmit"
      :ok-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="confirmLoading"
    )
      a-form(
        ref="roleForm"
        :model="formData"
        autocomplete="off"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
      )
        a-form-item(label="地址" name="address" :rules="[{ required: true, message: '请输入地址!' }]" )
          a-input(v-model:value="formData.address" placeholder="请输入地址" )
        a-form-item(label="标签" name="tag" :rules="[{ required: true, message: '请输入标签!' }]")
          a-input(v-model:value="formData.tag" placeholder="请输入标签" allow-clear)
        a-form-item(label="最小值" name="min_value" :rules="[{ required: true, message: '请输入最小值!' }]")
          a-input-number(v-model:value="formData.min_value" placeholder="请输入最小值" min="0" allow-clear)
        a-form-item(label="最大值" name="max_value" :rules="[{ required: true, message: '请输入最大值!' }]")
          a-input-number(v-model:value="formData.max_value" placeholder="请输入最大值" min="0" allow-clear)
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { addTarget } from '@/api/monitor.ts'
import { Message } from '@arco-design/web-vue'

const visible = ref(false)
const roleForm = ref(null)
const formData = ref<API.Target>({
  address: '',
  tag: '',
  min_value: '',
  max_value: '',
})
const confirmLoading = ref(false)
const emits = defineEmits(['reload-list'])

// 提交表单
const handleSubmit = () => {
  roleForm.value.validate().then(() => {
    addTarget(formData.value).then((res) => {
      Message.success('添加成功')
      handleCancel()
      emits('reload-list')
    })
  })
}

// 取消操作
const handleCancel = () => {
  formData.value = {}
  visible.value = false
}
defineExpose({ visible, formData })
</script>
<style scoped lang="scss">
.monitor-edit {
}
</style>