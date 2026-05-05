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
        <div class="header-copy">
          <p class="eyebrow">{{ metadata?.app?.name }}</p>
          <h1>{{ selectedEntity?.label || 'Centro de consulta' }}</h1>
          <p class="page-description">{{ selectedEntity?.description || metadata?.app?.subtitle }}</p>

          <div class="hero-insights">
            <span>{{ entityGroups.length }} areas operativas</span>
            <span>{{ metadata?.entities?.length || 0 }} tablas conectadas</span>
            <span>{{ pagination.pageSize }} filas por vista</span>
          </div>
        </div>

        <div class="header-actions">
          <div class="user-card">
            <span class="user-avatar">{{ currentUser?.nombre?.charAt(0) || 'U' }}</span>
            <span class="user-label">Sesion activa</span>
            <strong>{{ currentUser?.nombre || 'Usuario' }}</strong>
            <span>{{ currentUser?.rol || 'Sin rol' }}</span>
          </div>
          <Button label="Cerrar sesion" variant="ghost" @click="logout" />
        </div>
      </header>

      <section class="dashboard-grid">
        <Card title="Entidad activa" variant="primary" class="metric-card">
          <span class="metric-icon metric-icon-primary">EA</span>
          <div class="metric-value">{{ selectedEntity?.label }}</div>
          <p class="metric-text">Categoria {{ selectedEntity?.category || 'General' }}</p>
        </Card>
        <Card title="Registros disponibles" variant="success" class="metric-card">
          <span class="metric-icon metric-icon-success">RD</span>
          <div class="metric-value">{{ pagination.total }}</div>
          <p class="metric-text">Total actual encontrado para la tabla seleccionada.</p>
        </Card>
        <Card title="Llave principal" variant="default" class="metric-card">
          <span class="metric-icon metric-icon-warning">PK</span>
          <div class="metric-value metric-small">{{ selectedEntity?.primaryKeys?.join(', ') || 'Sin definir' }}</div>
          <p class="metric-text">{{ selectedEntity?.hasSimplePrimaryKey ? 'Referencia principal para consulta.' : 'Consulta basada en llave compuesta.' }}</p>
        </Card>
        <Card title="Modo de acceso" variant="default" class="metric-card">
          <span class="metric-icon metric-icon-coral">MA</span>
          <div class="metric-value metric-small">{{ accessModeLabel }}</div>
          <p class="metric-text">La aplicacion muestra informacion y, en beneficiarios, permite altas manuales.</p>
        </Card>
      </section>

      <div class="workspace-layout">
        <aside class="sidebar">
          <div class="sidebar-intro">
            <span class="sidebar-kicker">Modulos</span>
            <strong>Explorador de datos</strong>
            <p>Selecciona una entidad para consultar registros y relaciones clave.</p>
          </div>

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
            <div class="toolbar-heading">
              <div>
                <span class="section-kicker">Consulta inteligente</span>
                <h2>Filtra, ordena y explora registros</h2>
              </div>
              <Badge variant="primary">{{ selectedEntity?.category || 'General' }}</Badge>
            </div>

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
              </div>
            </div>
          </Card>

          <Card v-if="isBeneficiarioTable" class="panel-switcher-card">
            <div class="panel-switcher">
              <button type="button" class="panel-tab" :class="{ active: activePanel === 'consulta' }" @click="activePanel = 'consulta'">
                Consulta
              </button>
              <button type="button" class="panel-tab" :class="{ active: activePanel === 'registro' }" @click="openBeneficiaryRegister">
                Registrar beneficiario
              </button>
            </div>
          </Card>

          <template v-if="isBeneficiarioTable && activePanel === 'registro'">
            <Card title="Registrar beneficiario" class="register-card">
              <div class="form-banner">
                <strong>Nuevo beneficiario</strong>
                <span>Captura datos basicos y clasificacion para integrarlo al flujo operativo.</span>
              </div>

              <form class="beneficiary-form" @submit.prevent="submitBeneficiary">
                <div class="form-grid">
                  <div class="field-block">
                    <label>Nombres</label>
                    <input v-model="beneficiaryForm.nombres" class="text-input" type="text" placeholder="Nombres" />
                  </div>
                  <div class="field-block">
                    <label>Apellidos</label>
                    <input v-model="beneficiaryForm.apellidos" class="text-input" type="text" placeholder="Apellidos" />
                  </div>
                  <div class="field-block">
                    <label>Documento</label>
                    <input v-model="beneficiaryForm.documento" class="text-input" type="text" placeholder="Numero de documento" />
                  </div>
                  <div class="field-block">
                    <label>Telefono</label>
                    <input v-model="beneficiaryForm.telefono" class="text-input" type="text" placeholder="Telefono de contacto" />
                  </div>
                  <div class="field-block field-block-wide">
                    <label>Correo</label>
                    <input v-model="beneficiaryForm.correo" class="text-input" type="email" placeholder="Correo electronico" />
                  </div>
                  <div class="field-block field-block-wide">
                    <label>Direccion</label>
                    <input v-model="beneficiaryForm.direccion" class="text-input" type="text" placeholder="Direccion de residencia" />
                  </div>
                  <div class="field-block">
                    <label>Municipio</label>
                    <select v-if="beneficiaryCatalogs.ciudades.length" v-model="beneficiaryForm.id_ciudad" class="select-input" :disabled="beneficiaryCatalogsLoading">
                      <option value="">Seleccionar municipio</option>
                      <option v-for="city in beneficiaryCatalogs.ciudades" :key="city.id_ciudad" :value="city.id_ciudad">
                        {{ city.codigo_dane_municipio }} - {{ city.nombre_ciudad }}
                      </option>
                    </select>
                    <input v-else v-model="beneficiaryForm.id_ciudad" class="text-input" type="text" placeholder="Codigo de municipio" />
                  </div>
                  <div class="field-block">
                    <label>Tipo de poblacion</label>
                    <select v-if="beneficiaryCatalogs.tiposPoblacion.length" v-model="beneficiaryForm.id_tipo_poblacion" class="select-input" :disabled="beneficiaryCatalogsLoading">
                      <option value="">Seleccionar tipo</option>
                      <option v-for="tipo in beneficiaryCatalogs.tiposPoblacion" :key="tipo.id_tipo_poblacion" :value="tipo.id_tipo_poblacion">
                        {{ tipo.nombre_tipo }}
                      </option>
                    </select>
                    <input v-else v-model="beneficiaryForm.id_tipo_poblacion" class="text-input" type="text" placeholder="Tipo de poblacion o SISBEN" />
                  </div>
                </div>

                <p class="form-help">Se guardara el beneficiario, su municipio y su clasificacion poblacional.</p>

                <div class="form-actions">
                  <button type="button" class="mini-action" @click="resetBeneficiaryForm">Limpiar</button>
                  <Button label="Guardar beneficiario" variant="success" :loading="savingBeneficiary" />
                </div>
              </form>
            </Card>
          </template>

          <template v-else>
            <Card title="Filtros de consulta avanzada" class="filters-card">
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in records" :key="recordKey(record)">
                      <td v-for="column in visibleColumns" :key="column.name">{{ formatCell(record[column.name]) }}</td>
                    </tr>
                  </tbody>
                </table>

                <div v-else class="empty-state">
                  <h3>Sin resultados</h3>
                  <p>No se encontraron registros con los criterios de consulta actuales.</p>
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
          </template>
        </main>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from './Card.vue'
