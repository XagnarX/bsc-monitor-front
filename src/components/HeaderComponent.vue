<template lang="pug">
  .header-container
    .header-left
      a-space
        icon-menu-unfold(v-if="collapsed"
          class="trigger"
          @click="emit('toggle-collapse')"
        )
        icon-menu-fold(v-else
        class="trigger"
          @click="emit('toggle-collapse')"
        )
        a-breadcrumb
          a-breadcrumb-item( v-for="item in breadcrumbs" :key="item") {{ item }}
    .header-right
      a-space(:size="20")
        a-tooltip(content="消息通知" )
          a-badge(:count="5" dot)
            icon-notification
        a-dropdown
          a-avatar(:size="32")
            img(alt="avatar" src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg")
          template(#content)
            a-doption
              a-space
                icon-user
                span 个人中心
            a-doption
              a-space
                icon-settings
                span 设置
            a-doption
              a-space
                icon-export
                span 退出
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconMenuUnfold,
  IconMenuFold,
  IconNotification,
  IconUser,
  IconSettings,
  IconExport,
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  collapsed: Boolean,
})

const emit = defineEmits(['toggle-collapse'])

const router = useRouter()

const breadcrumbs = computed(() => {
  const matched = router.currentRoute.value.matched
  return matched.map((route) => route.meta.title || route.name)
})
</script>

<style scoped lang="scss">
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  background-color: var(--color-bg-1);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: var(--color-primary);
}
</style>
