<template>
  <div :class="['card', `card-${variant}`, { 'card-hover': hoverable }]">
    <div v-if="title" class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'error'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.card {
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--transition-base);
  border-left: 4px solid var(--color-gray-300);
}

.card-default {
  border-left-color: var(--color-gray-300);
}

.card-primary {
  border-left-color: var(--color-primary);
}

.card-success {
  border-left-color: var(--color-success);
}

.card-error {
  border-left-color: var(--color-error);
}

.card-hover:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
}

.card-header h3 {
  margin: 0;
  color: var(--color-primary);
}

.card-body {
  padding: var(--spacing-lg);
}

.card-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}
</style>
