<script lang="ts" setup>
defineProps({
  variant: {
    type: String,
    default: 'primary'
  }
})
</script>

<template>
  <div :class="{
    'bg-blue-100 text-blue-800': variant === 'primary',
    'bg-green-100 text-green-800': variant === 'success',
    'bg-red-100 text-red-800': variant === 'danger',
    'bg-yellow-100 text-yellow-800': variant === 'warning',
    'bg-gray-100 text-gray-800': variant === 'secondary',
  }" class="inline-flex items-center rounded-full text-xs px-2">
    <slot />
  </div>
</template>

<style scoped>

</style>
