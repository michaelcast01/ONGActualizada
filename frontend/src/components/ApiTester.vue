<template>
  <div class="apitester-page">
    <!-- Header -->
    <Header />

    <!-- Contenido Principal -->
    <div class="apitester-container">
      <!-- Toast Container -->
      <div v-for="toast in toasts" :key="toast.id" class="toast-wrapper">
        <Toast :message="toast.message" :type="toast.type" />
      </div>

      <!-- Bienvenida -->
      <Card class="welcome-card" variant="primary" :hoverable="true">
        <div class="welcome-content">
          <div>
            <h2>🎯 Bienvenido al Gestor de Consultas</h2>
            <p>Gestiona donantes, beneficiarios, misiones y más de forma sencilla</p>
          </div>
          <Badge variant="info">Conectado</Badge>
        </div>
      </Card>

      <!-- Controles Principales -->
      <Card class="controls-card" title="🔧 Selecciona Operación">
        <div class="controls-grid">
          <div class="form-group">
            <label for="accion">Acción</label>
            <select id="accion" v-model="accion" @change="resetForm" class="form-select">
              <option value="">-- Seleccionar --</option>
              <option value="visualizar">👁️ Visualizar</option>
              <option value="agregar">➕ Agregar</option>
              <option value="modificar">✏️ Modificar</option>
              <option value="eliminar">🗑️ Eliminar</option>
            </select>
          </div>

          <div class="form-group">
            <label for="tabla">Tabla</label>
            <select id="tabla" v-model="tabla" @change="resetForm" class="form-select">
              <option value="">-- Seleccionar --</option>
              <option value="donante">Donante</option>
              <option value="donacion">Donación</option>
              <option value="beneficiario">Beneficiario</option>
              <option value="usuario">Usuario</option>
              <option value="vehiculo">Vehículo</option>
              <option value="conductor">Conductor</option>
              <option value="mision">Misión/Proyecto</option>
            </select>
          </div>

          <div v-if="accion === 'visualizar'" class="form-group">
            <label for="modo">Modo Consulta</label>
            <select id="modo" v-model="modoConsulta" class="form-select">
              <option value="todos">Todos</option>
              <option value="id">Por ID</option>
            </select>
          </div>

          <div v-if="(accion === 'visualizar' && modoConsulta === 'id') || accion === 'modificar' || accion === 'eliminar'" class="form-group">
            <label for="id">ID</label>
            <input id="id" v-model="idBusqueda" type="text" placeholder="Ingresa el ID" class="form-input" />
          </div>
        </div>
      </Card>

      <!-- Formulario de Datos -->
      <Card v-if="accion === 'agregar' || accion === 'modificar'" class="form-card" :title="`${accion === 'agregar' ? '➕ Nuevo Registro' : '✏️ Editar Registro'}`">
        <div class="campos-grid">
          <div v-for="campo in camposVisibles" :key="campo.nombre" class="form-group">
            <label :for="campo.nombre">{{ campo.label }}</label>
            <input
              v-if="campo.tipo === 'text' || campo.tipo === 'number' || campo.tipo === 'date'"
              :id="campo.nombre"
              v-model="formData[campo.nombre]"
              :type="campo.tipo"
              :placeholder="campo.label"
              class="form-input"
            />
            <select v-else-if="campo.tipo === 'enum'" :id="campo.nombre" v-model="formData[campo.nombre]" class="form-select">
              <option value="">-- Seleccionar --</option>
              <option v-for="opt in campo.opciones" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input v-else-if="campo.tipo === 'boolean'" :id="campo.nombre" v-model="formData[campo.nombre]" type="checkbox" class="form-checkbox" />
          </div>
        </div>
      </Card>

      <!-- Botones de Acción -->
      <div class="buttons-group">
        <Button v-if="accion" label="📤 Enviar" variant="primary" size="lg" :loading="loading" @click="realizarAccion" />
        <Button label="🗑️ Limpiar" variant="ghost" size="lg" @click="resetForm" />
        <Button 
          :label="`${mostrarRespuesta ? '👁️ Ocultar' : '👁️ Mostrar'} Respuesta`" 
          variant="secondary" 
          size="lg" 
          :disabled="!respuesta"
          @click="toggleRespuesta" 
          :title="!respuesta ? 'Primero ejecuta una consulta con Enviar' : 'Mostrar/Ocultar resultados'"
        />
      </div>

      <!-- Mensaje de Ayuda -->
      <div v-if="accion && !respuesta && !loading" class="help-message">
        <p>💡 Selecciona la acción, tabla y haz clic en <strong>Enviar</strong> para ver los resultados</p>
      </div>

      <!-- Respuesta -->
      <Card v-if="mostrarRespuesta && respuesta" class="response-card" variant="success" title="✅ Respuesta del Servidor">
        <!-- Tabla de Resultados -->
        <div v-if="Array.isArray(respuesta) && respuesta.length > 0" class="tabla-wrapper">
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th v-for="key in Object.keys(respuesta[0])" :key="key">{{ key }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in respuestaPaginada" :key="idx">
                  <td v-for="key in Object.keys(respuesta[0])" :key="key">
                    <Badge variant="info" size="sm">{{ formatoSalida(item[key]) }}</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div v-if="totalPaginas > 1" class="pagination">
            <Button label="← Anterior" variant="ghost" :disabled="paginaActual === 1" @click="paginaActual--" />
            <span class="pagination-info">Página {{ paginaActual }} de {{ totalPaginas }} ({{ respuesta.length }} resultados)</span>
            <Button label="Siguiente →" variant="ghost" :disabled="paginaActual === totalPaginas" @click="paginaActual++" />
          </div>
        </div>

        <!-- Sin Registros -->
        <div v-else-if="Array.isArray(respuesta)" class="empty-state">
          <p>📭 No se encontraron registros</p>
        </div>

        <!-- Objeto Única -->
        <div v-else-if="typeof respuesta === 'object' && respuesta !== null" class="object-view">
          <div v-for="(valor, key) in respuesta" :key="key" class="object-item">
            <span class="object-key">{{ key }}:</span>
            <Badge variant="primary" size="md">{{ formatoSalida(valor) }}</Badge>
          </div>
        </div>

        <!-- Texto Plano -->
        <div v-else class="text-view">
          <p>{{ respuesta }}</p>
        </div>
      </Card>

      <!-- Error -->
      <Card v-if="error" class="error-card" variant="error" title="❌ Error">
        <p class="error-message">{{ error }}</p>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Header from './Header.vue'
import Card from './Card.vue'
import Button from './Button.vue'
import Badge from './Badge.vue'
import Toast from './Toast.vue'
import { useToast } from '../composables/useToast'

const { toasts, success, error: showError } = useToast()

const accion = ref('')
const tabla = ref('')
const modoConsulta = ref('todos')
const idBusqueda = ref('')
const respuesta = ref(null)
const error = ref('')
const formData = ref({})
const mostrarRespuesta = ref(false)
const paginaActual = ref(1)
const loading = ref(false)
const itemsPorPagina = 10

const camposPorTabla = {
  donante: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'tipo', label: 'Tipo', tipo: 'enum', opciones: ['persona', 'empresa', 'institucion'], mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'nombre_completo', label: 'Nombre Completo', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'numero_documento', label: 'Número Documento', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'correo', label: 'Correo', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  donacion: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'donante_id', label: 'ID Donante', tipo: 'number', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'fecha_donacion', label: 'Fecha Donación', tipo: 'date', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'tipo', label: 'Tipo', tipo: 'enum', opciones: ['efectivo', 'especie', 'servicio'], mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'valor_estimado', label: 'Valor Estimado', tipo: 'number', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'metodo_recepcion', label: 'Método Recepción', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  beneficiario: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'tipo_documento', label: 'Tipo Documento', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'numero_documento', label: 'Número Documento', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'primer_nombre', label: 'Primer Nombre', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'segundo_nombre', label: 'Segundo Nombre', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'primer_apellido', label: 'Primer Apellido', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'segundo_apellido', label: 'Segundo Apellido', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'genero', label: 'Género', tipo: 'enum', opciones: ['M', 'F', 'O'], mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'fecha_nacimiento', label: 'Fecha Nacimiento', tipo: 'date', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'telefono', label: 'Teléfono', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'correo', label: 'Correo', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  usuario: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'nombre_usuario', label: 'Nombre Usuario', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'correo_electronico', label: 'Correo', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'estado', label: 'Estado', tipo: 'enum', opciones: ['activo', 'inactivo'], mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  vehiculo: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'placa', label: 'Placa', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'modelo', label: 'Modelo', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'capacidad', label: 'Capacidad', tipo: 'number', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'estado', label: 'Estado', tipo: 'enum', opciones: ['disponible', 'en_uso', 'mantenimiento'], mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  conductor: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'nombre', label: 'Nombre', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'numero_licencia', label: 'Número Licencia', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'estado', label: 'Estado', tipo: 'enum', opciones: ['activo', 'inactivo'], mostrarEnAgregar: true, mostrarEnModificar: true }
  ],
  mision: [
    { nombre: 'id', label: 'ID', tipo: 'number', mostrarEnAgregar: false, mostrarEnModificar: true },
    { nombre: 'nombre', label: 'Nombre', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'descripcion', label: 'Descripción', tipo: 'text', mostrarEnAgregar: true, mostrarEnModificar: true },
    { nombre: 'estado', label: 'Estado', tipo: 'enum', opciones: ['plazo', 'en_progreso', 'finalizado'], mostrarEnAgregar: true, mostrarEnModificar: true }
  ]
}

