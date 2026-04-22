<template>
  <div class="smart-search-container">
    <!-- Header -->
    <header class="search-header">
      <div>
        <h1>🔍 Sistema de Búsqueda - ONG</h1>
        <p v-if="usuarioActual" class="user-info">Bienvenido: {{ usuarioActual.nombre }} ({{ usuarioActual.rol }})</p>
      </div>
      <button @click="cerrarSesion" class="btn-logout">🚪 Cerrar Sesión</button>
    </header>

    <!-- Selector de Entidades -->
    <div class="entity-selector">
      <button 
        v-for="entity in entidades" 
        :key="entity.id"
        @click="selectEntity(entity.id)"
        :class="['entity-btn', { active: currentEntity === entity.id }]"
      >
        {{ entity.icon }} {{ entity.label }}
      </button>
    </div>

    <!-- Paneles de Búsqueda por Entidad -->
    <div class="search-panel">

      <!-- DONANTES -->
      <div v-if="currentEntity === 'donantes'" class="entity-search">
        <h2>Búsqueda de Donantes</h2>
        <div class="search-fields">
          <input 
            v-model="filters.donantes.nombre"
            placeholder="Nombre del donante..."
            class="search-field"
            @keyup.enter="buscar('donantes')"
          />
          <input 
            v-model="filters.donantes.correo"
            placeholder="Correo electrónico..."
            type="email"
            class="search-field"
            @keyup.enter="buscar('donantes')"
          />
          <select v-model="filters.donantes.tipo" class="search-field">
            <option value="">-- Tipo de Donante --</option>
            <option value="Persona">Persona</option>
            <option value="Empresa">Empresa</option>
            <option value="Organización">Organización</option>
          </select>
          <button @click="buscar('donantes')" class="btn-buscar">🔎 Buscar Donantes</button>
        </div>
      </div>

      <!-- BENEFICIARIOS -->
      <div v-if="currentEntity === 'beneficiarios'" class="entity-search">
        <h2>Búsqueda de Beneficiarios</h2>
        <div class="search-fields">
          <input 
            v-model="filters.beneficiarios.nombre"
            placeholder="Nombre del beneficiario..."
            class="search-field"
            @keyup.enter="buscar('beneficiarios')"
          />
          <input 
            v-model="filters.beneficiarios.documento"
            placeholder="Número de documento..."
            class="search-field"
            @keyup.enter="buscar('beneficiarios')"
          />
          <select v-model="filters.beneficiarios.tipo_documento" class="search-field">
            <option value="">-- Tipo de Documento --</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PA">Pasaporte</option>
          </select>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" v-model="filters.beneficiarios.victima_conflicto" />
              Víctima de conflicto
            </label>
            <label>
              <input type="checkbox" v-model="filters.beneficiarios.discapacidad" />
              Con discapacidad
            </label>
          </div>
          <button @click="buscar('beneficiarios')" class="btn-buscar">🔎 Buscar Beneficiarios</button>
        </div>
      </div>

      <!-- MISIONES -->
      <div v-if="currentEntity === 'misiones'" class="entity-search">
        <h2>Búsqueda de Misiones/Proyectos</h2>
        <div class="search-fields">
          <input 
            v-model="filters.misiones.nombre"
            placeholder="Nombre de la misión..."
            class="search-field"
            @keyup.enter="buscar('misiones')"
          />
          <select v-model="filters.misiones.tipo" class="search-field">
            <option value="">-- Tipo de Misión --</option>
            <option value="Alimentaria">Alimentaria</option>
            <option value="Médica">Médica</option>
            <option value="Educativa">Educativa</option>
            <option value="Vivienda">Vivienda</option>
            <option value="Emergencia">Emergencia</option>
          </select>
          <select v-model="filters.misiones.estado" class="search-field">
            <option value="">-- Estado --</option>
            <option value="Planificada">Planificada</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <button @click="buscar('misiones')" class="btn-buscar">🔎 Buscar Misiones</button>
        </div>
      </div>

      <!-- DONACIONES -->
      <div v-if="currentEntity === 'donaciones'" class="entity-search">
        <h2>Búsqueda de Donaciones</h2>
        <div class="search-fields">
          <input 
            v-model="filters.donaciones.nombre_donante"
            placeholder="Nombre del donante..."
            class="search-field"
            @keyup.enter="buscar('donaciones')"
          />
          <select v-model="filters.donaciones.tipo" class="search-field">
            <option value="">-- Tipo de Donación --</option>
            <option value="Dinero">Dinero</option>
            <option value="Alimentos">Alimentos</option>
            <option value="Ropa">Ropa</option>
            <option value="Medicinas">Medicinas</option>
            <option value="Otros">Otros</option>
          </select>
          <input 
            v-model="filters.donaciones.desde"
            type="date"
            placeholder="Desde..."
            class="search-field"
          />
          <input 
            v-model="filters.donaciones.hasta"
            type="date"
            placeholder="Hasta..."
            class="search-field"
          />
          <button @click="buscar('donaciones')" class="btn-buscar">🔎 Buscar Donaciones</button>
        </div>
      </div>

      <!-- VEHÍCULOS -->
      <div v-if="currentEntity === 'vehiculos'" class="entity-search">
        <h2>Búsqueda de Vehículos</h2>
        <div class="search-fields">
          <input 
            v-model="filters.vehiculos.placa"
            placeholder="Placa del vehículo..."
            class="search-field"
            @keyup.enter="buscar('vehiculos')"
          />
          <select v-model="filters.vehiculos.tipo" class="search-field">
            <option value="">-- Tipo --</option>
            <option value="Moto">Moto</option>
            <option value="Carro">Carro</option>
            <option value="Camión">Camión</option>
            <option value="Furgón">Furgón</option>
          </select>
          <label class="checkbox-label">
            <input type="checkbox" v-model="filters.vehiculos.activo" />
            Solo activos
          </label>
          <button @click="buscar('vehiculos')" class="btn-buscar">🔎 Buscar Vehículos</button>
        </div>
      </div>

      <!-- CONDUCTORES -->
      <div v-if="currentEntity === 'conductores'" class="entity-search">
        <h2>Búsqueda de Conductores</h2>
        <div class="search-fields">
          <input 
            v-model="filters.conductores.nombre"
            placeholder="Nombre del conductor..."
            class="search-field"
            @keyup.enter="buscar('conductores')"
          />
          <input 
            v-model="filters.conductores.documento"
            placeholder="Número de documento..."
            class="search-field"
            @keyup.enter="buscar('conductores')"
          />
          <input 
            v-model="filters.conductores.telefono"
            placeholder="Teléfono..."
            class="search-field"
            @keyup.enter="buscar('conductores')"
          />
          <button @click="buscar('conductores')" class="btn-buscar">🔎 Buscar Conductores</button>
        </div>
      </div>

    </div>

    <!-- RESULTADOS -->
    <div v-if="resultados && resultados.length > 0" class="resultados-section">
      <div class="results-header">
        <h2>📋 Resultados ({{ resultados.length }} encontrados)</h2>
        <div class="export-buttons">
          <button @click="exportarCSV" class="btn-export">📥 CSV</button>
          <button @click="exportarJSON" class="btn-export">📥 JSON</button>
        </div>
      </div>

      <!-- Tarjetas por Entidad -->
      <div v-if="currentEntity === 'donantes'" class="results-cards">
        <div v-for="donante in resultados" :key="donante.id" class="card">
          <div class="card-header" @click="toggleCard(donante.id)">
            <h3>{{ donante.nombre_completo || 'N/A' }}</h3>
            <span class="badge" :class="donante.tipo">{{ donante.tipo }}</span>
            <span class="toggle-icon">{{ expandedCards[donante.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[donante.id]" class="card-body">
            <p><strong>📧 Correo:</strong> {{ donante.correo || 'No registrado' }}</p>
            <p><strong>📄 Documento:</strong> {{ donante.numero_documento || 'No registrado' }}</p>
            <p><strong>📍 Tipo:</strong> {{ donante.tipo }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentEntity === 'beneficiarios'" class="results-cards">
        <div v-for="beneficiario in resultados" :key="beneficiario.id" class="card">
          <div class="card-header" @click="toggleCard(beneficiario.id)">
            <h3>{{ beneficiario.primer_nombre }} {{ beneficiario.apellido }}</h3>
            <span class="badge" :class="{ vulnerable: beneficiario.es_victima_conflicto || beneficiario.tiene_discapacidad }">
              {{ beneficiario.es_victima_conflicto ? '⚠️ Víctima' : '✓ Registrado' }}
            </span>
            <span class="toggle-icon">{{ expandedCards[beneficiario.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[beneficiario.id]" class="card-body">
            <p><strong>📄 {{ beneficiario.tipo_documento }}:</strong> {{ beneficiario.numero_documento }}</p>
            <p><strong>🎂 Edad:</strong> {{ beneficiario.edad_calculada || 'N/A' }} años</p>
            <p><strong>⚧ Género:</strong> {{ beneficiario.genero || 'No especificado' }}</p>
            <p><strong>📞 Teléfono:</strong> {{ beneficiario.telefono_principal || 'No registrado' }}</p>
            <p><strong>📧 Correo:</strong> {{ beneficiario.correo || 'No registrado' }}</p>
            <p v-if="beneficiario.tiene_discapacidad"><strong>♿ Discapacidad:</strong> Sí</p>
            <p v-if="beneficiario.grupo_etnico"><strong>🌍 Grupo étnico:</strong> {{ beneficiario.grupo_etnico }}</p>
            <p><strong>📅 Registro:</strong> {{ formatearFecha(beneficiario.fecha_registro) }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentEntity === 'misiones'" class="results-cards">
        <div v-for="mision in resultados" :key="mision.id" class="card">
          <div class="card-header" @click="toggleCard(mision.id)">
            <h3>{{ mision.nombre_mision }}</h3>
            <span class="badge" :class="mision.estado">{{ mision.estado || 'Sin estado' }}</span>
            <span class="toggle-icon">{{ expandedCards[mision.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[mision.id]" class="card-body">
            <p><strong>🎯 Tipo:</strong> {{ mision.tipo_mision }}</p>
            <p><strong>📍 Municipio:</strong> {{ mision.cod_municipio_objetivo || 'No especificado' }}</p>
            <p><strong>📅 Inicio:</strong> {{ formatearFecha(mision.fecha_inicio) }}</p>
            <p><strong>🏁 Fin:</strong> {{ formatearFecha(mision.fecha_fin) }}</p>
            <p><strong>📊 Estado:</strong> {{ mision.estado }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentEntity === 'donaciones'" class="results-cards">
        <div v-for="donacion in resultados" :key="donacion.id" class="card">
          <div class="card-header" @click="toggleCard(donacion.id)">
            <h3>{{ donacion.tipo }} - ${{ donacion.valor_estimado || '0' }}</h3>
            <span class="badge">{{ formatearFecha(donacion.fecha_donacion) }}</span>
            <span class="toggle-icon">{{ expandedCards[donacion.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[donacion.id]" class="card-body">
            <p><strong>👤 Donante:</strong> {{ donacion.donante_nombre || 'N/A' }}</p>
            <p><strong>💰 Valor estimado:</strong> ${{ donacion.valor_estimado || '0' }}</p>
            <p><strong>🚚 Método recepción:</strong> {{ donacion.metodo_recepcion || 'No especificado' }}</p>
            <p><strong>📅 Fecha:</strong> {{ formatearFecha(donacion.fecha_donacion) }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentEntity === 'vehiculos'" class="results-cards">
        <div v-for="vehiculo in resultados" :key="vehiculo.id" class="card">
          <div class="card-header" @click="toggleCard(vehiculo.id)">
            <h3>{{ vehiculo.placa }}</h3>
            <span class="badge" :class="{ activo: vehiculo.esta_activo }">{{ vehiculo.esta_activo ? '✓ Activo' : '✗ Inactivo' }}</span>
            <span class="toggle-icon">{{ expandedCards[vehiculo.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[vehiculo.id]" class="card-body">
            <p><strong>🚗 Tipo:</strong> {{ vehiculo.tipo }}</p>
            <p><strong>📋 SOAT:</strong> Vence {{ formatearFecha(vehiculo.vencimiento_soat) }}</p>
            <p><strong>🔧 Tecnomecánica:</strong> Vence {{ formatearFecha(vehiculo.vencimiento_tecnomecanica) }}</p>
            <p><strong>⚙️ Estado:</strong> {{ vehiculo.esta_activo ? 'Activo' : 'Inactivo' }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentEntity === 'conductores'" class="results-cards">
        <div v-for="conductor in resultados" :key="conductor.id" class="card">
          <div class="card-header" @click="toggleCard(conductor.id)">
            <h3>{{ conductor.nombre_completo }}</h3>
            <span class="badge">{{ conductor.numero_documento }}</span>
            <span class="toggle-icon">{{ expandedCards[conductor.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedCards[conductor.id]" class="card-body">
            <p><strong>📄 Documento:</strong> {{ conductor.numero_documento }}</p>
            <p><strong>🎖️ Licencia:</strong> {{ conductor.numero_licencia }}</p>
            <p><strong>📅 Vencimiento licencia:</strong> {{ formatearFecha(conductor.vencimiento_licencia) }}</p>
            <p><strong>📞 Teléfono:</strong> {{ conductor.telefono || 'No registrado' }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Sin resultados -->
    <div v-if="cargado && resultados && resultados.length === 0" class="no-results">
      <p>ℹ️ No se encontraron registros con los criterios especificados</p>
    </div>

    <!-- ERRORES -->
    <div v-if="error" class="error-section">
      <h3>⚠️ Error</h3>
      <p>{{ error }}</p>
      <button @click="error = ''" class="btn-close-error">✕ Cerrar</button>
    </div>

    <!-- LOADING -->
    <div v-if="cargando" class="loading-overlay">
      <div class="spinner"></div>
      <p>⏳ Buscando registros...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// Estado
const currentEntity = ref('donantes')
const usuarioActual = ref(null)
const resultados = ref(null)
const error = ref('')
const cargando = ref(false)
const cargado = ref(false)
const expandedCards = reactive({})

// Entidades disponibles
const entidades = [
  { id: 'donantes', label: 'Donantes', icon: '👤' },
  { id: 'beneficiarios', label: 'Beneficiarios', icon: '🤝' },
  { id: 'misiones', label: 'Misiones', icon: '🎯' },
  { id: 'donaciones', label: 'Donaciones', icon: '💝' },
  { id: 'vehiculos', label: 'Vehículos', icon: '🚗' },
  { id: 'conductores', label: 'Conductores', icon: '👨‍🚗' }
]

// Filtros por entidad
const filters = reactive({
  donantes: { nombre: '', correo: '', tipo: '' },
  beneficiarios: { nombre: '', documento: '', tipo_documento: '', victima_conflicto: false, discapacidad: false },
  misiones: { nombre: '', tipo: '', estado: '' },
  donaciones: { nombre_donante: '', tipo: '', desde: '', hasta: '' },
  vehiculos: { placa: '', tipo: '', activo: true },
  conductores: { nombre: '', documento: '', telefono: '' }
})

// Métodos
function cargarUsuario() {
  const usuarioJSON = localStorage.getItem('usuario')
  if (usuarioJSON) {
    usuarioActual.value = JSON.parse(usuarioJSON)
  }
}

function selectEntity(entity) {
  currentEntity.value = entity
  resultados.value = null
  expandedCards = {}
}

async function buscar(entity) {
  cargando.value = true
  cargado.value = false
  error.value = ''
  resultados.value = null

  const tablaMap = {
    donantes: 'donante',
    beneficiarios: 'beneficiario',
    misiones: 'mision_proyecto',
    donaciones: 'donacion',
    vehiculos: 'vehiculo',
    conductores: 'conductor'
  }

  const tabla = tablaMap[entity]
  const filtrosActuales = filters[entity]

  // Construir parámetros de búsqueda
  const searchParams = {
    primaryTable: tabla,
    filters: construirFiltros(entity, filtrosActuales)
  }

  try {
    const token = localStorage.getItem('authToken')
    const response = await axios.post('/api/search/execute', searchParams, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 100 }
    })

    resultados.value = response.data.data || []
    cargado.value = true
  } catch (err) {
    error.value = err.response?.data?.error || err.message
    cargado.value = true
  } finally {
    cargando.value = false
  }
}

function construirFiltros(entity, filtros) {
  const filterList = []

  switch (entity) {
    case 'donantes':
      if (filtros.nombre) filterList.push({ field: 'nombre_completo', operator: 'ILIKE', value: `%${filtros.nombre}%` })
      if (filtros.correo) filterList.push({ field: 'correo', operator: 'ILIKE', value: `%${filtros.correo}%` })
      if (filtros.tipo) filterList.push({ field: 'tipo', operator: '=', value: filtros.tipo })
      break
    case 'beneficiarios':
      if (filtros.nombre) filterList.push({ field: 'primer_nombre', operator: 'ILIKE', value: `%${filtros.nombre}%` })
      if (filtros.documento) filterList.push({ field: 'numero_documento', operator: '=', value: filtros.documento })
      if (filtros.tipo_documento) filterList.push({ field: 'tipo_documento', operator: '=', value: filtros.tipo_documento })
      if (filtros.victima_conflicto) filterList.push({ field: 'es_victima_conflicto', operator: '=', value: true })
      if (filtros.discapacidad) filterList.push({ field: 'tiene_discapacidad', operator: '=', value: true })
      break
    case 'misiones':
      if (filtros.nombre) filterList.push({ field: 'nombre_mision', operator: 'ILIKE', value: `%${filtros.nombre}%` })
      if (filtros.tipo) filterList.push({ field: 'tipo_mision', operator: '=', value: filtros.tipo })
      if (filtros.estado) filterList.push({ field: 'estado', operator: '=', value: filtros.estado })
      break
    case 'donaciones':
      if (filtros.tipo) filterList.push({ field: 'tipo', operator: '=', value: filtros.tipo })
      if (filtros.desde) filterList.push({ field: 'fecha_donacion', operator: '>=', value: filtros.desde })
      if (filtros.hasta) filterList.push({ field: 'fecha_donacion', operator: '<=', value: filtros.hasta })
      break
    case 'vehiculos':
      if (filtros.placa) filterList.push({ field: 'placa', operator: 'ILIKE', value: `%${filtros.placa}%` })
      if (filtros.tipo) filterList.push({ field: 'tipo', operator: '=', value: filtros.tipo })
      if (filtros.activo) filterList.push({ field: 'esta_activo', operator: '=', value: true })
      break
    case 'conductores':
      if (filtros.nombre) filterList.push({ field: 'nombre_completo', operator: 'ILIKE', value: `%${filtros.nombre}%` })
      if (filtros.documento) filterList.push({ field: 'numero_documento', operator: '=', value: filtros.documento })
      if (filtros.telefono) filterList.push({ field: 'telefono', operator: 'ILIKE', value: `%${filtros.telefono}%` })
      break
  }

  return filterList
}

function toggleCard(id) {
  expandedCards[id] = !expandedCards[id]
}

function formatearFecha(fecha) {
  if (!fecha) return 'N/A'
  try {
    return new Date(fecha).toLocaleDateString('es-ES')
  } catch {
    return fecha
  }
}

async function exportarCSV() {
  if (!resultados.value) return
  
  const headers = Object.keys(resultados.value[0] || {})
  const csv = [
    headers.join(','),
    ...resultados.value.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  descargarArchivo(blob, `export_${currentEntity.value}_${Date.now()}.csv`)
}

async function exportarJSON() {
  if (!resultados.value) return
  
  const json = JSON.stringify(resultados.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  descargarArchivo(blob, `export_${currentEntity.value}_${Date.now()}.json`)
}

function descargarArchivo(blob, nombre) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nombre)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

function cerrarSesion() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('usuario')
  router.push('/')
}

// Lifecycle
cargarUsuario()
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.smart-search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.search-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

.user-info {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.btn-logout {
  padding: 0.7rem 1.3rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.entity-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.8rem;
  margin-bottom: 2rem;
}

.entity-btn {
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.entity-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
}

.entity-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: white;
}

.search-panel {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #333;
}

.entity-search h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-field {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
}

.search-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  grid-column: 1 / -1;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  grid-column: 1 / -1;
}

.checkbox-label input,
.checkbox-group input {
  cursor: pointer;
}

.btn-buscar {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.95rem;
  transition: all 0.3s;
  grid-column: 1 / -1;
}

.btn-buscar:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.resultados-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  color: #333;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ddd;
}

.results-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.export-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-export {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
}

.btn-export:hover {
  background: #0b7dda;
}

.results-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  user-select: none;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  flex: 1;
}

.badge {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  margin: 0 0.5rem;
  white-space: nowrap;
}

.badge.Persona,
.badge.Empresa,
.badge.Organización {
  background: rgba(76, 175, 80, 0.3);
}

.badge.vulnerable {
  background: rgba(255, 152, 0, 0.3);
  color: #ff6f00;
}

.badge.activo {
  background: rgba(76, 175, 80, 0.3);
}

.badge.Planificada {
  background: rgba(33, 150, 243, 0.3);
}

.badge.En\ ejecución {
  background: rgba(255, 152, 0, 0.3);
}

.badge.Completada {
  background: rgba(76, 175, 80, 0.3);
}

.badge.Cancelada {
  background: rgba(244, 67, 54, 0.3);
}

.toggle-icon {
  font-size: 0.8rem;
  font-weight: bold;
}

.card-body {
  padding: 1rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.card-body p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.card-body strong {
  color: #667eea;
}

.no-results {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.error-section {
  background: #ff6b6b;
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.error-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.error-section p {
  margin: 0 0 1rem 0;
}

.btn-close-error {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-close-error:hover {
  background: rgba(255, 255, 255, 0.3);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  margin-top: 1rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    gap: 1rem;
  }

  .search-header h1 {
    font-size: 1.5rem;
  }

  .entity-selector {
    grid-template-columns: repeat(2, 1fr);
  }

  .search-fields {
    grid-template-columns: 1fr;
  }

  .results-cards {
    grid-template-columns: 1fr;
  }
}
</style>
