<template>
  <div class="operations-page">
    <div v-for="toast in toasts" :key="toast.id" class="toast-banner" :class="`toast-${toast.type}`">
      {{ toast.message }}
    </div>

    <div v-if="loadingApp" class="loading-screen">
      <div class="loading-card">
        <h2>Cargando aplicativo</h2>
        <p>Obteniendo metadatos de tablas y configuracion del sistema.</p>
      </div>
    </div>

    <template v-else>
      <header class="page-header">
        <div>
          <p class="eyebrow">{{ metadata?.app?.name }}</p>
          <h1>{{ selectedEntity?.label || 'Centro operativo' }}</h1>
          <p class="page-description">{{ selectedEntity?.description || metadata?.app?.subtitle }}</p>
        </div>

        <div class="header-actions">
          <div class="user-card">
            <span class="user-label">Sesion activa</span>
            <strong>{{ currentUser?.nombre || 'Usuario' }}</strong>
            <span>{{ currentUser?.rol || 'Sin rol' }}</span>
          </div>
          <Button label="Cerrar sesion" variant="ghost" @click="logout" />
        </div>
      </header>

      <section class="dashboard-grid">
        <Card title="Entidad activa" variant="primary">
          <div class="metric-value">{{ selectedEntity?.label }}</div>
          <p class="metric-text">Categoria {{ selectedEntity?.category || 'General' }}</p>
        </Card>
        <Card title="Registros en vista" variant="success">
          <div class="metric-value">{{ pagination.total }}</div>
          <p class="metric-text">Total actual para la tabla seleccionada.</p>
        </Card>
        <Card title="Llave primaria" variant="default">
          <div class="metric-value metric-small">{{ selectedEntity?.primaryKeys?.join(', ') || 'Sin definir' }}</div>
          <p class="metric-text">{{ selectedEntity?.hasSimplePrimaryKey ? 'CRUD completo habilitado.' : 'Llave compuesta.' }}</p>
        </Card>
        <Card title="Acceso de prueba" variant="default">
          <div class="metric-value metric-small">{{ metadata?.app?.sampleLogin?.username }}</div>
          <p class="metric-text">Clave {{ metadata?.app?.sampleLogin?.password }}</p>
        </Card>
      </section>

      <div class="workspace-layout">
        <aside class="sidebar">
          <div v-for="group in entityGroups" :key="group.category" class="sidebar-group">
            <p class="sidebar-title">{{ group.category }}</p>
            <button
              v-for="entity in group.entities"
              :key="entity.name"
              type="button"
              class="sidebar-link"
              :class="{ active: entity.name === selectedTable }"
              @click="changeTable(entity.name)"
            >
              <span>{{ entity.label }}</span>
              <Badge variant="info" size="sm">{{ entityTotals[entity.name] ?? 0 }}</Badge>
            </button>
          </div>
        </aside>

        <main class="workspace-main">
          <Card class="toolbar-card">
            <div class="toolbar-grid">
              <div class="field-block field-block-wide">
                <label>Busqueda rapida</label>
                <input v-model="searchText" type="text" class="text-input" placeholder="Buscar por texto en la tabla" @keyup.enter="loadRecords(true)" />
              </div>

              <div class="field-block">
                <label>Ordenar por</label>
                <select v-model="sortField" class="select-input">
                  <option v-for="column in selectedEntity?.columns || []" :key="column.name" :value="column.name">{{ column.name }}</option>
                </select>
              </div>

              <div class="field-block">
                <label>Direccion</label>
                <select v-model="sortDirection" class="select-input">
                  <option value="ASC">Ascendente</option>
                  <option value="DESC">Descendente</option>
                </select>
              </div>

              <div class="toolbar-actions">
                <Button label="Consultar" variant="primary" :loading="loadingRecords" @click="loadRecords(true)" />
                <Button label="Nueva fila" variant="secondary" :disabled="!selectedEntity?.allowCreate" @click="openCreateForm" />
              </div>
            </div>
          </Card>

          <Card title="Busqueda avanzada" class="filters-card">
            <div class="filters-stack">
              <div v-for="filter in filters" :key="filter.id" class="filter-row">
                <select v-model="filter.field" class="select-input" @change="onFilterFieldChange(filter)">
                  <option value="">Campo</option>
                  <option v-for="column in selectedEntity?.columns || []" :key="column.name" :value="column.name">{{ column.name }}</option>
                </select>

                <select v-model="filter.operator" class="select-input">
                  <option value="">Operador</option>
                  <option v-for="operator in filterOperators(filter)" :key="operator" :value="operator">{{ operator }}</option>
                </select>

                <template v-if="filterTakesValue(filter)">
                  <input
                    v-if="filterInputType(filter) !== 'textarea'"
                    v-model="filter.value"
                    :type="filterInputType(filter)"
                    class="text-input"
                    :placeholder="filterPlaceholder(filter)"
                  />
                  <textarea
                    v-else
                    v-model="filter.value"
                    class="text-area"
                    :placeholder="filterPlaceholder(filter)"
                  ></textarea>
                </template>

                <input
                  v-if="filter.operator === 'BETWEEN'"
                  v-model="filter.secondValue"
                  :type="filterInputType(filter)"
                  class="text-input"
                  placeholder="Valor final"
                />

                <button type="button" class="mini-action danger" @click="removeFilter(filter.id)">Quitar</button>
              </div>

              <div class="filter-actions">
                <button type="button" class="mini-action" @click="addFilter">Agregar filtro</button>
                <button type="button" class="mini-action" @click="clearFilters">Limpiar filtros</button>
              </div>
            </div>
          </Card>

          <Card :title="`Registros de ${selectedEntity?.label || ''}`" class="table-card">
            <div class="table-meta">
              <div class="table-meta-left">
                <Badge variant="primary">{{ selectedEntity?.category }}</Badge>
                <Badge :variant="selectedEntity?.hasSimplePrimaryKey ? 'success' : 'warning'">
                  {{ selectedEntity?.hasSimplePrimaryKey ? 'Llave simple' : 'Llave compuesta' }}
                </Badge>
                <Badge variant="info">{{ records.length }} filas cargadas</Badge>
              </div>
              <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
            </div>

            <div class="table-wrapper">
              <table v-if="records.length > 0" class="data-table">
                <thead>
                  <tr>
                    <th v-for="column in visibleColumns" :key="column.name">{{ column.name }}</th>
                    <th class="actions-column">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in records" :key="recordKey(record)">
                    <td v-for="column in visibleColumns" :key="column.name">{{ formatCell(record[column.name]) }}</td>
                    <td class="row-actions">
                      <button
                        v-if="selectedEntity?.allowUpdate && selectedEntity?.hasSimplePrimaryKey"
                        type="button"
                        class="mini-action"
                        @click="openEditForm(record)"
                      >
                        Editar
                      </button>
                      <button
                        v-if="selectedEntity?.allowDelete"
                        type="button"
                        class="mini-action danger"
                        @click="deleteRecord(record)"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="empty-state">
                <h3>Sin resultados</h3>
                <p>No se encontraron registros con los criterios actuales.</p>
              </div>
            </div>

            <div class="pagination-bar">
              <span>Pagina {{ pagination.page }} de {{ pagination.totalPages }}</span>
              <div class="pagination-actions">
                <Button label="Anterior" variant="ghost" :disabled="pagination.page <= 1 || loadingRecords" @click="goToPage(pagination.page - 1)" />
                <Button label="Siguiente" variant="ghost" :disabled="pagination.page >= pagination.totalPages || loadingRecords" @click="goToPage(pagination.page + 1)" />
              </div>
            </div>
          </Card>
        </main>
      </div>
    </template>

    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <div class="modal-panel">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ formMode === 'create' ? 'Crear registro' : 'Editar registro' }}</p>
            <h2>{{ selectedEntity?.label }}</h2>
          </div>
          <button type="button" class="close-button" @click="closeForm">Cerrar</button>
        </div>

        <form class="modal-form" @submit.prevent="submitForm">
          <div class="form-grid">
            <div v-for="column in editableColumns" :key="column.name" class="field-block">
              <label :for="column.name">{{ column.name }}</label>

              <select v-if="column.type === 'boolean'" :id="column.name" v-model="formData[column.name]" class="select-input">
                <option value="">Sin valor</option>
                <option :value="true">Si</option>
                <option :value="false">No</option>
              </select>

              <textarea
                v-else-if="resolveInputType(column) === 'textarea'"
                :id="column.name"
                v-model="formData[column.name]"
                class="text-area"
                :placeholder="column.name"
              ></textarea>

              <input
                v-else
                :id="column.name"
                v-model="formData[column.name]"
                :type="resolveInputType(column)"
                class="text-input"
                :placeholder="column.name"
              />
            </div>
          </div>

          <div class="modal-actions">
            <Button label="Cancelar" variant="ghost" @click="closeForm" />
            <Button :label="formMode === 'create' ? 'Guardar' : 'Actualizar'" variant="primary" :loading="savingRecord" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from './Card.vue'
