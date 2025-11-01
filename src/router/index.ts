import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnalysisView from '@/views/AnalysisView.vue'
import Analysis2View from '@/views/Analysis2View.vue'
import ActivityView from '@/views/ActivityView.vue'
import AddressTransactionsView from '@/views/AddressTransactionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '目标监控管理',
      component: HomeView,
    },
    {
      path:'/analysis',
      name:'监控分析',
      component:AnalysisView
    },{
      path:'/analysis2',
      name:'监控分析2',
      component:Analysis2View
    },
    {
      path:'/activity',
      name:'活跃度统计',
      component:ActivityView
    },
    {
      path:'/address-transactions',
      name:'地址交易明细',
      component:AddressTransactionsView
    },
    {
      path: '/transactions',
      name: '交易明细',
      component: () => import('@/views/TransactionsView.vue')
    },
    {
      path: '/receiver-blacklist',
      name: '接收者黑名单',
      component: () => import('@/views/ReceiverBlacklistView.vue')
    },
    {
      path: '/bnb-transactions',
      name: 'BNB转账交易',
      component: () => import('@/views/BnbTransactionsView.vue')
    },
    {
      path: '/erc20-events',
      name: 'ERC-20转账事件',
      component: () => import('@/views/Erc20EventsView.vue')
    },
    {
      path: '/token-management',
      name: 'ERC-20代币管理',
      component: () => import('@/views/TokenManagementView.vue')
    },
    {
      path: '/batch-transfers',
      name: '批量转账查询',
      component: () => import('@/views/BatchTransfersView.vue')
    },
    {
      path: '/internal-transactions',
      name: '内部交易查询',
      component: () => import('@/views/InternalTransactionsView.vue')
    }
  ],
})

export default router
