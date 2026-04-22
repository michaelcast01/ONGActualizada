<template>
  <span :class="['badge', `badge-${variant}`, `badge-${size}`]">
    <slot></slot>
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'error', 'warning', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-full);
  white-space: nowrap;
}

/* Variantes */
.badge-primary {
  background-color: #e3f2fd;
  color: var(--color-primary);
}

.badge-secondary {
  background-color: #ffebee;
  color: var(--color-secondary);
}

.badge-success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.badge-error {
  background-color: #ffebee;
  color: var(--color-error);
}

.badge-warning {
  background-color: #fff3e0;
  color: #e65100;
}

.badge-info {
  background-color: #e3f2fd;
  color: var(--color-info);
}

/* Tamaños */
.badge-sm {
  padding: 0.25rem 0.75rem;
  font-size: var(--font-size-xs);
}

.badge-md {
  padding: 0.375rem 1rem;
  font-size: var(--font-size-sm);
}

.badge-lg {
  padding: 0.5rem 1.25rem;
  font-size: var(--font-size-md);
}
</style>
