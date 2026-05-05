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
  border-radius: 999px;
  white-space: nowrap;
  border: 1px solid transparent;
}

/* Variantes */
.badge-primary {
  background-color: #eaf3ff;
  color: var(--color-primary);
  border-color: #c7ddff;
}

.badge-secondary {
  background-color: #fff1ed;
  color: var(--color-secondary);
  border-color: #ffd2c8;
}

.badge-success {
  background-color: #e8f7ef;
  color: #2e7d32;
  border-color: #c7ebd4;
}

.badge-error {
  background-color: #ffebee;
  color: var(--color-error);
  border-color: #ffcdd2;
}

.badge-warning {
  background-color: #fff7db;
  color: #e65100;
  border-color: #ffe2a6;
}

.badge-info {
  background-color: #ecfeff;
  color: #0e7490;
  border-color: #b6edf2;
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