import Button from './Button.vue'
import Badge from './Badge.vue'
import { useToast } from '../composables/useToast'

const API_BASE = 'http://localhost:3001/api'

const router = useRouter()
const { toasts, success, error: notifyError } = useToast()

const loadingApp = ref(true)
const loadingRecords = ref(false)
const metadata = ref(null)
const records = ref([])
const selectedTable = ref('')
const searchText = ref('')
const sortField = ref('')
const sortDirection = ref('ASC')
const errorMessage = ref('')
const filters = ref([])
const activePanel = ref('consulta')
const savingBeneficiary = ref(false)
const beneficiaryCatalogsLoading = ref(false)
const beneficiaryCatalogsLoaded = ref(false)
const beneficiaryCatalogs = reactive({
  ciudades: [],
  tiposPoblacion: []
})
const beneficiaryForm = reactive({
  nombres: '',
  apellidos: '',
  documento: '',
  telefono: '',
  correo: '',
  direccion: '',
  id_ciudad: '',
  id_tipo_poblacion: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 15,
  total: 0,
  totalPages: 1
})

const currentUser = computed(() => {
  const storedUser = localStorage.getItem('usuario')
  return storedUser ? JSON.parse(storedUser) : null
})

const selectedEntity = computed(() => metadata.value?.entities?.find((entity) => entity.name === selectedTable.value) || null)
const isBeneficiarioTable = computed(() => selectedTable.value === 'beneficiario')
const accessModeLabel = computed(() => {
  if (!isBeneficiarioTable.value) {
    return 'Solo consulta'
  }

  return activePanel.value === 'registro' ? 'Alta de beneficiarios' : 'Consulta y registro'
})

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

