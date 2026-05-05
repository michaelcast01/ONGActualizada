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
  background: rgba(255, 255, 255, 0.94);
  border-radius: 8px;
  box-shadow: 0 16px 45px rgba(0, 29, 69, 0.08);
  overflow: hidden;
  transition: all var(--transition-base);
  border: 1px solid rgba(0, 52, 120, 0.08);
  border-top: 4px solid var(--color-gray-300);
}

.card-default {
  border-top-color: #cbd5e1;
}

.card-primary {
  border-top-color: var(--color-primary);
}

.card-success {
  border-top-color: var(--color-success);
}

.card-error {
  border-top-color: var(--color-error);
}

.card-hover:hover {
  box-shadow: 0 22px 60px rgba(0, 29, 69, 0.14);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid rgba(0, 52, 120, 0.07);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.card-header h3 {
  margin: 0;
  color: var(--color-primary-dark);
  font-size: 1.08rem;
  letter-spacing: 0;
}

.card-body {
  padding: var(--spacing-lg);
}

.card-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid rgba(0, 52, 120, 0.07);
  background: #f8fbff;
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}
</style>
