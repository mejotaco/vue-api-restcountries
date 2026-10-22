<template>
  <div class="app">

    <!-- ═══════════════════ ENCABEZADO ═══════════════════ -->
    <header class="hero">
      <div class="hero-inner">
        <p class="hero-eyebrow">REST Countries API · Vue 3</p>
        <h1 class="hero-title">Explorador<br /><em>de Países</em></h1>
        <p v-if="!cargando && !error" class="hero-contador">
          {{ paisesFiltrados.length }} de {{ paises.length }} países
        </p>
      </div>
    </header>

    <!-- Aviso de clave demo — v-if -->
    <p v-if="demo && !cargando && !error" class="demo-aviso" role="note">
      La API respondió con la clave demo (<code>rc_live_demo</code>): solo incluye un país de ejemplo.
    </p>

    <!-- ═══════════════════ CONTROLES ═══════════════════ -->
    <section class="controles">
      <div class="controles-inner">

        <!-- Campo de búsqueda — v-model -->
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>
            <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Busca un país por nombre…"
            class="search-input"
            aria-label="Buscar país"
          />
          <!-- Botón limpiar búsqueda — v-if -->
          <button
            v-if="busqueda.length > 0"
            @click="busqueda = ''"
            class="search-clear"
            aria-label="Limpiar búsqueda"
          >✕</button>
        </div>

        <!-- Filtro por región — v-model -->
        <select v-model="regionFiltro" class="region-select" aria-label="Filtrar por región">
          <option value="">Todas las regiones</option>
          <option v-for="region in regiones" :key="region" :value="region">
            {{ region }}
          </option>
        </select>

      </div>
    </section>

    <!-- ═══════════════════ ESTADOS ═══════════════════ -->
    <main class="main">

      <!-- Estado: cargando — v-if -->
      <div v-if="cargando" class="estado estado-carga" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>Cargando países…</p>
      </div>

      <!-- Estado: error — v-else-if -->
      <div v-else-if="error" class="estado estado-error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 7v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <p>No fue posible obtener los datos de la API</p>
        <small>{{ error }}</small>
        <button class="btn-reintentar" @click="cargarPaises">Reintentar</button>
      </div>

      <!-- Estado: sin resultados — v-else-if -->
      <div v-else-if="paisesFiltrados.length === 0" class="estado estado-vacio">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M16.5 16.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8.5 13.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>Sin resultados para <strong>"{{ busqueda }}"</strong></p>
        <button class="btn-reintentar" @click="busqueda = ''">Ver todos</button>
      </div>

      <!-- ═══════ LISTA DE PAÍSES — v-else + v-for ═══════ -->
      <div v-else class="grid">
        <CountryCard
          v-for="pais in paisesFiltrados"
          :key="pais.codigo || pais.nombre"
          :pais="pais"
        />
      </div>

    </main>

    <!-- ═══════════════════ PIE DE PÁGINA ═══════════════════ -->
    <footer class="footer">
      <p>
        Datos de
        <a href="https://restcountries.com" target="_blank" rel="noopener">REST Countries</a>
        · Vue 3 + Vite
      </p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CountryCard from './components/CountryCard.vue'

// ── Variables reactivas ───────────────────────────────────────────
const paises     = ref([])    // países normalizados de la API
const busqueda   = ref('')    // texto del campo de búsqueda (v-model)
const regionFiltro = ref('')  // región seleccionada (v-model)
const cargando   = ref(false) // indicador de carga
const error      = ref(null)  // mensaje de error
const demo       = ref(false) // la API respondió con la clave demo

// ── Clave y URL de la API v5 ──────────────────────────────────────
// ⚠ La clave demo (rc_live_demo) rechaza peticiones desde navegador con
//   403 / originNotAllowed. Necesitas tu propia clave gratuita:
//   1) Regístrate en https://restcountries.com/sign-up
//   2) En https://restcountries.com/api-keys añade a tu clave los orígenes:
//        http://localhost:5173  y  https://TU-USUARIO.github.io
//   3) Pega tu clave aquí:
const API_KEY = 'rc_live_fdb72b52704942cab3ca06993d232b95'

const API_URL = 'https://api.restcountries.com/countries/v5'

