<template>
    <div>
        <h1 class="global-title">Mergear Excels</h1>
        <div v-bind="getRootProps()" class="file-drop-zone">
            <input v-bind="getInputProps()" />
            <p v-if="isDragActive">Suelta los archivos aquí...</p>
            <p v-else>Arrastra y suelta archivos aquí o haz clic para seleccionarlos</p>
        </div>
        <div v-if="files.length > 0">
            <h3>Archivos seleccionados:</h3>
            <ul>
                <li v-for="(file, index) in files" :key="index">{{ file.name }}</li>
            </ul>
        </div>
        <button @click="mergeExcelFiles">Unificar y Descargar</button>
    </div>
</template>
    
<script>
import { ref } from 'vue';
import { useDropzone } from "vue3-dropzone";
import * as XLSX from 'xlsx';

export default {
    name: 'ExcelMerger',
    setup() {
        const files = ref([]);

        function onDrop(acceptedFiles) {
            acceptedFiles.forEach(file => {
                files.value.push(file);
            });
            files.value = [...acceptedFiles];
        }

        const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

        async function mergeExcelFiles() {
            let unifiedData = {};

            for (const file of files.value) {
                const data = await readFile(file);
                Object.keys(data).forEach(sheetName => {
                    if (!unifiedData[sheetName]) {
                        unifiedData[sheetName] = [];
                    }
                    unifiedData[sheetName] = unifiedData[sheetName].concat(data[sheetName]);
                });
            }

            Object.keys(unifiedData).forEach(sheetName => {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(unifiedData[sheetName]);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                XLSX.writeFile(wb, `${sheetName}.xlsx`);
            });
        }

        function readFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetsData = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                        sheetsData[sheetName] = sheetData;
                    });
                    resolve(sheetsData);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsBinaryString(file);
            });
        }

        return {
            files,
            getRootProps,
            getInputProps,
            isDragActive,
            mergeExcelFiles,
        };
    },
};
</script>
  
<style scoped>


.file-drop-zone {
    width: 100%;
    height: 200px;
    border: 2px dashed var(--border-color);
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    box-sizing: border-box;
    cursor: pointer;
    margin-bottom: 20px;
    background-color: var(--background-color);
    color: var(--text-color);
}

.file-drop-zone:hover {
    background-color: var(--hover-background-color);
}

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-color);
}

li:hover {
    background-color: var(--hover-background-color);
}
</style>
  