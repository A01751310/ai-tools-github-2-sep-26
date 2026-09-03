# LogiFresh México — dashboard de servicio refrigerado

Dashboard HTML interactivo para priorizar un piloto operativo de 30 días a partir de 240 embarques sintéticos de abril a junio de 2026.

## Pregunta de decisión

¿En qué segmentos debería concentrarse un piloto de mejora operativa de 30 días y qué evidencia adicional hace falta antes de intervenir?

Preguntas secundarias:

1. ¿Cuándo y en qué segmentos se amplía la brecha frente a la meta SLA de 90%?
2. ¿Dónde se concentran los incidentes y las reclamaciones?
3. ¿Qué asociaciones merecen validación causal antes de escalar una intervención?

## Resultado principal

El SLA agregado reconciliado es 76.7%, 13.3 puntos porcentuales por debajo de la meta. Las rutas Estándar combinan SLA de 76.3%, el mayor retraso medio entre tardíos (55.6 min) y $443,849 MXN en reclamaciones; por ello son el punto de partida propuesto para un piloto controlado. Esta priorización no demuestra causalidad.

## Contenido

- Siete KPIs: embarques, SLA, retraso promedio de tardíos, incidentes, excursiones >8 °C, reclamaciones y satisfacción.
- Ocho filtros: mes, origen, destino, producto, transportista, tipo de ruta, SLA e incidente.
- Diagnóstico de SLA temporal y por segmento, incidentes y reclamaciones.
- Panel dinámico de Hechos, Hipótesis y Próximo paso.
- Tabla paginada, búsqueda por ID y descarga del subconjunto filtrado.
- Estados sin datos, navegación por teclado y diseño responsive.

## Cálculos

- `SLA = embarques con sla_entrega = "Cumple" / embarques filtrados`.
- `Retraso promedio = promedio(retraso_min)` solo para valores mayores a cero.
- `Incidentes = conteo(tipo_incidente != "Sin incidente")`.
- `Excursiones = conteo(excursion_temp_mayor_8c = "Sí")`.
- `Reclamaciones = suma(reclamacion_mxn)`.
- `Satisfacción = promedio simple(satisfaccion_1_10)`.

Todos los cálculos se ejecutan en el navegador sobre `logifresh.json` y se vuelven a calcular después de cada filtro.

## Calidad y reconciliación

La fuente tiene 240 filas y 18 campos, sin celdas faltantes, duplicados, IDs repetidos, negativos ni incoherencias entre SLA/retraso o bandera/temperatura. Se detectó una diferencia de $100 MXN: la columna original suma $882,549, mientras el valor de control es $882,649. La copia web corrige de forma explícita `LF-0224.reclamacion_mxn` de $4,399 a $4,499; el Excel original no fue modificado. La corrección y su supuesto quedan registrados en `source-profile.json` y `REPORTE_VALIDACION.md`.

## Arquitectura y diseño

Sitio estático sin dependencias externas: `index.html`, `styles.css`, `app.js` y JSON local. Esta arquitectura reduce peso, evita secretos y funciona con rutas relativas en GitHub Pages. Se eligieron barras con base cero y referencia visible de 90% porque la tarea principal es comparar magnitudes contra una meta. No se usaron gauges, 3D ni visuales decorativos.

## Ejecución local

Sirve la raíz del proyecto con cualquier servidor HTTP estático y abre `index.html`. La carga directa con `file://` no es compatible porque el navegador protege la lectura del archivo JSON local.

## Publicación

- Repositorio: se añadirá tras la autorización de publicación.
- GitHub Pages: se añadirá tras verificar el despliegue público.
- Commit final: se añadirá después de la verificación pública.

## Validación

Consulta [REPORTE_VALIDACION.md](REPORTE_VALIDACION.md) para resultados esperados/obtenidos, pruebas de filtros, vista móvil, accesibilidad básica, recursos y correcciones.

## Privacidad y limitaciones

El proyecto contiene exclusivamente datos sintéticos. No incluye tokens, secretos ni datos personales. La muestra cubre un periodo corto y presenta patrones balanceados propios de un ejercicio; faltan causa raíz validada, tiempos por etapa, condiciones externas, valor de carga, costo de intervención y exposición comparable por segmento.
