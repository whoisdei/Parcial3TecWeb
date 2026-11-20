# ReportaBarrio

Plataforma ciudadana para reportar problemas del barrio, hecha con Node.js y Express.

## Integrante
- David Daniel Yepes Cañas

## Descripción
Los vecinos pueden registrar reportes (huecos, basuras, alumbrado, fugas de agua, etc.),
consultarlos en tarjetas, filtrarlos por categoría y barrio, y ver estadísticas básicas.
Los datos se guardan en un arreglo en memoria (sin base de datos), por lo que se pierden
al reiniciar el servidor. Incluye tres reportes de ejemplo para poder probar los filtros.

## ODS elegido: ODS 11 · Ciudades y comunidades sostenibles
- **Meta 11.1:** acceso a servicios básicos (agua, alumbrado, vías).
- **Meta 11.3:** participación ciudadana en la gestión del barrio.
- **Meta 11.6:** reducción del impacto ambiental urbano (residuos, zonas verdes).

## Instalación y ejecución
```bash
npm install
npm run dev     # con nodemon (se reinicia al guardar cambios)
# o también
npm start       # con node
```
Luego abre http://localhost:3000

## Rutas del servidor
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Página de inicio (archivo estático) |
| GET | `/reportar.html` | Formulario para registrar un reporte (archivo estático) |
| GET | `/reportes` | Lista de reportes. Filtros opcionales: `?categoria=...&barrio=...` |
| POST | `/reportes` | Recibe el formulario, valida (400 si falta algo), guarda y redirige a `/reportes` |
| GET | `/estadisticas` | Conteo de reportes por categoría y por estado |
| cualquier otra | `*` | Página 404 |

Categorías válidas para el filtro: `vias`, `alumbrado`, `residuos`, `agua`, `espacio`, `seguridad`.

