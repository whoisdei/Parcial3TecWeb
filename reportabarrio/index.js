// ===== Importaciones =====
// Express es el framework que usamos para crear el servidor y las rutas
const express = require('express');
const path = require('path');

const app = express();
const PUERTO = 3000;

// ===== Middlewares =====
// Permite leer los datos que llegan por POST desde los formularios (req.body)
app.use(express.urlencoded({ extended: true }));

// Sirve los archivos de la carpeta public (html, css e imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// ===== Datos en memoria (no usamos base de datos) =====
// Categorías: la clave es lo que viaja en el formulario y el valor es el texto que se muestra
const CATEGORIAS = {
  vias: 'Vías y huecos',
  alumbrado: 'Alumbrado público',
  residuos: 'Residuos y basuras',
  agua: 'Agua y alcantarillado',
  espacio: 'Espacio público y zonas verdes',
  seguridad: 'Seguridad vial',
};

const URGENCIAS = ['baja', 'media', 'alta'];
const ESTADOS = ['Pendiente', 'En proceso', 'Resuelto'];

// Arreglo donde se guardan los reportes. Dejamos tres de ejemplo para que
// las estadísticas y los filtros se puedan probar desde el inicio.
const reportes = [
  {
    id: 1,
    titulo: 'Hueco grande en la calle principal',
    categoria: 'vias',
    barrio: 'Centro',
    descripcion: 'Hay un hueco que ya dañó varias llantas de los carros que pasan.',
    urgencia: 'alta',
    contacto: 'vecino1@correo.com',
    fecha: '10/11/2026, 8:15:00 a. m.',
    estado: 'Pendiente',
  },
  {
    id: 2,
    titulo: 'Poste sin luz hace dos semanas',
    categoria: 'alumbrado',
    barrio: 'La Paz',
    descripcion: 'La cuadra queda completamente oscura en la noche.',
    urgencia: 'media',
    contacto: 'vecino2@correo.com',
    fecha: '12/11/2026, 7:40:00 p. m.',
    estado: 'En proceso',
  },
  {
    id: 3,
    titulo: 'Basura acumulada en la esquina',
    categoria: 'residuos',
    barrio: 'Centro',
    descripcion: 'El camión no pasa y la basura se acumula en la esquina del parque.',
    urgencia: 'media',
    contacto: 'vecino3@correo.com',
    fecha: '15/11/2026, 9:05:00 a. m.',
    estado: 'Pendiente',
  },
];

// Se usa para darle un id único a cada reporte nuevo
let siguienteId = reportes.length + 1;

// ===== Funciones auxiliares =====

// Cambia los caracteres especiales para que lo que escriba el usuario
// se muestre como texto y no se interprete como código HTML
const escapar = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Arma la estructura de una página generada por el servidor (header, main y footer).
// Así no repetimos el mismo HTML en cada ruta.
const armarPagina = (titulo, contenido) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} | ReportaBarrio</title>
  <link rel="stylesheet" href="/estilos.css">
</head>
<body>
  <header>
    <a class="logo" href="/">
      <img src="/img/logo.svg" alt="Logo de ReportaBarrio" width="36" height="36">
      <span>ReportaBarrio</span>
    </a>
    <nav>
      <a href="/">Inicio</a>
      <a href="/reportar.html">Reportar</a>
      <a href="/reportes">Reportes</a>
      <a href="/estadisticas">Estadísticas</a>
    </nav>
  </header>
  <main>
${contenido}
  </main>
  <footer>
    <p>ReportaBarrio · Proyecto de aula de Tecnologías Web · ODS 11: Ciudades y comunidades sostenibles</p>
  </footer>