import Button from './Button.vue'
import Badge from './Badge.vue'
import { useToast } from '../composables/useToast'

const API_BASE = 'http://localhost:3000/api'

const router = useRouter()
const { toasts, success, error: notifyError } = useToast()

const loadingApp = ref(true)
const loadingRecords = ref(false)
const savingRecord = ref(false)
const metadata = ref(null)
const records = ref([])
const selectedTable = ref('')
const searchText = ref('')
const sortField = ref('')
const sortDirection = ref('ASC')
const errorMessage = ref('')
const showForm = ref(false)
const formMode = ref('create')
const editingRecord = ref(null)
const filters = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 15,
  total: 0,
  totalPages: 1
})

const formData = reactive({})

const currentUser = computed(() => {
  const storedUser = localStorage.getItem('usuario')
  return storedUser ? JSON.parse(storedUser) : null
})

const selectedEntity = computed(() => metadata.value?.entities?.find((entity) => entity.name === selectedTable.value) || null)

const entityGroups = computed(() => {
  const entities = metadata.value?.entities || []
  const groups = new Map()

  entities.forEach((entity) => {
    if (!groups.has(entity.category)) {
      groups.set(entity.category, [])
    }

    groups.get(entity.category).push(entity)
  })

  return Array.from(groups.entries()).map(([category, groupedEntities]) => ({
    category,
    entities: groupedEntities
  }))
})

