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
    }
  ],
})

export default router
