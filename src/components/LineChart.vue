<!-- src/components/LineChart.vue -->
<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js'

const props = defineProps({ chartData: Object })
const canvas = ref(null)
let chartInstance = null

onMounted(() => {
  chartInstance = new Chart(canvas.value, {
    type: 'line',
    data: props.chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
})

watch(() => props.chartData, (newData) => {
  chartInstance.data = newData
  chartInstance.update()
})
</script>