const entityTotals = computed(() => {
  const totals = {}
  ;(metadata.value?.dashboard || []).forEach((item) => {
    totals[item.table] = item.total
  })
  return totals
})

const visibleColumns = computed(() => {
  if (!selectedEntity.value) {
    return []
  }

  return selectedEntity.value.listFields
    .map((field) => selectedEntity.value.columns.find((column) => column.name === field))
    .filter(Boolean)
})

const editableColumns = computed(() => {
  if (!selectedEntity.value) {
    return []
  }

  return selectedEntity.value.columns.filter((column) => {
    if (formMode.value === 'create') {
      return column.editableOnCreate
    }

    return column.editableOnUpdate
  })
})

const authHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('usuario')
  router.push('/')
}

const handleAuthError = () => {
  notifyError('Tu sesion expiro. Debes ingresar nuevamente.')
  logout()
}

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options)

  if (response.status === 401 || response.status === 403) {
    handleAuthError()
    throw new Error('Sesion expirada')
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'No fue posible completar la operacion')
  }

  return data
}

const addFilter = () => {
  filters.value.push({
    id: Date.now() + Math.random(),
    field: '',
    operator: '',
    value: '',
    secondValue: ''
  })
}

const removeFilter = (filterId) => {
  filters.value = filters.value.filter((filter) => filter.id !== filterId)
}

const clearFilters = () => {
  filters.value = []
}

