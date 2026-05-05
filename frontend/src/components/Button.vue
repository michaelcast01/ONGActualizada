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
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  min-height: 2.75rem;
}

/* Variantes */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
  box-shadow: 0 12px 26px rgba(0, 52, 120, 0.22);
}

.btn-primary:hover:not(.btn-disabled) {
  box-shadow: 0 16px 32px rgba(0, 52, 120, 0.28);
  transform: translateY(-2px);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark));
  color: var(--color-white);
  box-shadow: 0 12px 26px rgba(233, 75, 60, 0.22);
}

.btn-secondary:hover:not(.btn-disabled) {
  box-shadow: 0 16px 32px rgba(233, 75, 60, 0.28);
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(135deg, #16a34a, #047857);
  color: var(--color-white);
  box-shadow: 0 12px 26px rgba(22, 163, 74, 0.22);
}

.btn-success:hover:not(.btn-disabled) {
  box-shadow: 0 16px 32px rgba(22, 163, 74, 0.28);
  transform: translateY(-2px);
}

.btn-error {
  background: linear-gradient(135deg, var(--color-error), #991b1b);
  color: var(--color-white);
  box-shadow: 0 12px 26px rgba(211, 47, 47, 0.22);
}

.btn-error:hover:not(.btn-disabled) {
  box-shadow: 0 16px 32px rgba(211, 47, 47, 0.28);
  transform: translateY(-2px);
}

.btn-ghost {
  background-color: #ffffff;
  color: var(--color-primary);
  border: 1px solid rgba(0, 52, 120, 0.18);
}

.btn-ghost:hover:not(.btn-disabled) {
  background-color: #f1f7ff;
  transform: translateY(-1px);
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
