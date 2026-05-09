<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
  required?: boolean
}>()

defineEmits<{ (e: 'update:modelValue', val: string): void }>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-text-secondary">
      {{ label }}
      <span v-if="required" class="text-gold ml-0.5">*</span>
    </label>
    <input
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="[
        'w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted',
        'focus:outline-none focus:ring-1 transition-colors duration-200',
        error
          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
          : 'border-border-subtle focus:border-mystic focus:ring-mystic/30',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    />
    <p v-if="error" class="text-xs text-red-400 flex items-center gap-1">
      <span>⚠</span> {{ error }}
    </p>
  </div>
</template>