const changeTable = async (tableName) => {
  selectedTable.value = tableName
  searchText.value = ''
  clearFilters()
  pagination.page = 1

  if (selectedEntity.value) {
    sortField.value = selectedEntity.value.primaryKeys[0] || selectedEntity.value.columns[0]?.name || ''
  }

  await loadRecords(true)
}

const filterColumn = (filter) => selectedEntity.value?.columns.find((column) => column.name === filter.field)

const filterOperators = (filter) => filterColumn(filter)?.operators || []

const filterTakesValue = (filter) => !['IS NULL', 'IS NOT NULL'].includes(filter.operator)

const filterInputType = (filter) => resolveInputType(filterColumn(filter))

const filterPlaceholder = (filter) => {
  if (filter.operator === 'IN') {
    return 'Valor1, Valor2, Valor3'
  }

  return 'Valor'
}

const onFilterFieldChange = (filter) => {
  filter.operator = ''
  filter.value = ''
  filter.secondValue = ''
}

const normalizeByColumn = (column, value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  if (!column) {
    return value
  }

  if (column.type === 'number') {
    return Number(value)
  }

  if (column.type === 'boolean') {
    if (value === true || value === false) {
      return value
    }

    return String(value).toLowerCase() === 'true'
  }

  if (column.type === 'json' && typeof value === 'string') {
    return JSON.parse(value)
  }

  return value
}

const buildAdvancedFilters = () => {
  return filters.value
    .filter((filter) => filter.field && filter.operator)
    .map((filter) => {
      const column = filterColumn(filter)

      if (filter.operator === 'BETWEEN') {
        return {
          field: filter.field,
          operator: filter.operator,
          value: [normalizeByColumn(column, filter.value), normalizeByColumn(column, filter.secondValue)]
        }
      }

      if (filter.operator === 'IN') {
        return {
          field: filter.field,
          operator: filter.operator,
          value: String(filter.value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => normalizeByColumn(column, item))
        }
      }

      if (!filterTakesValue(filter)) {
        return {
          field: filter.field,
          operator: filter.operator
        }
      }

      return {
        field: filter.field,
        operator: filter.operator,
        value: normalizeByColumn(column, filter.value)
      }
    })
}

const loadMetadata = async () => {
  loadingApp.value = true

  try {
    metadata.value = await fetchJson(`${API_BASE}/meta/app`, {
      headers: authHeaders()
    })

    if (!selectedTable.value && metadata.value.entities.length > 0) {
      selectedTable.value = metadata.value.entities[0].name
    }

    if (selectedEntity.value) {
      sortField.value = selectedEntity.value.primaryKeys[0] || selectedEntity.value.columns[0]?.name || ''
    }

    await loadRecords(true)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loadingApp.value = false
  }
}

