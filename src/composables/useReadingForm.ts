import { ref, watch } from 'vue'
import type { User } from '@/types/user.types'

interface MainForm {
  full_name: string
  birth_date: string
  phone: string
  gender: string
}

export function useReadingForm(getUser: () => User | null, form: MainForm) {
  const isForOther = ref(false)

  function fillFromUser() {
    const user = getUser()
    if (!user) return
    form.full_name = user.full_name ?? ''
    form.birth_date = user.birth_date ?? ''
    form.phone = user.phone ?? ''
    form.gender = user.gender ?? ''
  }

  function viewForOther() {
    isForOther.value = true
    form.full_name = ''
    form.birth_date = ''
    form.phone = ''
    form.gender = ''
  }

  function viewForSelf() {
    isForOther.value = false
    fillFromUser()
  }

  // Fill immediately (handles case where user is already loaded)
  fillFromUser()

  // Re-fill when user logs in after component mount
  watch(getUser, (newUser) => {
    if (newUser && !isForOther.value) fillFromUser()
  })

  return { isForOther, viewForOther, viewForSelf }
}
