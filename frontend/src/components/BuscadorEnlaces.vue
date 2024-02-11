

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Refs para datos reactivos
const resultadosBusqueda = ref([]);
const resultados = [];
const lineasInvalidas = ref([]);
const mostrarLineasInvalidas = ref(false); // Definir aquí

// Obtiene el token de acceso de Spotify
async function obtenerTokenSpotify() {
  const client_id = import.meta.env.VITE_CLIENT_ID;
  const client_secret = import.meta.env.VITE_CLIENT_SECRET;
  const credentials = btoa(`${client_id}:${client_secret}`);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error al obtener el token de Spotify:', error);
  }
}

function cargarArchivo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, {
        type: 'binary'
      });

      // Assuming the first sheet is the one we need
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert the sheet to JSON
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // Se elimina la llamada a slice(1) para no omitir la primera fila
      const contenido = json; // Se procesa todo el contenido desde la primera fila

      procesarYBuscar(contenido);
    };
    reader.readAsBinaryString(file);
  }
}

async function procesarYBuscar(contenido) {
  // Divide el contenido en líneas, asegurándose de eliminar espacios en blanco innecesarios
  // y filtrar líneas vacías
  lineasInvalidas.value = [];
  resultadosBusqueda.value = []; // Limpia los resultados reactivos

  let promesasBusqueda = contenido.map(fila => {
    // Asumiendo que el separador entre el género y el artista - título del álbum es '\t'
    let [genero, artistaTitulo] = fila; // No split needed here
    let [artista, tituloAlbum] = artistaTitulo.split(/\s*[-–]\s*/).map(parte => parte.trim());
    console.log(artista)
    if (artista && tituloAlbum) {
      return buscarAlbumEnSpotify(genero, artista, tituloAlbum)
        .then(url => {
          return { genero, artista, tituloAlbum, url }; // Asegura que cada parte sea tratada correctamente
        })
        .catch(error => {
          console.error(`Error al buscar: ${artista} - ${tituloAlbum}`, error);
          return { genero, artista, tituloAlbum, url: 'Error al realizar la búsqueda' };
        });
    } else {
      // En caso de que alguna línea no cumpla con el formato esperado después del trim
      lineasInvalidas.value.push(`Línea no válida o con formato incorrecto: "${fila.join(' - ')}"`);
      return Promise.resolve(null); // Retorna null para estas líneas y las filtrará después
    }
  });

  console.log(promesasBusqueda);

  // Espera a que todas las búsquedas se completen, filtra los nulos, y luego ordena


  // Ordena los resultados alfabéticamente por artista o título del álbum
  resultados.sort((a, b) => a.artista.localeCompare(b.artista));

  // Actualiza el estado/reactivo de Vue con los resultados ordenados
  resultadosBusqueda.value = resultados;
}

// Busca el álbum en Spotify por nombre de artista y título de álbum
async function buscarAlbumEnSpotify(genero, artista, tituloAlbum) {
  console.log("spotify", artista, tituloAlbum)
  const token = await obtenerTokenSpotify();
  if (!token) {
    console.error('No se pudo obtener el token de Spotify');
    return;
  }

  try {
    const query = encodeURIComponent(`album:${tituloAlbum} artist:${artista}`);
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.data.albums.items.length > 0) {
      const album = response.data.albums.items[0];
      console.log(album)
      resultadosBusqueda.value.push({
        genero: genero,
        artista: artista,
        tituloAlbum: tituloAlbum,
        url: album.external_urls.spotify,
      });
    } else {
      resultadosBusqueda.value.push({
        genero: genero,
        artista: artista,
        tituloAlbum: tituloAlbum,
        url: 'No se encontró el álbum',
      });
    }
  } catch (error) {
    console.error('Error al buscar el álbum en Spotify:', error);
    resultadosBusqueda.value.push({
      genero: genero,
      artista: artista,
      tituloAlbum: tituloAlbum,
      url: 'Error al realizar la búsqueda',
    });
  }
}

function ordenarAlfabeticamente() {
  return resultadosBusqueda.value.sort((a, b) => {
    // Primero compara por artista
    const comparacionArtista = a.artista.localeCompare(b.artista);
    if (comparacionArtista !== 0) return comparacionArtista;
    // Si los artistas son iguales, compara por título del álbum
    return a.tituloAlbum.localeCompare(b.tituloAlbum);
  });
}

function exportarAExcel() {
  // Ordena los resultados alfabéticamente por artista y luego por título del álbum
  const resultadosOrdenados = ordenarAlfabeticamente();
  // Continúa con la creación del libro de Excel usando resultadosOrdenados
  const wb = XLSX.utils.book_new();

  // Asegúrate de incluir el género en los datos
  const wsData = resultadosOrdenados.map(({ genero, artista, tituloAlbum, url }) => {
    // Incluye el enlace solo si la URL es válida
    let link = url && url !== 'Error al realizar la búsqueda' && url !== 'No se encontró el álbum' ? url : 'No disponible';
    return [genero, `${artista} - ${tituloAlbum}`, link];
  });

  // Encabezados de columna incluyendo 'Género'
  wsData.unshift(['Género', 'Artista - Disco', 'Enlace']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
  XLSX.writeFile(wb, 'resultados.xlsx');
}

// Función para generar la cadena HTML con ordenación y condicional para los enlaces
function generarHTMLParaExportar() {
  // Ordena resultadosBusqueda alfabéticamente por artista y luego por título del álbum
  const resultadosOrdenados = ordenarAlfabeticamente();

  let html = '<figure class="wp-block-table is-style-stripes"><table><tbody>';
  resultadosOrdenados.forEach(resultado => {
    // Verifica si resultado.url es una URL válida para incluir el enlace
    const contenidoAlbum = resultado.url && resultado.url !== 'Error al realizar la búsqueda' && resultado.url !== 'No se encontró el álbum'
      ? `<strong><a href="${resultado.url}" target="_blank" rel="noreferrer noopener">${resultado.artista} – ${resultado.tituloAlbum}</a></strong>`
      : `<strong>${resultado.artista} – ${resultado.tituloAlbum}</strong>`; // Solo muestra texto si no hay URL válida

    html += `<tr><td class="has-text-align-left" data-align="left">${resultado.genero}</td><td>${contenidoAlbum}</td></tr>`;
  });
  html += '</tbody></table></figure>';
  return html;
}

// Función para exportar a archivo .txt
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
  <h1 class="global-title">Buscador Enlaces</h1>
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
            <th>Enlace</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resultado in resultadosBusqueda" :key="resultado.artista + resultado.tituloAlbum">
            <td>{{ resultado.genero }}</td>
            <td>{{ resultado.artista }} - {{ resultado.tituloAlbum }}</td>
            <td>
              <a v-if="resultado.url && resultado.url !== 'Error al realizar la búsqueda' && resultado.url !== 'No se encontró el álbum'"
                :href="resultado.url" target="_blank">{{ resultado.url }}</a>
              <span v-else>No disponible</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>No hay resultados para mostrar.</p>
    </div>

    <div class="export-buttons" v-if="resultadosBusqueda.length > 0">
      <button class="export-button orden" @click="ordenarAlfabeticamente">Ordenar alfabéticamente</button>
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
}</style>
