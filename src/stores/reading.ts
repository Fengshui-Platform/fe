import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Reading, ReadingResult, ReadingModule, ReadingInputDto } from '@/types/reading.types'

export const useReadingStore = defineStore('reading', () => {
  const currentInput = ref<ReadingInputDto | null>(null)
  const currentModule = ref<ReadingModule>('numerology')
  const currentResult = ref<ReadingResult | null>(null)
  const currentReadingId = ref<number | null>(null)
  const history = ref<Reading[]>([])

  function setResult(readingId: number, module: ReadingModule, result: ReadingResult, input: ReadingInputDto) {
    currentReadingId.value = readingId
    currentModule.value = module
    currentResult.value = result
    currentInput.value = input
  }

  function clearResult() {
    currentResult.value = null
    currentReadingId.value = null
  }

  return {
    currentInput, currentModule, currentResult, currentReadingId, history,
    setResult, clearResult,
  }
})
