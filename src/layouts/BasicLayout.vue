<template lang="pug">
  a-layout.h-screen
    a-layout-sider(
    collapsible
    width="220"
    breakpoint="lg"
    )
      .logo
      menu-component(:collapsed="collapsed")
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

const collapsed = ref(false);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
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
</style>