const resetBeneficiaryForm = () => {
  beneficiaryForm.nombres = ''
  beneficiaryForm.apellidos = ''
  beneficiaryForm.documento = ''
  beneficiaryForm.telefono = ''
  beneficiaryForm.correo = ''
  beneficiaryForm.direccion = ''
  beneficiaryForm.id_ciudad = ''
  beneficiaryForm.id_tipo_poblacion = ''
}

const loadBeneficiaryCatalogs = async () => {
  if (beneficiaryCatalogsLoading.value || beneficiaryCatalogsLoaded.value) {
    return
  }

  beneficiaryCatalogsLoading.value = true

  try {
    const [ciudades, tiposPoblacion] = await Promise.all([
      fetchJson(`${API_BASE}/catalogos/ciudades`, { headers: authHeaders() }),
      fetchJson(`${API_BASE}/catalogos/tipos-poblacion`, { headers: authHeaders() })
    ])

    beneficiaryCatalogs.ciudades = ciudades || []
    beneficiaryCatalogs.tiposPoblacion = tiposPoblacion || []
    beneficiaryCatalogsLoaded.value = true
  } catch (err) {
    notifyError(err.message)
  } finally {
    beneficiaryCatalogsLoading.value = false
  }
}

const openBeneficiaryRegister = async () => {
  activePanel.value = 'registro'
  await loadBeneficiaryCatalogs()
}

const submitBeneficiary = async () => {
  const nombres = beneficiaryForm.nombres.trim()
  const apellidos = beneficiaryForm.apellidos.trim()
  const documento = beneficiaryForm.documento.trim()

  if (!nombres || !apellidos || !documento || !beneficiaryForm.id_ciudad || !beneficiaryForm.id_tipo_poblacion) {
    notifyError('Completa nombres, apellidos, documento, municipio y tipo de poblacion.')
    return
  }

  savingBeneficiary.value = true

  try {
    await fetchJson(`${API_BASE}/beneficiarios`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        nombres: `${nombres} ${apellidos}`,
        documento,
        telefono: beneficiaryForm.telefono.trim() || null,
        correo: beneficiaryForm.correo.trim() || null,
        direccion: beneficiaryForm.direccion.trim() || null,
        id_ciudad: beneficiaryForm.id_ciudad,
        id_tipo_poblacion: beneficiaryForm.id_tipo_poblacion
      })
    })

    success('Beneficiario registrado correctamente')
    resetBeneficiaryForm()
    activePanel.value = 'consulta'
    await loadRecords(true)
  } catch (err) {
    notifyError(err.message)
  } finally {
    savingBeneficiary.value = false
  }
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
    if (selectedTable.value === 'beneficiario') {
      await loadBeneficiaryCatalogs()
    }
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

  if (table !== 'beneficiario') {
    activePanel.value = 'consulta'
    return
  }

  void loadBeneficiaryCatalogs()
})

