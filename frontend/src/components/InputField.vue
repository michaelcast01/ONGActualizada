<template>
  <input 
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    :type="inputType"
    :placeholder="placeholder"
    class="input-field"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  field: {
    type: Object,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])

const inputType = computed(() => {
  if (!props.field) return 'text'
  
  const type = props.field.type?.toLowerCase()
  if (type === 'number' || type === 'integer' || type === 'numeric') return 'number'
  if (type === 'date') return 'date'
  if (type === 'datetime' || type === 'timestamp') return 'datetime-local'
  if (type === 'boolean') return 'checkbox'
  
  return 'text'
})
</script>

<style scoped>
.input-field {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
</style>
