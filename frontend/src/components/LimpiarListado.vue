<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';

const resultadosBusqueda = ref([]);
const lineasInvalidas = ref([]);
const mostrarLineasInvalidas = ref(false);

function cargarArchivo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      procesarContenido(json); // Procesa todo el contenido desde la primera fila
    };
    reader.readAsBinaryString(file);
  }
}

function esTituloExcluido(tituloNormalizado) {
  const palabrasExcluidas = [
    "\\bep\\b",
    "re-release", // Asegúrate de que la expresión sea adecuada para la palabra tal como se normaliza
    "\\blive\\b",
    "\\(ep\\)", // Si decides mantener paréntesis en la normalización, asegúrate de que coincidan aquí,
    "various\\artists"
  ];
  return palabrasExcluidas.some(palabra => new RegExp(palabra, "i").test(tituloNormalizado));
}


function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '') // Elimina texto entre paréntesis
    .replace(/[\s]+/g, ' ') // Convierte múltiples espacios a un solo espacio
    .replace(/\u2013/g, '-') // Reemplaza en dashes por hyphen-minuses
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Elimina acentos
}

function quitarTextoDespuesDeParentesis(texto) {
  const indiceParentesis = texto.indexOf('(');
  if (indiceParentesis !== -1) {
    return texto.substring(0, indiceParentesis).trim();
  }
  return texto;
}

function procesarContenido(contenido) {
  lineasInvalidas.value = [];
  let resultadosTemporales = [];
  const titulosVistos = new Set();

  contenido.forEach(fila => {
    if (fila.length === 0) {
      lineasInvalidas.value.push('Línea vacía');
      return;
    }

    let genero = '', artistaTituloOriginal;
    if (fila.length === 1) {
      [artistaTituloOriginal] = fila;
    } else {
      [genero, artistaTituloOriginal] = fila;
    }

    // Normaliza el título para verificar duplicados y exclusiones
    const artistaTituloNormalizado = normalizarTexto(artistaTituloOriginal);

    console.log(artistaTituloNormalizado)
    console.log(titulosVistos.has(artistaTituloNormalizado))

    // Verifica si el título debe ser excluido basado en el texto normalizado
    if (!esTituloExcluido(artistaTituloNormalizado) && !titulosVistos.has(artistaTituloNormalizado)) {
      titulosVistos.add(artistaTituloNormalizado);

      // Elimina texto después del primer paréntesis en el título original antes de añadirlo a los resultados
      const artistaTituloParaMostrar = quitarTextoDespuesDeParentesis(artistaTituloOriginal);
      resultadosTemporales.push({ genero, artistaTitulo: artistaTituloParaMostrar });
    }
  });

  // Ordena los resultados alfabéticamente por el título del artista
  resultadosTemporales.sort((a, b) => a.artistaTitulo.localeCompare(b.artistaTitulo));

  // Asigna los resultados ordenados a la referencia reactiva de Vue
  resultadosBusqueda.value = resultadosTemporales;
}



function exportarAExcel() {
  const wb = XLSX.utils.book_new();
  const wsData = resultadosBusqueda.value.map(({ genero, artistaTitulo }) => [genero, artistaTitulo]);
  wsData.unshift(['Género', 'Artista - Título']); // Encabezados de columna
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
  XLSX.writeFile(wb, 'resultados.xlsx');
}

function generarHTMLParaExportar() {
  let html = '<figure class="wp-block-table is-style-stripes"><table><tbody>';
  resultadosBusqueda.value.forEach(({ genero, artistaTitulo }) => {
    const contenidoAlbum = `<strong>${artistaTitulo}</strong>`;
    html += `<tr><td class="has-text-align-left" data-align="left">${genero}</td><td>${contenidoAlbum}</td></tr>`;
  });
  html += '</tbody></table></figure>';
  return html;
}

function exportarAHtmlComoTxt() {
  const html = generarHTMLParaExportar();
  const blob = new Blob([html], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'resultados.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <h1>Limpiador listado</h1>
  <div class="container">
    <div class="file-upload">
      <input type="file" @change="cargarArchivo" />
    </div>

    <div v-if="lineasInvalidas.length > 0">
      <button @click="mostrarLineasInvalidas = !mostrarLineasInvalidas">Mostrar líneas inválidas</button>
      <div v-show="mostrarLineasInvalidas">
        <ol>
          <li v-for="(linea, index) in lineasInvalidas" :key="index">{{ linea }}</li>
        </ol>
      </div>
    </div>


    <div class="results" v-if="resultadosBusqueda.length > 0">
      <table>
        <thead>
          <tr>
            <th>Género</th>
            <th>Artista - Álbum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(resultado, index) in resultadosBusqueda" :key="index">
            <td>{{ resultado.genero }}</td>
            <td>{{ resultado.artistaTitulo }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>No hay resultados para mostrar.</p>
    </div>

    <div class="export-buttons" v-if="resultadosBusqueda.length > 0">
      <button class="export-button excel" @click="exportarAExcel">Exportar a Excel</button>
      <button class="export-button txt" @click="exportarAHtmlComoTxt">Exportar a TXT</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-upload {
  /* Estilos para la sección de carga de archivos */
}

.results {
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}


th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #646cff;
}

.export-buttons {
  display: flex;
  gap: 10px;
  /* Añade espacio entre los botones */
  margin-top: 20px;
}

.export-button {
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.orden {
  background-color: #e29843;
  /* Verde */
}

.excel {
  background-color: #4CAF50;
  /* Verde */
}

.txt {
  background-color: #2196F3;
  /* Azul */
}

.export-button:hover {
  opacity: 0.8;
}

.export-button:active {
  transform: scale(0.98);
  /* Efecto al pulsar */
}
</style>
