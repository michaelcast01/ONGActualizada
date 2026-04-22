import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Importar estilos globales
import './assets/variables.css'
import './style.css'

createApp(App).use(router).mount('#app')


