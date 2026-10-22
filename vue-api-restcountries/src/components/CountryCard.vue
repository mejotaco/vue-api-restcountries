<template>
  <article class="card">
    <!-- Bandera del país -->
    <div class="card-flag">
      <img
        :src="pais.bandera"
        :alt="`Bandera de ${pais.nombre}`"
        loading="lazy"
      />
    </div>

    <!-- Información del país -->
    <div class="card-body">
      <h2 class="card-nombre">{{ pais.emoji }} {{ pais.nombre }}</h2>

      <dl class="card-datos">
        <div class="dato">
          <dt>Capital</dt>
          <dd>{{ pais.capital }}</dd>
        </div>
        <div class="dato">
          <dt>Región</dt>
          <dd>{{ pais.region }}</dd>
        </div>
        <div class="dato">
          <dt>Subregión</dt>
          <dd>{{ pais.subregion }}</dd>
        </div>
        <div class="dato dato--full">
          <dt>Población</dt>
          <dd>{{ formatPoblacion(pais.poblacion) }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>

<script setup>
// Props que recibe el componente
const props = defineProps({
  pais: {
    type: Object,
    required: true
  }
})

// Formatea la población con separadores de miles
function formatPoblacion(numero) {
  return Number(numero).toLocaleString('es-MX')
}
</script>
