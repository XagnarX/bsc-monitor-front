<template>
  <div>
    <!-- Tab Navigation -->
    <a-tabs v-model:active-key="activeTab" type="card" @change="handleTabChange">
      <a-tab-pane key="transfers" title="📋 交易记录">
        <!-- Original Transfers List View -->
        <TransfersListTab
          ref="transfersListRef"
          :from-address="addressFromSenderGroup"
          @clear-address-filter="clearAddressFilter"
        />
      </a-tab-pane>

      <a-tab-pane key="senders" title="👥 发送者统计">
        <!-- Sender Group Statistics View -->
        <SenderGroupTab />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TransfersListTab from '@/components/usdt/TransfersListTab.vue'
import SenderGroupTab from '@/components/usdt/SenderGroupTab.vue'

// Active tab key
const activeTab = ref('transfers')

// Address filter from sender group (when clicking from sender stats)
const addressFromSenderGroup = ref('')

// Tab ref
const transfersListRef = ref<InstanceType<typeof TransfersListTab> | null>(null)

// Handle tab change
const handleTabChange = (key: string) => {
  console.log('Tab changed to:', key)
}

// Clear address filter
const clearAddressFilter = () => {
  addressFromSenderGroup.value = ''
}
</script>