</body>
</html>`;

// Arma el HTML de una tarjeta (un reporte)
const armarTarjeta = (r) => `
      <article class="tarjeta urgencia-${r.urgencia}">
        <h2>${escapar(r.titulo)}</h2>
        <p class="etiqueta">${CATEGORIAS[r.categoria]}</p>
        <p>${escapar(r.descripcion)}</p>
        <ul>
          <li><strong>Barrio:</strong> ${escapar(r.barrio)}</li>
          <li><strong>Urgencia:</strong> ${r.urgencia}</li>
          <li><strong>Estado:</strong> ${r.estado}</li>
          <li><strong>Contacto:</strong> ${escapar(r.contacto)}</li>
          <li><strong>Fecha:</strong> ${r.fecha}</li>
        </ul>
      </article>`;

// Revisa los datos del formulario. Devuelve un texto con el error,
// o null si todo está bien.
const validarReporte = ({ titulo, categoria, barrio, descripcion, urgencia, contacto }) => {
  if (!titulo || !categoria || !barrio || !descripcion || !urgencia || !contacto) {
    return 'Todos los campos son obligatorios. Falta completar al menos uno.';
  }
  if (!CATEGORIAS[categoria]) {
    return 'La categoría seleccionada no es válida.';
  }
  if (!URGENCIAS.includes(urgencia)) {
    return 'El nivel de urgencia no es válido.';
  }
  if (!contacto.includes('@')) {
    return 'El correo de contacto debe incluir el símbolo @.';
  }
  return null;
};

// ===== Rutas =====

// GET /reportes: muestra las tarjetas y aplica los filtros que lleguen por la URL
app.get('/reportes', (req, res) => {
  // req.query trae lo que va después del "?" en la URL. String() evita errores si llega vacío.
  const categoria = String(req.query.categoria || '');
  const barrio = String(req.query.barrio || '').trim();

  // Se parte de la lista completa y cada filtro, si viene, la va reduciendo
  let lista = reportes;
  if (categoria) {
    lista = lista.filter((r) => r.categoria === categoria);
  }
  if (barrio) {
    lista = lista.filter((r) => r.barrio.toLowerCase().includes(barrio.toLowerCase()));
  }

  // Opciones del select de categorías, dejando marcada la que está filtrada
  const opciones = Object.entries(CATEGORIAS)
    .map(([clave, nombre]) =>
      `<option value="${clave}"${clave === categoria ? ' selected' : ''}>${nombre}</option>`)
    .join('');

  // Si no hay reportes se muestra un mensaje; si hay, se arman las tarjetas
  const tarjetas = lista.length === 0
    ? '<p class="aviso">No hay reportes que cumplan con los filtros seleccionados.</p>'
    : `<div class="grilla">${lista.map(armarTarjeta).join('')}</div>`;

  const contenido = `
    <section>
      <h1>Reportes del barrio</h1>
      <form id="filtros" action="/reportes" method="get">
        <div class="campo">
          <label for="categoria">Categoría</label>
          <select id="categoria" name="categoria">
            <option value="">Todas</option>
            ${opciones}
          </select>
        </div>
        <div class="campo">
          <label for="barrio">Barrio</label>
          <input type="text" id="barrio" name="barrio" value="${escapar(barrio)}" placeholder="Ej: Centro">
        </div>
        <button type="submit">Filtrar</button>
        <a class="boton secundario" href="/reportes">Quitar filtros</a>
      </form>
      <p>Mostrando ${lista.length} de ${reportes.length} reportes.</p>
      ${tarjetas}
    </section>`;

  res.send(armarPagina('Reportes', contenido));
});

// POST /reportes: recibe el formulario, valida, guarda y redirige
app.post('/reportes', (req, res) => {
  // req.body trae los datos del formulario (si no llega nada, se usa un objeto vacío)
  const datos = req.body || {};

  // Se limpian los espacios sobrantes de cada campo
  const nuevo = {
    titulo: String(datos.titulo || '').trim(),
    categoria: String(datos.categoria || '').trim(),
    barrio: String(datos.barrio || '').trim(),
    descripcion: String(datos.descripcion || '').trim(),
    urgencia: String(datos.urgencia || '').trim(),
    contacto: String(datos.contacto || '').trim(),
  };

  const error = validarReporte(nuevo);

  // Si hay error se responde con código 400 y no se guarda nada
  if (error) {
    const contenido = `
    <section>
      <h1>No se pudo guardar el reporte</h1>
      <p class="aviso error">${error}</p>
      <a class="boton" href="/reportar.html">Volver al formulario</a>
    </section>`;
    return res.status(400).send(armarPagina('Error en el reporte', contenido));
  }

  // Si todo está bien se agrega al arreglo con los datos automáticos (id, fecha y estado)
  reportes.push({
    id: siguienteId++,
    ...nuevo,
    fecha: new Date().toLocaleString('es-CO'),
    estado: 'Pendiente',
  });

  // Se manda al usuario a la lista para que vea su reporte
  res.redirect('/reportes');
});

// GET /estadisticas: cuenta los reportes por categoría y por estado
app.get('/estadisticas', (req, res) => {
  const porCategoria = {};
  for (const clave in CATEGORIAS) {
    porCategoria[clave] = 0;
  }
  const porEstado = {};
  ESTADOS.forEach((estado) => {
    porEstado[estado] = 0;
  });

  // Se recorren los reportes y se suma uno al contador que corresponda
  reportes.forEach((r) => {
    porCategoria[r.categoria]++;
    porEstado[r.estado]++;
  });

  const filasCategoria = Object.entries(porCategoria)
    .map(([clave, total]) => `<tr><td>${CATEGORIAS[clave]}</td><td>${total}</td></tr>`)
    .join('');
  const filasEstado = Object.entries(porEstado)
    .map(([estado, total]) => `<tr><td>${estado}</td><td>${total}</td></tr>`)
    .join('');

  const contenido = `
    <section>
      <h1>Estadísticas</h1>
      <p>Total de reportes registrados: <strong>${reportes.length}</strong></p>
      <div class="grilla">
        <article class="tarjeta">
          <h2>Por categoría</h2>
          <table>
            <thead><tr><th>Categoría</th><th>Reportes</th></tr></thead>
            <tbody>${filasCategoria}</tbody>
          </table>
        </article>
        <article class="tarjeta">
          <h2>Por estado</h2>
          <table>
            <thead><tr><th>Estado</th><th>Reportes</th></tr></thead>
            <tbody>${filasEstado}</tbody>
          </table>
        </article>
      </div>
    </section>`;

  res.send(armarPagina('Estadísticas', contenido));
});

// Ruta 404: va al final. Si ninguna ruta anterior respondió, se llega aquí.
app.use((req, res) => {
  const contenido = `
    <section>
      <h1>404 · Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <a class="boton" href="/">Volver al inicio</a>
    </section>`;
  res.status(404).send(armarPagina('Página no encontrada', contenido));
});

// ===== Inicio del servidor =====
app.listen(PUERTO, () => {
  console.log(`Servidor funcionando en http://localhost:${PUERTO}`);
});