const camposVisibles = computed(() => {
  if (!tabla.value || !camposPorTabla[tabla.value]) return []
  return camposPorTabla[tabla.value].filter(c => {
    if (accion.value === 'agregar') return c.mostrarEnAgregar
    if (accion.value === 'modificar') return c.mostrarEnModificar
    return true
  })
})

const respuestaPaginada = computed(() => {
  if (Array.isArray(respuesta.value)) {
    const inicio = (paginaActual.value - 1) * itemsPorPagina
    return respuesta.value.slice(inicio, inicio + itemsPorPagina)
  }
  return []
})

const totalPaginas = computed(() => {
  return Array.isArray(respuesta.value) ? Math.ceil(respuesta.value.length / itemsPorPagina) : 1
})

const obtenerToken = () => localStorage.getItem('authToken')

const realizarAccion = async () => {
  error.value = ''
  respuesta.value = null
  
  if (!accion.value || !tabla.value) {
    showError('Debes seleccionar acción y tabla')
    return
  }

  loading.value = true

  try {
    const token = obtenerToken()
    if (!token) {
      showError('No estás autenticado')
      return
    }

    let url = `http://localhost:3000/api/${tabla.value}`
    const opciones = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    if (accion.value === 'visualizar') {
      opciones.method = 'GET'
      if (modoConsulta.value === 'id') {
        if (!idBusqueda.value) {
          showError('Debes ingresar un ID')
          return
        }
        url += `/${idBusqueda.value}`
      }
    } else if (accion.value === 'agregar') {
      opciones.method = 'POST'
      opciones.body = JSON.stringify(formData.value)
    } else if (accion.value === 'modificar') {
      if (!idBusqueda.value) {
        showError('Debes ingresar el ID')
        return
      }
      url += `/${idBusqueda.value}`
      opciones.method = 'PUT'
      opciones.body = JSON.stringify(formData.value)
    } else if (accion.value === 'eliminar') {
      if (!idBusqueda.value) {
        showError('Debes ingresar el ID')
        return
      }
      url += `/${idBusqueda.value}`
      opciones.method = 'DELETE'
    }

    const res = await fetch(url, opciones)
    const datos = await res.json()

    if (!res.ok) {
      showError(datos.error || `Error ${res.status}`)
      return
    }

    respuesta.value = datos
    paginaActual.value = 1
    mostrarRespuesta.value = true

    if (accion.value === 'agregar') success('Registro agregado exitosamente')
    if (accion.value === 'modificar') success('Registro modificado exitosamente')
    if (accion.value === 'eliminar') success('Registro eliminado exitosamente')
    if (accion.value === 'visualizar') success('Datos cargados correctamente')
  } catch (err) {
    showError(`Error: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {}
  idBusqueda.value = ''
  respuesta.value = null
  error.value = ''
  paginaActual.value = 1
}

const toggleRespuesta = () => {
  mostrarRespuesta.value = !mostrarRespuesta.value
}

const formatoSalida = (valor) => {
  if (valor === null || valor === undefined) return '(vacío)'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}
</script>

<style scoped>
.apitester-page {
  background-color: var(--color-gray-50);
  min-height: 100vh;
}

.apitester-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.welcome-card {
  margin-bottom: var(--spacing-lg);
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xl);
}

.welcome-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
}

.welcome-content p {
  margin: 0;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.campos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-select {
  padding: var(--spacing-md);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--border-radius-lg);
  background-color: var(--color-white);
  color: var(--color-gray-900);
  font-size: var(--font-size-md);
  font-family: var(--font-family);
  transition: all var(--transition-base);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 52, 120, 0.1);
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.buttons-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.response-card {
  margin-top: var(--spacing-xl);
}

.tabla-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.table-container {
  overflow-x: auto;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-200);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-white);
}

.results-table thead {
  background-color: var(--color-primary);
  color: white;
}

.results-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

.results-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-200);
}

.results-table tbody tr:hover {
  background-color: var(--color-gray-50);
}

.results-table tbody tr:last-child td {
  border-bottom: none;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  font-weight: var(--font-weight-semibold);
}

.empty-state,
.object-view {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-gray-600);
}

.object-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-200);
  gap: var(--spacing-md);
}

.object-item:last-child {
  border-bottom: none;
}

.object-key {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.text-view {
  padding: var(--spacing-lg);
  background-color: var(--color-gray-100);
  border-radius: var(--border-radius-lg);
  font-family: monospace;
}

.error-card {
  margin-top: var(--spacing-xl);
}

.error-message {
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.toast-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.help-message {
  padding: var(--spacing-lg);
  background-color: var(--color-info);
  color: var(--color-white);
  border-radius: var(--border-radius-lg);
  text-align: center;
  margin-top: -var(--spacing-lg);
  animation: slideDown 0.3s ease;
}

.help-message p {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

/* Responsive */
@media (max-width: 768px) {
  .apitester-container {
    padding: var(--spacing-lg);
    gap: var(--spacing-lg);
  }

  .controls-grid {
    grid-template-columns: 1fr;
  }

  .campos-grid {
    grid-template-columns: 1fr;
  }

  .buttons-group {
    flex-direction: column;
  }

  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .apitester-container {
    padding: var(--spacing-md);
  }

  .table-container {
    font-size: var(--font-size-sm);
  }

  .results-table th,
  .results-table td {
    padding: var(--spacing-sm);
  }

  .buttons-group {
    gap: var(--spacing-sm);
  }
}
</style>