onMounted(loadMetadata)
</script>

<style scoped>
.operations-page {
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(0, 52, 120, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(0, 52, 120, 0.035) 1px, transparent 1px),
    linear-gradient(135deg, #f7fbff 0%, #eef5f2 48%, #fff7ed 100%);
  background-size: 28px 28px, 28px 28px, auto;
  padding: 2rem;
  color: #172033;
}

.toast-banner {
  position: fixed;
  right: 1.5rem;
  top: 1.5rem;
  z-index: 2000;
  padding: 0.95rem 1.1rem;
  border-radius: 8px;
  color: white;
  box-shadow: 0 18px 50px rgba(12, 20, 36, 0.24);
  font-weight: 700;
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
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 52, 120, 0.1);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 24px 70px rgba(0, 29, 69, 0.14);
  max-width: 440px;
  text-align: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 2rem;
  margin-bottom: 1.25rem;
  padding: 2rem;
  min-height: 300px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background:
    linear-gradient(120deg, rgba(0, 52, 120, 0.96), rgba(0, 29, 69, 0.92) 54%, rgba(233, 75, 60, 0.78)),
    linear-gradient(45deg, rgba(255, 255, 255, 0.13), transparent 55%);
  box-shadow: 0 26px 80px rgba(0, 29, 69, 0.22);
}

.page-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(90deg, black, transparent 86%);
  pointer-events: none;
}

.page-header::after {
  content: "";
  position: absolute;
  right: -8rem;
  bottom: -7rem;
  width: 35rem;
  height: 35rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  transform: rotate(28deg);
  pointer-events: none;
}

.header-copy,
.header-actions {
  position: relative;
  z-index: 1;
}

.header-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 780px;
}

.header-copy h1 {
  color: white;
  font-size: clamp(2.2rem, 5vw, 4.8rem);
  line-height: 0.96;
  max-width: 900px;
  margin-bottom: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  font-weight: 800;
}

.page-description {
  max-width: 720px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.05rem;
}

.hero-insights {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.hero-insights span {
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  font-size: 0.86rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  align-self: flex-start;
  flex-wrap: wrap;
}

.page-header :deep(.btn-ghost) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.36);
  color: white;
  box-shadow: none;
}

.page-header :deep(.btn-ghost:hover:not(.btn-disabled)) {
  background: rgba(255, 255, 255, 0.2);
}

.user-card {
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  padding: 0.95rem 1rem 0.95rem 4rem;
  display: grid;
  min-width: 240px;
  color: white;
  position: relative;
  backdrop-filter: blur(12px);
}

.user-avatar {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border-radius: 8px;
  background: #ffffff;
  color: var(--color-primary-dark);
  font-weight: 900;
  text-transform: uppercase;
}

.user-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  min-height: 178px;
}

.metric-card :deep(.card-header) {
  border-bottom: 0;
  padding-bottom: 0.45rem;
}

.metric-card :deep(.card-body) {
  position: relative;
  padding-top: 0.65rem;
}

.metric-card :deep(.card-header h3) {
  color: #41516b;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-icon {
  position: absolute;
  right: 1.2rem;
  top: 0.7rem;
  width: 2.7rem;
  height: 2.7rem;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 900;
}

.metric-icon-primary {
  color: #003478;
  background: #dbeafe;
}

.metric-icon-success {
  color: #047857;
  background: #d1fae5;
}

.metric-icon-warning {
  color: #92400e;
  background: #fef3c7;
}

