import './assets/main.scss'
import ArcoVue from '@arco-design/web-vue';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@arco-design/web-vue/dist/arco.css';

document.body.setAttribute('arco-theme', 'dark');

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(ArcoVue)
app.use(createPinia())
app.use(router)

app.mount('#app')
