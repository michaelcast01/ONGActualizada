<template>
  <div class="login-page">
    <div class="login-background"></div>
    
    <div class="login-container">
      <Card variant="primary" class="login-card">
        <!-- Logo -->
        <div class="login-header">
          <div class="logo-container">ONG</div>
          <p class="login-subtitle">Sistema de Gestion Social ONG</p>
          <p class="login-hint">Acceso inicial: admin / admin123</p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="username">📧 Usuario</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Ingresa tu usuario"
              class="form-input"
              @keyup.enter="login"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">🔐 Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              class="form-input"
              @keyup.enter="login"
              :disabled="loading"
            />
          </div>

          <!-- Toast de error -->
          <transition name="fade">
            <div v-if="error" class="error-box">
              <span>⚠️ {{ error }}</span>
            </div>
          </transition>

          <!-- Botón de login -->
          <Button
            :label="loading ? 'Iniciando sesión...' : 'Ingresar'"
            variant="primary"
            size="lg"
            :loading="loading"
            :disabled="loading"
            @click="login"
            class="login-button"
          />
        </form>

        <!-- Pie de página -->
        <div class="login-footer">
          <p>© 2026 Plataforma para gestion de beneficiarios, donaciones y entregas</p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from './Card.vue'
import Button from './Button.vue'
import { useToast } from '../composables/useToast'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const { success } = useToast()

const login = async () => {
  if (!username.value || !password.value) {
    error.value = 'Por favor completa usuario y contraseña'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: username.value,
        contraseña: password.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Error en la autenticación'
      return
    }

    // Guardar el token en localStorage
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))

    success('¡Bienvenido! Redirigiendo...')

      // Redirigir al centro operativo
      setTimeout(() => {
        router.push('/app')
      }, 500)
  } catch (err) {
    error.value = 'Error de conexión: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  position: relative;
  overflow: hidden;
  padding: var(--spacing-md);
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="1200" height="600" fill="url(%23grid)"/></svg>');
  opacity: 0.5;
  z-index: 0;
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.login-card {
  border: none !important;
  box-shadow: 0 20px 60px rgba(0, 20, 69, 0.3) !important;
  border-radius: 16px !important;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-gray-200);
}

.logo-container {
  font-size: 3.5rem;
  margin-bottom: var(--spacing-md);
  display: inline-block;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.login-subtitle {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  letter-spacing: 0.3px;
}

.login-hint {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: var(--spacing-sm);
}

.form-input {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--border-radius-lg);
  background-color: var(--color-white);
  color: var(--color-gray-900);
  font-size: var(--font-size-md);
  transition: all var(--transition-base);
  font-family: var(--font-family);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 52, 120, 0.15);
  background-color: var(--color-white);
  transform: translateY(-2px);
}

.form-input:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--color-gray-400);
}

.error-box {
  padding: var(--spacing-md);
  background-color: #ffebee;
  border-left: 4px solid var(--color-error);
  border-radius: var(--border-radius-md);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-button {
  width: 100%;
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-md) var(--spacing-lg) !important;
  box-shadow: 0 4px 12px rgba(0, 52, 120, 0.2) !important;
  transition: all 0.3s ease !important;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 52, 120, 0.3) !important;
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
  color: var(--color-gray-500);
  font-size: var(--font-size-xs);
  letter-spacing: 0.3px;
}

.login-footer p {
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .login-page {
    padding: var(--spacing-md);
  }

  .login-container {
    max-width: 100%;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .login-logo {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    border-left-width: 4px !important;
  }

  .login-header {
    margin-bottom: var(--spacing-xl);
  }

  .form-input {
    padding: var(--spacing-md);
    font-size: 16px;
  }
}
</style>
  