const loadRecords = async (resetPage = false) => {
  if (!selectedEntity.value) {
    return
  }

  if (resetPage) {
    pagination.page = 1
  }

  loadingRecords.value = true
  errorMessage.value = ''

  try {
    const advancedFilters = buildAdvancedFilters().filter((filter) => {
      if (filter.operator === 'BETWEEN') {
        return filter.value.every((value) => value !== null && value !== '')
      }

      if (filter.operator === 'IN') {
        return filter.value.length > 0
      }

      if (!Object.prototype.hasOwnProperty.call(filter, 'value')) {
        return true
      }

      return filter.value !== null && filter.value !== ''
    })

    if (advancedFilters.length > 0) {
      const searchResult = await fetchJson(
        `${API_BASE}/search/execute?page=${pagination.page}&pageSize=${pagination.pageSize}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            primaryTable: selectedTable.value,
            filters: advancedFilters,
            orderBy: sortField.value ? [{ field: sortField.value, direction: sortDirection.value }] : []
          })
        }
      )

      records.value = searchResult.data
      pagination.total = searchResult.pagination.total
      pagination.totalPages = searchResult.pagination.totalPages || 1
      success('Busqueda avanzada ejecutada')
      return
    }

    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortField: sortField.value,
      sortDirection: sortDirection.value
    })

    if (searchText.value.trim()) {
      params.set('q', searchText.value.trim())
    }

    const result = await fetchJson(`${API_BASE}/records/${selectedTable.value}?${params.toString()}`, {
      headers: authHeaders()
    })

    records.value = result.data
    pagination.total = result.pagination.total
    pagination.totalPages = result.pagination.totalPages
  } catch (err) {
    errorMessage.value = err.message
    notifyError(err.message)
  } finally {
    loadingRecords.value = false
  }
}

const goToPage = async (page) => {
  pagination.page = page
  await loadRecords(false)
}

const resetFormData = () => {
  Object.keys(formData).forEach((key) => {
    delete formData[key]
  })
}

const formatForInput = (column, value) => {
  if (value === null || value === undefined) {
    return column.type === 'boolean' ? '' : ''
  }

  if (column.type === 'boolean') {
    return value
  }

  if (column.type === 'date') {
    return String(value).slice(0, 10)
  }

  if (column.type === 'datetime') {
    return String(value).replace('Z', '').slice(0, 16)
  }

  if (column.type === 'json') {
    return JSON.stringify(value, null, 2)
  }

  return value
}

const openCreateForm = () => {
  if (!selectedEntity.value?.allowCreate) {
    return
  }

  formMode.value = 'create'
  editingRecord.value = null
  resetFormData()

  editableColumns.value.forEach((column) => {
    formData[column.name] = column.type === 'boolean' ? '' : ''
  })

  showForm.value = true
}

const openEditForm = (record) => {
  formMode.value = 'update'
  editingRecord.value = record
  resetFormData()

  editableColumns.value.forEach((column) => {
    formData[column.name] = formatForInput(column, record[column.name])
  })

  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingRecord.value = null
  resetFormData()
}

const resolveInputType = (column) => {
  if (!column) {
    return 'text'
  }

  if (column.type === 'number') {
    return 'number'
  }

  if (column.type === 'date') {
    return 'date'
  }

  if (column.type === 'datetime') {
    return 'datetime-local'
  }

  if (column.type === 'json') {
    return 'textarea'
  }

  if (column.displayType === 'textarea') {
    return 'textarea'
  }

  return 'text'
}

const buildPayload = () => {
  const payload = {}
  editableColumns.value.forEach((column) => {
    payload[column.name] = normalizeByColumn(column, formData[column.name])
  })
  return payload
}

const submitForm = async () => {
  savingRecord.value = true

  try {
    const payload = buildPayload()
    if (formMode.value === 'create') {
      await fetchJson(`${API_BASE}/records/${selectedTable.value}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      success('Registro creado correctamente')
    } else {
      const primaryKey = selectedEntity.value.primaryKeys[0]
      await fetchJson(`${API_BASE}/records/${selectedTable.value}/${editingRecord.value[primaryKey]}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      success('Registro actualizado correctamente')
    }

    closeForm()
    await loadMetadata()
  } catch (err) {
    notifyError(err.message)
  } finally {
    savingRecord.value = false
  }
}

const primaryKeyPayload = (record) => {
  const payload = {}
  selectedEntity.value.primaryKeys.forEach((primaryKey) => {
    payload[primaryKey] = record[primaryKey]
  })
  return payload
}

const deleteRecord = async (record) => {
  if (!window.confirm('Esta accion eliminara el registro seleccionado. ¿Deseas continuar?')) {
    return
  }

  try {
    if (selectedEntity.value.hasSimplePrimaryKey) {
      const primaryKey = selectedEntity.value.primaryKeys[0]
      await fetchJson(`${API_BASE}/records/${selectedTable.value}/${record[primaryKey]}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } else {
      await fetchJson(`${API_BASE}/records/${selectedTable.value}`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify(primaryKeyPayload(record))
      })
    }

    success('Registro eliminado correctamente')
    await loadMetadata()
  } catch (err) {
    notifyError(err.message)
  }
}

const recordKey = (record) => {
  if (!selectedEntity.value) {
    return JSON.stringify(record)
  }

  return selectedEntity.value.primaryKeys.map((key) => record[key]).join('-')
}

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Sin valor'
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

watch(selectedTable, (table) => {
  if (!table || !selectedEntity.value) {
    return
  }

  sortField.value = selectedEntity.value.primaryKeys[0] || selectedEntity.value.columns[0]?.name || ''
})

onMounted(loadMetadata)
</script>

<style scoped>
.operations-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%);
  padding: 2rem;
}

