<template>
  <button 
    :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-disabled': disabled, 'btn-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <Spinner v-if="loading" :size="size" />
    <span v-else>{{ label }}</span>
  </button>
</template>

<script setup>
import Spinner from './Spinner.vue'

defineProps({
  label: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'error', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: var(--font-family);
  font-weight: var(--font-weight-semibold);
  border: none;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

/* Variantes */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(.btn-disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.btn-secondary:hover:not(.btn-disabled) {
  background-color: var(--color-secondary-dark);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.btn-success {
  background-color: var(--color-success);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.btn-success:hover:not(.btn-disabled) {
  background-color: #45a049;
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.btn-error {
  background-color: var(--color-error);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.btn-error:hover:not(.btn-disabled) {
  background-color: #b71c1c;
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-ghost:hover:not(.btn-disabled) {
  background-color: var(--color-gray-100);
}

/* Tamaños */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
}

.btn-md {
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-md);
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: var(--font-size-lg);
}

/* Estados */
.btn-disabled,
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-loading {
  cursor: wait;
  opacity: 0.8;
}
</style>
