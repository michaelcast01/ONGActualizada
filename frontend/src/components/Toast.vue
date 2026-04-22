<template>
  <Teleport to="body">
    <transition name="toast-fade">
      <div v-if="visible" :class="['toast', `toast-${type}`, `toast-${position}`]">
        <div class="toast-content">
          <span class="toast-icon">{{ icons[type] }}</span>
          <span class="toast-message">{{ message }}</span>
          <button class="toast-close" @click="close">✕</button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
let timeout

const icons = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'ⓘ'
}

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.duration > 0) {
    clearTimeout(timeout)
    timeout = setTimeout(close, props.duration)
  }
})

watch(visible, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  z-index: 9999;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  animation: slideIn 0.3s ease forwards;
}

.toast-top-left {
  top: var(--spacing-xl);
  left: var(--spacing-xl);
}

.toast-top-right {
  top: var(--spacing-xl);
  right: var(--spacing-xl);
}

.toast-bottom-left {
  bottom: var(--spacing-xl);
  left: var(--spacing-xl);
}

.toast-bottom-right {
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
}

.toast-success {
  background-color: var(--color-success);
  color: white;
}

.toast-error {
  background-color: var(--color-error);
  color: white;
}

.toast-warning {
  background-color: var(--color-warning);
  color: var(--color-gray-900);
}

.toast-info {
  background-color: var(--color-info);
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.toast-icon {
  font-weight: var(--font-weight-bold);
  font-size: 1.2rem;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.toast-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all var(--transition-base);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@media (max-width: 640px) {
  .toast {
    max-width: calc(100vw - 32px);
  }
  
  .toast-top-left,
  .toast-bottom-left {
    left: var(--spacing-md);
  }
  
  .toast-top-right,
  .toast-bottom-right {
    right: var(--spacing-md);
  }
}
</style>
