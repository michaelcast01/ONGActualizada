<template>
  <header class="header">
    <div class="header-container">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">Sistema <span class="logo-ong">ONG</span></span>
        </div>
      </div>
      
      <nav class="nav-desktop">
        <a href="#" class="nav-link">Inicio</a>
        <a href="#" class="nav-link">Reportes</a>
      </nav>
      
      <div class="header-right">
        <div v-if="usuario" class="user-info">
          <span class="user-name">{{ usuario.nombre || usuario.nombre_usuario }}</span>
          <span class="user-role">{{ usuario.rol }}</span>
        </div>
        <button class="btn-logout" @click="logout" title="Cerrar sesión">
          🚪 Salir
        </button>
        <button class="btn-menu-toggle" @click="toggleMenu">
          ☰
        </button>
      </div>
    </div>
    
    <!-- Menu móvil -->
    <nav v-if="menuOpen" class="nav-mobile">
      <a href="#" class="nav-link-mobile">Inicio</a>
      <a href="#" class="nav-link-mobile">Reportes</a>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const menuOpen = ref(false)

const usuario = computed(() => {
  const usuarioJson = localStorage.getItem('usuario')
  return usuarioJson ? JSON.parse(usuarioJson) : null
})

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('usuario')
  menuOpen.value = false
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-ong {
  color: var(--color-primary-light);
  font-weight: var(--font-weight-bold);
  background-color: rgba(255, 255, 255, 0.1);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
}

.nav-desktop {
  display: flex;
  gap: var(--spacing-xl);
  margin: 0 var(--spacing-2xl);
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
  position: relative;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-secondary);
  transition: width var(--transition-base);
}

.nav-link:hover::after {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.user-role {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.btn-logout {
  background-color: var(--color-secondary);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
  white-space: nowrap;
}

.btn-logout:hover {
  background-color: var(--color-secondary-dark);
  transform: translateY(-1px);
}

.btn-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.nav-mobile {
  display: none;
  flex-direction: column;
  padding: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: var(--color-primary-dark);
}

.nav-link-mobile {
  color: white;
  text-decoration: none;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all var(--transition-base);
}

.nav-link-mobile:hover {
  padding-left: var(--spacing-md);
  color: var(--color-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .header-container {
    flex-wrap: wrap;
    padding: var(--spacing-md);
  }

  .nav-desktop {
    display: none;
  }

  .btn-menu-toggle {
    display: block;
  }

  .nav-mobile.open {
    display: flex;
  }

  .user-info {
    display: none;
  }

  .header-left {
    flex: 1;
  }

  .header-right {
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: var(--spacing-sm);
  }

  .logo-text {
    font-size: var(--font-size-md);
  }

  .btn-logout {
    padding: var(--spacing-sm) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }
}
</style>
