<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import type { AIModel } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import { formatDateTime } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'

const ui = useUIStore()

const models = ref<AIModel[]>([])
const isLoading = ref(false)

// ── Form modal ─────────────────────────────────────────
const formModal = ref(false)
const editingModel = ref<AIModel | null>(null)
const isSaving = ref(false)

const formDefault = () => ({
  name: '',
  provider: 'openai' as string,
  model_id: '',
  api_key: '',
  priority: 10,
  max_tokens: 2048,
  temperature: 0.7,
  is_default: false,
  is_active: true,
})
const form = reactive(formDefault())

// Fetch-models state (only for create flow)
const isFetching = ref(false)
const fetchedModels = ref<string[]>([])

async function doFetchModels() {
  if (!form.api_key.trim()) {
    ui.toast.error('Vui lòng nhập API Key trước')
    return
  }
  isFetching.value = true
  fetchedModels.value = []
  try {
    fetchedModels.value = await adminService.fetchProviderModels(form.provider, form.api_key.trim())
    if (fetchedModels.value.length === 0) {
      ui.toast.error('Không tìm thấy model nào cho provider này')
    } else {
      ui.toast.success(`Tìm thấy ${fetchedModels.value.length} model`)
      form.model_id = fetchedModels.value[0] ?? ''
    }
  } catch {
    ui.toast.error('API Key không hợp lệ hoặc không thể kết nối tới provider')
  } finally {
    isFetching.value = false
  }
}

// ── Delete modal ───────────────────────────────────────
const deleteModal = ref(false)
const deleteTarget = ref<AIModel | null>(null)
const isDeleting = ref(false)

// ── Test modal ─────────────────────────────────────────
const testModal = ref(false)
const testTarget = ref<AIModel | null>(null)
const testPrompt = ref('')
const isTesting = ref(false)
const testOutput = ref<{ output: string; tokens_used: number } | null>(null)

const providers = ['openai', 'anthropic', 'gemini']

async function loadModels() {
  isLoading.value = true
  try {
    models.value = await adminService.getAIModels()
  } catch {
    ui.toast.error('Không thể tải danh sách AI model')
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editingModel.value = null
  Object.assign(form, formDefault())
  fetchedModels.value = []
  formModal.value = true
}

function openEdit(model: AIModel) {
  editingModel.value = model
  Object.assign(form, {
    name: model.name,
    provider: model.provider,
    model_id: model.model_id,
    api_key: '',
    priority: model.priority,
    max_tokens: model.max_tokens,
    temperature: model.temperature,
    is_default: !!model.is_default,
    is_active: !!model.is_active,
  })
  fetchedModels.value = []
  formModal.value = true
}

async function doSave() {
  if (!form.name || !form.model_id) {
    ui.toast.error('Vui lòng nhập tên và chọn model')
    return
  }
  isSaving.value = true
  try {
    const dto: Record<string, unknown> = {
      name: form.name,
      provider: form.provider,
      model_id: form.model_id,
      priority: form.priority,
      max_tokens: form.max_tokens,
      temperature: form.temperature,
      is_default: form.is_default ? 1 : 0,
      is_active: form.is_active ? 1 : 0,
    }
    if (form.api_key) dto.api_key = form.api_key

    if (editingModel.value) {
      await adminService.updateAIModel(editingModel.value.id, dto)
      ui.toast.success('Đã cập nhật model')
    } else {
      if (!form.api_key) {
        ui.toast.error('API Key là bắt buộc khi tạo mới')
        isSaving.value = false
        return
      }
      await adminService.createAIModel(dto)
      ui.toast.success('Đã tạo model mới')
    }
    formModal.value = false
    loadModels()
  } catch {
    ui.toast.error('Lưu thất bại')
  } finally {
    isSaving.value = false
  }
}

function openDelete(model: AIModel) {
  deleteTarget.value = model
  deleteModal.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await adminService.deleteAIModel(deleteTarget.value.id)
    ui.toast.success('Đã xoá model')
    deleteModal.value = false
    loadModels()
  } catch {
    ui.toast.error('Xoá thất bại')
  } finally {
    isDeleting.value = false
  }
}

