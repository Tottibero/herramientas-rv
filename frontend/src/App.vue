<template>
  <div id="app">
    <aside class="sidebar">
      <div class="logo">
        <img src="https://www.riffvalley.es/wp-content/uploads/2023/06/cropped-icon-thumb.png" alt="Logo">
      </div>

      <div class="section" style="margin-top: 20px;">
        <div class="section-title">Sección Discos</div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Exportar Datos</router-link>
          <router-link to="/merger" class="nav-link">Mergear datos</router-link>
          <router-link to="/limpiador" class="nav-link">Limpiar Listado</router-link>
          <router-link to="/buscador" class="nav-link">Buscador</router-link>
        </div>
      </div>

      <!-- Puedes añadir más secciones aquí -->

      <footer>
        v 0.0.1
      </footer>
    </aside>
    <router-view />
  </div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px; /* Ancho del sidebar */
  height: 100vh; /* Altura completa */
  background-color: #333; /* Color de fondo */
  padding: 20px; /* Espaciado interno */
  box-sizing: border-box; /* Para que el padding no afecte el ancho total */
  display: flex; /* Usar flexbox para organizar los elementos en columna */
  flex-direction: column; /* Organizar elementos en columna */
}

.logo img {
  max-width: 30%; /* Para asegurar que el logo no sobrepase el ancho del sidebar */
  height: auto; /* Para mantener la proporción del logo */
}

.section {
  margin-top: 20px; /* Espacio entre secciones */
}

.section-title {
  color: #fff; /* Color del texto */
  margin-bottom: 15px; /* Espacio debajo del título */
}

.nav-links {
  display: flex;
  flex-direction: column; /* Los enlaces se muestran en columna */
}

.nav-link {
  text-decoration: none;
  color: #fff;
  margin-bottom: 10px; /* Espacio entre enlaces */
  transition: color 0.3s;
}

.nav-link:hover {
  color: #ffb400; /* Color al pasar el ratón */
}

footer {
  text-align: center;
  padding: 20px 0;
  margin-top: auto; /* El footer se sitúa al final del aside */
  color: #fff;

}
</style>