.metric-icon-coral {
  color: #b42318;
  background: #fee4e2;
}

.metric-value {
  padding-right: 3.6rem;
  font-size: clamp(1.7rem, 3vw, 2.45rem);
  font-weight: 900;
  color: var(--color-primary-dark);
  line-height: 1.05;
}

.metric-small {
  font-size: 1.05rem;
  line-height: 1.25;
}

.metric-text {
  margin-top: 0.5rem;
  color: #65738a;
  font-size: 0.92rem;
}

.workspace-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.sidebar {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(0, 52, 120, 0.08);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 18px 55px rgba(0, 29, 69, 0.1);
  position: sticky;
  top: 1.5rem;
  max-height: calc(100vh - 3rem);
  overflow: auto;
  backdrop-filter: blur(16px);
}

.sidebar-intro {
  padding: 0.95rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 52, 120, 0.1), rgba(76, 175, 80, 0.12)),
    #f8fbff;
  border: 1px solid rgba(0, 52, 120, 0.08);
}

.sidebar-intro strong {
  display: block;
  color: var(--color-primary-dark);
  font-size: 1.05rem;
}

.sidebar-intro p {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.9rem;
}

.sidebar-kicker,
.section-kicker {
  display: inline-block;
  color: #e94b3c;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
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
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-800);
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

.sidebar-link:hover {
  background: rgba(0, 52, 120, 0.06);
  border-color: rgba(0, 52, 120, 0.08);
  transform: translateX(2px);
}

.sidebar-link.active {
  background: linear-gradient(135deg, rgba(0, 52, 120, 0.12), rgba(33, 150, 243, 0.1));
  border-color: rgba(0, 52, 120, 0.18);
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

.toolbar-card :deep(.card-body) {
  display: grid;
  gap: 1.15rem;
}

.toolbar-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.toolbar-heading h2 {
  margin-top: 0.2rem;
  color: var(--color-primary-dark);
  font-size: clamp(1.35rem, 2vw, 1.85rem);
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.panel-switcher-card {
  padding: 0.75rem 1rem;
}

.panel-switcher {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.panel-tab {
  border: 1px solid rgba(0, 52, 120, 0.15);
  background: white;
  color: var(--color-gray-700);
  border-radius: 8px;
  padding: 0.7rem 1rem;
  cursor: pointer;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.panel-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 12px 24px rgba(0, 52, 120, 0.18);
}

.register-card {
  padding-bottom: 1rem;
}

.form-banner {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid rgba(76, 175, 80, 0.16);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(0, 52, 120, 0.06));
}

.form-banner strong {
  color: #14532d;
}

.form-banner span {
  color: #516071;
}

.beneficiary-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-help {
  color: var(--color-gray-600);
  font-size: 0.92rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
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
  border: 1px solid #cfd9e8;
  border-radius: 8px;
  padding: 0.85rem 0.95rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: var(--color-gray-900);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}

.text-input:focus,
.select-input:focus,
.text-area:focus {
  outline: none;
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 4px rgba(0, 52, 120, 0.1);
  background: white;
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
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.mini-action:hover {
  background: rgba(0, 52, 120, 0.07);
  transform: translateY(-1px);
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
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th,
.data-table td {
  padding: 0.85rem 0.75rem;
  border-bottom: 1px solid var(--color-gray-200);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f7faff;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #46566f;
  font-weight: 900;
}

.data-table td {
  color: #243247;
}

.data-table tbody tr:nth-child(even) {
  background: #fbfdff;
}

.data-table tbody tr:hover {
  background: #eef6ff;
}

.empty-state {
  border: 1px dashed #b8c7dc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #fbfdff;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  color: #56657b;
  font-weight: 700;
}

.pagination-actions {
  display: flex;
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
  .filter-actions,
  .pagination-actions {
    flex-wrap: wrap;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    justify-content: flex-start;
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
