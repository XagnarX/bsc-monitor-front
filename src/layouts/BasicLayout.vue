<template lang="pug">
  a-layout.h-screen
    a-layout-sider(
    collapsible
    :width="220"
    breakpoint="lg"
    :collapsed="collapsed"
    )
      .logo
      menu-component(:collapsed="collapsed")
      .sider-toggle-btn(@click="() => { console.log('底部按钮被点击'); toggleCollapse(); }")
        icon-menu-unfold(v-if="collapsed")
        icon-menu-fold(v-else)
    a-layout.layout
      a-layout-header
        header-component(:collapsed="collapsed" @toggle-collapse="toggleCollapse")
      a-layout-content.content
        router-view(v-slot="{Component}")
          transition(name="fade" mode="out-in")
            component(:is="Component")

</template>

<script setup lang="ts">
import { ref } from 'vue';
import MenuComponent from '@/components/MenuComponent.vue'
import HeaderComponent from '@/components/HeaderComponent.vue'
import { IconMenuUnfold, IconMenuFold } from '@arco-design/web-vue/es/icon'

const collapsed = ref(false);

const toggleCollapse = () => {
  console.log('toggleCollapse 被调用，collapsed 原值:', collapsed.value);
  collapsed.value = !collapsed.value;
  console.log('toggleCollapse 后 collapsed 新值:', collapsed.value);
};
</script>
<style scoped lang="scss">
.h-screen {
  height: 100vh;
}
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.content{
  margin: 15px 20px;
}
.layout :deep(.arco-layout-header){
  height: 64px;
}
.sider-toggle-btn {
  position: absolute;
  bottom: 24px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 40px;
  z-index: 10;
}
</style>
