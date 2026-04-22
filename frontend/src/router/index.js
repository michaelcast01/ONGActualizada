import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/login.vue'
import OperationsCenter from '../components/OperationsCenter.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/app', name: 'OperationsCenter', component: OperationsCenter, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' } // 👈 Ruta catch-all
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')

  if (to.meta.requiresAuth && !token) {
    next('/')
    return
  }

  if (to.path === '/' && token) {
    next('/app')
    return
  }

  next()
})

export default router
