<template>
    <div class="container">
        <h1 class="global-title">Exportar datos desde paginas</h1>
  
      <div class="selectors">
        <div class="selector">
          <select id="source-select" v-model="selectedSource">
            <option disabled value="">Seleccione una fuente</option>
            <option value="heavymusichq">Heavy Music HQ</option>
            <option value="boolintunes">Boolin Tunes</option>
            <option value="lambgoat">Lambgoat</option>
            <option value="metalstorm">Metalstorm</option>
          </select>
        </div>
  
        <div class="selector">
          <select id="month-select" v-model="selectedMonth">
            <option disabled value="">Seleccione un mes</option>
            <option v-for="(month, index) in monthNames" :key="index" :value="index + 1">{{ month }}</option>
          </select>
        </div>
      </div>
  
      <div class="action-buttons">
        <button class="export-button" @click="handleExport">Obtener y Exportar a Excel</button>
      </div>
    </div>
  </template>
  
<script>
import axios from 'axios';
import * as XLSX from 'xlsx';

export default {
    data() {
        return {
            releases: [],
            selectedSource: '',
            selectedMonth: '',
            monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        };
    },
    methods: {
        async fetchReleases(month) {
            if (!this.selectedSource) {
                alert("Por favor, selecciona una fuente.");
                return;
            }
            const monthName = this.monthNames[month - 1];
            try {
                const response = await axios.get(import.meta.env.VITE_API_BASE_URL+ `/${this.selectedSource}?month=${monthName}`);
                this.releases = response.data;
            } catch (error) {
                console.error("Error al obtener los lanzamientos:", error);
                this.releases = [];
            }
        },
        exportToExcel() {
            const wb = XLSX.utils.book_new();
            this.releases.forEach(release => {
                const albumsRows = release.albums.map(albumName => [albumName]);
                const ws = XLSX.utils.aoa_to_sheet(albumsRows);
                XLSX.utils.book_append_sheet(wb, ws, release.date);
            });
            // Usa el mes seleccionado y el nombre de la fuente para el nombre del archivo
            const fileName = `lanzamientos${this.selectedSource.charAt(0).toUpperCase() + this.selectedSource.slice(1)}${this.monthNames[this.selectedMonth - 1]}.xlsx`;
            XLSX.writeFile(wb, fileName);
        },
        async handleExport() {
            if (!this.selectedMonth || !this.selectedSource) {
                alert("Por favor, selecciona un mes y una fuente.");
                return;
            }
            await this.fetchReleases(this.selectedMonth);
            this.exportToExcel();
        }
    },
};

</script>

<style>
.container {
  max-width: 800px;
  margin: 20px auto; /* Ajusta el margen superior aquí si es necesario */
  padding: 20px;
  text-align: center;
}

.selectors {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.selector label {
  display: block;
  margin-bottom: 5px;
}

.action-buttons {
  margin-top: 20px;
}

.export-button {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
}

.export-button:hover {
  background-color: #45a049;
}
</style>