.toast-banner {
  position: fixed;
  right: 1.5rem;
  top: 1.5rem;
  z-index: 2000;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  color: white;
  box-shadow: var(--shadow-lg);
}

.toast-banner + .toast-banner {
  margin-top: 3.5rem;
}

.toast-success {
  background: #2e7d32;
}

.toast-error {
  background: #c62828;
}

.toast-info,
.toast-warning {
  background: var(--color-primary);
}

.loading-screen {
  min-height: calc(100vh - 4rem);
  display: grid;
  place-items: center;
}

.loading-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--shadow-xl);
  max-width: 440px;
  text-align: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-primary-light);
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.page-description {
  max-width: 720px;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-card {
  background: rgba(0, 52, 120, 0.08);
  border: 1px solid rgba(0, 52, 120, 0.12);
  border-radius: 16px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  min-width: 220px;
}

.user-label {
  font-size: 0.75rem;
  color: var(--color-gray-600);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.metric-small {
  font-size: 1.1rem;
}

.metric-text {
  margin-top: 0.5rem;
}

.workspace-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.sidebar {
  background: white;
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 1.5rem;
  max-height: calc(100vh - 3rem);
  overflow: auto;
}

.sidebar-group + .sidebar-group {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.sidebar-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gray-500);
  margin-bottom: 0.75rem;
}

.sidebar-link {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border: 0;
  background: transparent;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-800);
}

.sidebar-link:hover,
.sidebar-link.active {
  background: rgba(0, 52, 120, 0.08);
  color: var(--color-primary-dark);
}

.workspace-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-block label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.field-block-wide {
  min-width: 0;
}

.text-input,
.select-input,
.text-area {
  width: 100%;
  border: 1px solid #d6deea;
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  background: #fbfcfe;
  color: var(--color-gray-900);
}

.text-area {
  min-height: 120px;
  resize: vertical;
}

.filters-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: start;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.mini-action {
  border: 1px solid rgba(0, 52, 120, 0.15);
  background: white;
  color: var(--color-primary-dark);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  font-weight: 600;
}

.mini-action.danger {
  border-color: rgba(198, 40, 40, 0.2);
  color: #b71c1c;
}

.table-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.table-meta-left {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.inline-error {
  color: var(--color-error);
  font-weight: 600;
}

.table-wrapper {
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.85rem 0.75rem;
  border-bottom: 1px solid var(--color-gray-200);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-gray-600);
}

.actions-column {
  min-width: 160px;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  border: 1px dashed var(--color-gray-300);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.pagination-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: grid;
  place-items: center;
  z-index: 1500;
  padding: 1.5rem;
}

.modal-panel {
  width: min(960px, 100%);
  background: white;
  border-radius: 24px;
  box-shadow: var(--shadow-xl);
  max-height: calc(100vh - 3rem);
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.close-button {
  border: 0;
  background: rgba(0, 52, 120, 0.08);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  cursor: pointer;
}

.modal-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    max-height: none;
  }
}

@media (max-width: 900px) {
  .page-header,
  .toolbar-grid,
  .filter-row,
  .pagination-bar {
    grid-template-columns: 1fr;
    display: grid;
  }

  .header-actions,
  .toolbar-actions,
  .row-actions,
  .filter-actions,
  .pagination-actions,
  .modal-actions {
    flex-wrap: wrap;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .operations-page {
    padding: 1rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
