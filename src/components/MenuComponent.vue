<template lang="pug">
  a-menu(
    v-model:open-keys="openKeys"
    v-model:selected-keys="selectedKeys"
    :collapsed="collapsed"
    @menu-item-click="handleMenuClick"
  )
    template(v-for="item in menuData" :key="item.key")
      a-menu-item(v-if="!item.children" :key="item.key") {{item.title}}
        template(#icon)
          component(:is="item.icon")
      a-sub-menu(v-else :key="item.key" :title="item.title")
        template(#icon)
          component(:is="item.icon")
        a-menu-item(v-for="child in item.children" :key="child.key") {{child.title}}
</template>
<script setup lang="ts">
import { ref, watch, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { IconComputer, IconDashboard } from '@arco-design/web-vue/es/icon'

interface MenuItem {
  key: string
  title: string
  icon: any
  path: string
  children?: MenuItem[]
}

const props = defineProps({
  collapsed: Boolean,
})

const router = useRouter()

const menuData = ref<MenuItem[]>([
  // {
  //   key: 'dashboard',
  //   title: '仪表盘',
  //   icon: IconDashboard,
  //   path: '/dashboard',
  // },
  {
    key: 'targetMonitor',
    title: '目标监控管理',
    icon: markRaw(IconComputer),
    path: '/',
  },
  {
    key: 'analysis',
    title: '监控分析',
    icon: markRaw(IconComputer),
    path: '/analysis',
  },
  // {
  //   key: 'activity',
  //   title: '活跃度统计',
  //   icon: markRaw(IconComputer),
  //   path: '/activity',
  // },
  {
    key: 'transactions',
    title: '交易明细',
    icon: markRaw(IconComputer),
    path: '/transactions',
  },
  {
    key: 'bnb-transactions',
    title: 'BNB转账交易',
    icon: markRaw(IconComputer),
    path: '/bnb-transactions',
  },
  {
    key: 'erc20-events',
    title: 'ERC-20转账事件',
    icon: markRaw(IconComputer),
    path: '/erc20-events',
  },
  {
    key: 'token-management',
    title: 'ERC-20代币管理',
    icon: markRaw(IconComputer),
    path: '/token-management',
  },
  {
    key: 'receiver-blacklist',
    title: '接收者黑名单',
    icon: markRaw(IconComputer),
    path: '/receiver-blacklist',
  },
])

const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

// 根据当前路由自动选中菜单项
watch(
  () => router.currentRoute.value.path,
  (path) => {
    const findSelectedKey = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.path === path) {
          return item.key
        }
        if (item.children) {
          const childKey = findSelectedKey(item.children)
          if (childKey) {
            openKeys.value = [...new Set([...openKeys.value, item.key])]
            return childKey
          }
        }
      }
      return null
    }

    selectedKeys.value = [findSelectedKey(menuData.value) || '']
  },
  { immediate: true },
)

const handleMenuClick = (key: string) => {
  const findPathByKey = (items: MenuItem[], targetKey: string): string | null => {
    for (const item of items) {
      if (item.key === targetKey) {
        return item.path
      }
      if (item.children) {
        const childPath = findPathByKey(item.children, targetKey)
        if (childPath) {
          return childPath
        }
      }
    }
    return null
  }

  const path = findPathByKey(menuData.value, key)
  if (path) {
    router.push(path)
  }
}
</script>
<style scoped lang="scss">
:deep(.arco-menu-collapsed .arco-menu-item-content) {
  display: flex;
  justify-content: center;
  padding: 0;
}
:deep(.arco-menu-collapsed .arco-menu-item-content span) {
  display: none;
}
</style>