// ── Normaliza un objeto de la v5 a la forma que usa la app ───────
function normalizarPais(o) {
  return {
    nombre:    o.names?.common ?? '—',
    oficial:   o.names?.official ?? '—',
    capital:   o.capitals?.[0]?.name ?? '—',
    region:    o.region ?? '—',
    subregion: o.subregion ?? '—',
    poblacion: o.population ?? 0,
    bandera:   o.flag?.url_svg || o.flag?.url_png || '',
    emoji:     o.flag?.emoji ?? '',
    codigo:    o.codes?.alpha_3 ?? '',
  }
}

// ── Computed: lista de regiones únicas para el <select> ───────────
const regiones = computed(() => {
  const set = new Set(paises.value.map(p => p.region).filter(Boolean))
  return [...set].sort()
})

// ── Computed: países filtrados por nombre y región ────────────────
const paisesFiltrados = computed(() => {
  const texto  = busqueda.value.toLowerCase().trim()
  const region = regionFiltro.value

  return paises.value.filter(pais => {
    const coincideNombre = pais.nombre.toLowerCase().includes(texto)
    const coincideRegion = region === '' || pais.region === region
    return coincideNombre && coincideRegion
  })
})

// ── Función para consumir la API con fetch() ──────────────────────
async function pedirPagina(params) {
  const url = `${API_URL}?api-key=${API_KEY}&pretty=1&${params}`
  const respuesta = await fetch(url)

  if (!respuesta.ok) {
    let mensaje = `Error del servidor: ${respuesta.status} ${respuesta.statusText}`
    try {
      const cuerpo = await respuesta.json()
      if (cuerpo?.errors?.length) {
        mensaje = `${cuerpo.errors[0].message} (código: ${cuerpo.errors[0].code})`
      }
    } catch { /* respuesta sin cuerpo JSON */ }
    throw new Error(mensaje)
  }

  return respuesta.json()
}

async function cargarPaises() {
  cargando.value = true
  error.value    = null

  try {
    const POR_PAGINA = 100           // máximo del plan gratuito
    let datos = await pedirPagina(`limit=${POR_PAGINA}&offset=0`)
    demo.value = Boolean(datos?.data?._demo)

    let lista  = datos?.data?.objects ?? []
    let offset = POR_PAGINA

    // La lista completa llega paginada (meta.more=true): pedimos el resto
    while (offset < 500 && !demo.value) {
      datos = await pedirPagina(`limit=${POR_PAGINA}&offset=${offset}`)
      const pagina = datos?.data?.objects ?? []
      if (pagina.length === 0) break
      lista = lista.concat(pagina)
      offset += POR_PAGINA
      if (datos?.data?.meta?.more !== true) break
    }

    paises.value = lista
      .map(normalizarPais)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

// ── onMounted: primera llamada a la API ───────────────────────────
onMounted(() => {
  cargarPaises()
})
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; min-height: 100vh; }

.app { max-width: 1200px; margin: 0 auto; padding: 1rem; }

.hero { padding: 1.5rem 0; text-align: center; }
.hero h1 { font-size: 2rem; margin-bottom: 0.5rem; }

.controles { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.search-wrap { flex: 1; min-width: 200px; position: relative; }
.search-input { width: 100%; padding: 0.5rem 2rem 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; }
.search-clear { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; }
.region-select { padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; }

.main { min-height: 300px; }
.demo-aviso { max-width: 720px; margin: 0 auto 1rem; padding: 0.6rem 1rem; background: #fff8e6; border: 1px solid #f0dfa8; border-radius: 8px; font-size: 0.85rem; color: #7a6220; text-align: center; }
.estado { text-align: center; padding: 2rem; color: #666; }
.spinner { width: 32px; height: 32px; border: 3px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-reintentar { padding: 0.5rem 1rem; background: #eee; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

.card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff; }
.card-flag { aspect-ratio: 16/9; overflow: hidden; }
.card-flag img { width: 100%; height: 100%; object-fit: cover; }
.card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.card-nombre { font-weight: 600; font-size: 1rem; }
.card-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 0.5rem; font-size: 0.85rem; }
.dato dt { color: #666; font-size: 0.75rem; }
.dato dd { font-weight: 500; }

.footer { text-align: center; padding: 1rem 0; color: #666; font-size: 0.85rem; }
.footer a { color: #0066cc; }
</style>
