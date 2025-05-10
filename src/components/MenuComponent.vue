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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconComputer, IconDashboard } from '@arco-design/web-vue/es/icon'

const props = defineProps({
  collapsed: Boolean,
})

const router = useRouter()

const menuData = ref([
  // {
  //   key: 'dashboard',
  //   title: '仪表盘',
  //   icon: IconDashboard,
  //   path: '/dashboard',
  // },
  {
    key: 'targetMonitor',
    title: '目标监控管理',
    icon: IconComputer,
    path: '/',
  },
  {
    key: 'analysis',
    title: '监控分析',
    icon: IconComputer,
    path: '/analysis',
  },
])

const selectedKeys = ref([])
const openKeys = ref([])

// 根据当前路由自动选中菜单项
watch(
  () => router.currentRoute.value.path,
  (path) => {
    const findSelectedKey = (items) => {
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
  const findPathByKey = (items, targetKey) => {
    for (const item of items) {
      if (item.key === targetKey) {
        return item.path
      }
      if (item.children) {
        const childPath: string = findPathByKey(item.children, targetKey)
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
<style scoped lang="scss"></style>
