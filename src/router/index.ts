import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnalysisView from '@/views/AnalysisView.vue'

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
    }
  ],
})

export default router