function openTest(model: AIModel) {
  testTarget.value = model
  testPrompt.value = ''
  testOutput.value = null
  testModal.value = true
}

async function doTest() {
  if (!testTarget.value || !testPrompt.value.trim()) {
    ui.toast.error('Vui lòng nhập prompt test')
    return
  }
  isTesting.value = true
  testOutput.value = null
  try {
    testOutput.value = await adminService.testAIModel(testTarget.value.id, { prompt: testPrompt.value.trim() })
  } catch {
    ui.toast.error('Test model thất bại')
  } finally {
    isTesting.value = false
  }
}

onMounted(loadModels)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-gold mb-1">AI Models</h1>
        <p class="text-text-muted text-sm">Quản lý các mô hình AI</p>
      </div>
      <AppButton variant="primary" @click="openCreate">+ Thêm model</AppButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <div v-else class="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-card">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-subtle">
              <th class="text-left px-4 py-3 text-text-muted font-medium">Tên</th>
              <th class="text-left px-4 py-3 text-text-muted font-medium">Provider</th>
              <th class="text-left px-4 py-3 text-text-muted font-medium">Model ID</th>
              <th class="text-right px-4 py-3 text-text-muted font-medium">Priority</th>
              <th class="text-left px-4 py-3 text-text-muted font-medium">Default</th>
              <th class="text-left px-4 py-3 text-text-muted font-medium">Trạng thái</th>
              <th class="text-right px-4 py-3 text-text-muted font-medium">Tokens dùng</th>
              <th class="text-left px-4 py-3 text-text-muted font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="model in models"
              :key="model.id"
              class="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors"
            >
              <td class="px-4 py-3 text-text-primary font-medium">{{ model.name }}</td>
              <td class="px-4 py-3">
                <AppBadge variant="neon" size="sm">{{ model.provider }}</AppBadge>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-text-secondary bg-bg-surface px-2 py-0.5 rounded">{{ model.model_id }}</code>
              </td>
              <td class="px-4 py-3 text-right text-text-secondary">{{ model.priority }}</td>
              <td class="px-4 py-3">
                <AppBadge v-if="model.is_default" variant="gold" size="sm">Default</AppBadge>
                <span v-else class="text-text-muted text-xs">—</span>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="model.is_active ? 'active' : 'default'" size="sm">
                  {{ model.is_active ? 'Hoạt động' : 'Tắt' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-right text-text-muted font-mono text-xs">
                {{ model.total_tokens?.toLocaleString('vi-VN') ?? 0 }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <AppButton variant="ghost" size="sm" @click="openTest(model)">Test</AppButton>
                  <AppButton variant="secondary" size="sm" @click="openEdit(model)">Sửa</AppButton>
                  <AppButton variant="danger" size="sm" @click="openDelete(model)">Xoá</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="models.length === 0" class="py-16 text-center text-text-muted">
        Chưa có AI model nào
      </div>
    </div>

    <!-- Form modal -->
    <AppModal :show="formModal" :title="editingModel ? 'Sửa AI Model' : 'Thêm AI Model'" size="lg" @close="formModal = false">
      <div class="space-y-4">

        <!-- Row 1: Tên + Provider -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Tên model <span class="text-red-400">*</span></label>
            <input
              v-model="form.name"
              placeholder="VD: GPT-4o Mini"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Provider</label>
            <select
              v-model="form.provider"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
              @change="fetchedModels = []"
            >
              <option v-for="p in providers" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <!-- Row 2: API Key + Fetch button (create) / just API Key (edit) -->
        <div>
          <label class="block text-sm text-text-secondary mb-1.5">
            API Key
            <span v-if="!editingModel" class="text-red-400">*</span>
            <span v-else class="text-text-muted text-xs ml-1">(để trống nếu không đổi)</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="form.api_key"
              type="password"
              :placeholder="editingModel ? '••••••••' : 'Nhập API Key rồi bấm Fetch Models'"
              class="flex-1 bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
            />
            <button
              v-if="!editingModel"
              type="button"
              :disabled="isFetching || !form.api_key.trim()"
              class="px-4 py-2.5 text-sm font-medium rounded-xl border border-mystic text-mystic-glow hover:bg-mystic/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              @click="doFetchModels"
            >
              <AppSpinner v-if="isFetching" size="sm" />
              <span>{{ isFetching ? 'Đang tải...' : 'Fetch Models' }}</span>
            </button>
          </div>
        </div>

        <!-- Row 3: Model select (after fetch) or manual input (edit) -->
        <div>
          <label class="block text-sm text-text-secondary mb-1.5">Model ID <span class="text-red-400">*</span></label>

          <!-- After fetch: show dropdown -->
          <select
            v-if="fetchedModels.length > 0"
            v-model="form.model_id"
            class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
          >
            <option v-for="m in fetchedModels" :key="m" :value="m">{{ m }}</option>
          </select>

          <!-- Edit mode: show current model_id as readonly (must re-fetch to change) -->
          <div v-else-if="editingModel">
            <div class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary font-mono opacity-70">
              {{ form.model_id || '—' }}
            </div>
            <p class="mt-1 text-xs text-text-muted">
              Nhập API Key mới rồi bấm <span class="text-mystic-glow">Fetch Models</span> để đổi model
            </p>
          </div>

          <!-- Create mode before fetch -->
          <div v-else>
            <div class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-muted opacity-50 cursor-not-allowed">
              — Chưa fetch —
            </div>
            <p class="mt-1 text-xs text-text-muted">
              Nhập API Key và bấm <span class="text-mystic-glow">Fetch Models</span> để chọn model
            </p>
          </div>
        </div>

        <!-- Row 4: Priority / Max Tokens / Temperature -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Priority</label>
            <input
              v-model.number="form.priority"
              type="number"
              min="1"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Max Tokens</label>
            <input
              v-model.number="form.max_tokens"
              type="number"
              min="256"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Temperature</label>
            <input
              v-model.number="form.temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Row 5: Checkboxes -->
        <div class="flex gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.is_default" type="checkbox" class="rounded" />
            <span class="text-sm text-text-secondary">Đặt làm mặc định</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="rounded" />
            <span class="text-sm text-text-secondary">Kích hoạt</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="ghost" @click="formModal = false">Huỷ</AppButton>
          <AppButton
            variant="primary"
            :loading="isSaving"
            :disabled="!editingModel && fetchedModels.length === 0 && !form.model_id"
            @click="doSave"
          >
            {{ editingModel ? 'Lưu thay đổi' : 'Tạo model' }}
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- Delete modal -->
    <AppModal :show="deleteModal" title="Xoá AI Model" size="sm" @close="deleteModal = false">
      <p class="text-text-secondary mb-5">
        Bạn có chắc muốn xoá model <strong class="text-gold">{{ deleteTarget?.name }}</strong>?
      </p>
      <div class="flex justify-end gap-3">
        <AppButton variant="ghost" @click="deleteModal = false">Huỷ</AppButton>
        <AppButton variant="danger" :loading="isDeleting" @click="doDelete">Xoá</AppButton>
      </div>
    </AppModal>

    <!-- Test modal -->
    <AppModal :show="testModal" :title="`Test: ${testTarget?.name}`" size="lg" @close="testModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-text-secondary mb-1.5">Prompt test</label>
          <textarea
            v-model="testPrompt"
            placeholder="Nhập prompt để test model..."
            rows="4"
            class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors resize-none"
          />
        </div>
        <div class="flex justify-end">
          <AppButton variant="primary" :loading="isTesting" @click="doTest">Chạy test</AppButton>
        </div>
        <div v-if="testOutput" class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-text-secondary">Kết quả</p>
            <AppBadge variant="neon" size="sm">{{ testOutput.tokens_used }} tokens</AppBadge>
          </div>
          <pre class="text-xs text-text-secondary overflow-auto max-h-64 bg-bg-surface p-3 rounded-xl border border-border-subtle whitespace-pre-wrap">{{ testOutput.output }}</pre>
        </div>
      </div>
    </AppModal>
  </div>
</template>
