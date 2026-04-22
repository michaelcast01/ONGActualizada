<template>
  <div :class="['spinner', `spinner-${size}`, `spinner-${variant}`]"></div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'white'].includes(value)
  }
})
</script>

<style scoped>
.spinner {
  display: inline-block;
  border: 3px solid rgba(0, 52, 120, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner-md {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

.spinner-lg {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.spinner-secondary {
  border-color: rgba(233, 75, 60, 0.2);
  border-top-color: var(--color-secondary);
}

.spinner-white {
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: var(--color-white);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
