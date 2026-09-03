# Reporte de validación — LogiFresh México

**Fecha:** 2 de septiembre de 2026  
**Fuente:** `Datos_sinteticos_LogiFresh_dashboard.xlsx`  
**Periodo:** 1 de abril al 28 de junio de 2026  
**Naturaleza:** datos sintéticos; no contienen datos personales.

## 1. Perfil de calidad

- 240 filas × 18 campos; 240 IDs únicos.
- 0 celdas faltantes, 0 filas duplicadas y 0 IDs duplicados.
- 0 valores negativos en tránsito, retraso, temperatura, reclamaciones, distancia u ocupación.
- 0 satisfacciones fuera de 1–10 y 0 ocupaciones fuera de 0–1.
- 0 incoherencias entre `sla_entrega` y `retraso_min`.
- 0 incoherencias entre `excursion_temp_mayor_8c` y `temperatura_max_c > 8`.

## 2. Reconciliación de controles

| Indicador | Fuente cruda | Control | Publicado | Estado |
|---|---:|---:|---:|---|
| Embarques | 240 | 240 | 240 | Pasa |
| SLA | 76.7% | 76.7% | 76.7% | Pasa |
| Retraso promedio de tardíos | 51.8 min | 51.8 min | 51.8 min | Pasa |
| Incidentes | 52 | 52 | 52 | Pasa |
| Excursiones >8 °C | 9 | 9 | 9 | Pasa |
| Reclamaciones | $882,549 | $882,649 | $882,649 | Pasa con corrección documentada |
| Satisfacción | 8.5/10 | 8.5/10 | 8.5/10 | Pasa |

**Corrección aplicada a la copia web:** `LF-0224.reclamacion_mxn` cambió de $4,399 a $4,499 (+$100). El valor original era el único monto de reclamación no redondeado y la corrección reconcilia exactamente el control. Es una inferencia de calidad, no un dato observado; el Excel fuente permanece intacto.

## 3. Preguntas y diseño

El dashboard responde una pregunta principal —dónde pilotear durante 30 días— y tres preguntas secundarias sobre brecha SLA, concentración de incidentes/reclamaciones y evidencia causal faltante. Se priorizó un recorrido de contexto → estado → diagnóstico → interpretación → detalle. Las barras empiezan en cero, la meta SLA de 90% está etiquetada y los datos exactos permanecen disponibles en KPIs y tabla.

## 4. Matriz de pruebas local

| Prueba | Esperado | Obtenido | Estado |
|---|---|---|---|
| Total sin filtros | 240 | 240 | Pasa |
| SLA sin filtros | 76.7% | 76.7% | Pasa |
| Retraso tardíos | 51.8 min | 51.8 min | Pasa |
| Incidentes | 52 | 52 | Pasa |
| Excursiones >8 °C | 9 | 9 | Pasa |
| Reclamaciones | $882,649 | $882,649 | Pasa |
| Satisfacción | 8.5/10 | 8.5/10 | Pasa |
| Filtro individual: Origen = Guadalajara | 40 filas; 77.5% SLA; tabla/gráficas/panel actualizados | 40 filas; 77.5% SLA; todos actualizados | Pasa |
| Dos filtros: Producto = Preparados + Ruta = Estándar | 16 filas; 75.0% SLA; intersección | 16 filas; 75.0% SLA; intersección | Pasa |
| Restablecer | 240 filas y 0 filtros activos | 240 filas y 0 filtros activos | Pasa |
| Sin resultados: Guadalajara + Prioritaria | 0 filas y mensajes claros | 0 filas; 4 gráficas, KPIs, panel y tabla muestran estado vacío | Pasa |
| Responsive 320 px | Sin desplazamiento horizontal de página | `scrollWidth = clientWidth = 320` tras corrección | Pasa |
| Responsive 390 px | KPIs legibles y apilados | 7 KPIs legibles; página sin desbordamiento | Pasa |
| Responsive 768 px | Sin desplazamiento horizontal de página | `scrollWidth = clientWidth = 768` | Pasa |
| Accesibilidad básica | Controles etiquetados, foco visible, regiones y texto alternativo | 0 selectores sin etiqueta; 4 visuales con descripción; foco CSS y `aria-live` | Pasa |
| IDs HTML | Sin duplicados | 0 duplicados | Pasa |
| Recursos locales | HTML, CSS, JS y JSON cargan | Carga correcta; 0 errores de consola | Pasa |
| Recursos públicos | HTML, CSS, JS y JSON cargan desde GitHub Pages | Documento completo; `styles.css` con 104 reglas, `app.js` ejecutado y 240 filas procesadas | Pasa |
| Commit público | URL corresponde al contenido publicado | Despliegue inicial desde `bfc6d15aaa1a964811853fdb86eaf87d8284ed3c`; documentación final añadida después | Pasa |

**URL verificada:** https://a01751310.github.io/ai-tools-github-2-sep-26/  
**Repositorio:** https://github.com/A01751310/ai-tools-github-2-sep-26

## 5. Evidencia visual

- [Dashboard sin filtros](dashboard-sin-filtros.jpg)
- [Dashboard con dos filtros](dashboard-dos-filtros.jpg)
- [Vista móvil](dashboard-movil.jpg)
- [KPIs en móvil](dashboard-movil-kpis.jpg)

## 6. Correcciones realizadas

1. Se reconcilió la diferencia de $100 MXN sin modificar el Excel fuente y se hizo visible el supuesto.
2. Se ordenó la serie temporal por clave de mes para evitar un orden alfabético incorrecto.
3. Se corrigió un desbordamiento de 18 px en 320 px provocado por la paginación de la tabla.

## 7. Hallazgos

1. El SLA agregado es 76.7%, 13.3 pp por debajo de la meta de 90%.
2. Abril y mayo muestran 100% de SLA, mientras junio baja a 30%; esta ruptura temporal concentra el incumplimiento, pero puede reflejar cómo se construyó el dataset sintético.
3. Las rutas Estándar suman $443,849 MXN (50.3% del total) y 55.6 min de retraso promedio en tardíos, el mayor entre tipos de ruta; Preparados concentra $359,900 MXN por producto.

## 8. Hipótesis por validar

1. La caída de junio podría asociarse con un cambio operativo o externo; requiere fechas de compromiso, eventos, tráfico, clima y tiempos por etapa para descartar un artefacto del dataset.
2. La concentración económica en rutas Estándar y producto Preparados podría deberse a mayor exposición o valor de carga, no a peor ejecución; hace falta normalizar por valor transportado, kilómetros y número de embarques.

## 9. Piloto recomendado de 30 días

Aplicar un piloto en rutas Estándar con control de hora de salida, confirmación de ventana de entrega y captura obligatoria de causa por etapa. Línea base: SLA 76.3%, retraso tardío 55.6 min y $443,849 MXN en reclamaciones del periodo. Criterio preliminar de éxito: +8 pp de SLA y −20% de retraso, sin elevar reclamaciones. Comparar con una ruta no intervenida y revisar semanalmente; no atribuir causalidad sin diseño de comparación.

## 10. Riesgos y datos faltantes

- La fuente es sintética, corta y con categorías muy balanceadas; los resultados no deben extrapolarse a una operación real.
- Falta causa raíz validada, fecha/hora comprometida y real, tiempos de carga/espera/última milla, clima, tráfico y mantenimiento.
- Faltan valor de la carga, costo de intervención y denominadores de exposición para comparar reclamaciones de forma justa.
- La corrección de LF-0224 es un supuesto de reconciliación y debe confirmarse con quien generó el dataset.
