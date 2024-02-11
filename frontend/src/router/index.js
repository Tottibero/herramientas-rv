import { createRouter, createWebHistory } from 'vue-router';
import BuscadorEnlacesComponent from '../components/BuscadorEnlaces.vue';
import LimpiarListadoComponent from '../components/LimpiarListado.vue';
import ExportarDatosComponent from '../components/ExportarDatos.vue';
import ExcelMergerComponent from '../components/ExcelMerger.vue';

const routes = [
  {
    path: '/buscador',
    name: 'Buscador',
    component: BuscadorEnlacesComponent,
  },
  {
    path: '/limpiador',
    name: 'LimpiarListado',
    component: LimpiarListadoComponent,
  },
  {
    path: '/merger',
    name: 'MergeData',
    component: ExcelMergerComponent,
  },

  {
    path: '/',
    name: 'ExportadorDatos',
    component: ExportarDatosComponent,
  },

];

const router = createRouter({
  history: createWebHistory('/enlaces-spotify/'),
  base: process.env.NODE_ENV === 'production' ? '/enlaces-spotify/' : '/',
  routes,
});

export default router;
