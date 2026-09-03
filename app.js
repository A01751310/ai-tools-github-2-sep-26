"use strict";

const TARGET_SLA = 90;
const PAGE_SIZE = 10;
const MONTH_NAMES = {"2026-04": "Abr 2026", "2026-05": "May 2026", "2026-06": "Jun 2026"};
const FILTERS = [
  ["filter-month", "month"], ["filter-origin", "origen"], ["filter-destination", "destino"],
  ["filter-product", "producto"], ["filter-carrier", "transportista"], ["filter-route", "tipo_ruta"],
  ["filter-sla", "sla_entrega"], ["filter-incident", "tipo_incidente"],
];

const state = { data: [], filtered: [], page: 1, search: "" };
const $ = (id) => document.getElementById(id);
const formatInt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatMoney = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

function monthOf(row) { return row.fecha_salida.slice(0, 7); }
function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }

function calculateMetrics(rows) {
  const late = rows.filter((row) => row.retraso_min > 0).map((row) => row.retraso_min);
  return {
    shipments: rows.length,
    slaRate: rows.length ? rows.filter((row) => row.sla_entrega === "Cumple").length / rows.length * 100 : null,
    lateDelayAvg: average(late),
    incidents: rows.filter((row) => row.tipo_incidente !== "Sin incidente").length,
    excursions: rows.filter((row) => row.excursion_temp_mayor_8c === "Sí").length,
    claims: rows.reduce((sum, row) => sum + row.reclamacion_mxn, 0),
    satisfaction: average(rows.map((row) => row.satisfaccion_1_10)),
  };
}

function groupBy(rows, field, valueGetter) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = valueGetter ? valueGetter(row) : row[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([label, groupRows]) => ({ label, rows: groupRows }));
}

function populateFilters() {
  FILTERS.forEach(([id, field]) => {
    const select = $(id);
    const values = field === "month"
      ? [...new Set(state.data.map(monthOf))].sort()
      : [...new Set(state.data.map((row) => row[field]))].sort((a, b) => String(a).localeCompare(String(b), "es"));
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = field === "month" ? MONTH_NAMES[value] : value;
      select.append(option);
    });
  });
}

function activeFilters() {
  return Object.fromEntries(FILTERS.map(([id, field]) => [field, $(id).value]).filter(([, value]) => value));
}

function filterData() {
  const filters = activeFilters();
  state.filtered = state.data.filter((row) => Object.entries(filters).every(([field, value]) => {
    return field === "month" ? monthOf(row) === value : String(row[field]) === value;
  }));
  state.page = 1;
  renderAll();
}

function kpiCard(label, value, note, alert = false) {
  return `<article class="kpi-card${alert ? " alert" : ""}"><p class="kpi-label">${label}</p><p class="kpi-value">${value}</p><p class="kpi-note">${note}</p></article>`;
}

function renderKpis(rows) {
  const m = calculateMetrics(rows);
  const hasData = rows.length > 0;
  const sla = hasData ? `${m.slaRate.toFixed(1)}%` : "—";
  const gap = hasData ? m.slaRate - TARGET_SLA : null;
  $("kpi-grid").innerHTML = [
    kpiCard("Embarques", hasData ? formatInt.format(m.shipments) : "0", "Conteo de filas filtradas"),
    kpiCard("SLA", sla, hasData ? `<strong>${gap.toFixed(1)} pp</strong> vs. meta 90%` : "Sin datos para el filtro", hasData && gap < 0),
    kpiCard("Retraso tardíos", m.lateDelayAvg === null ? "—" : `${m.lateDelayAvg.toFixed(1)} min`, m.lateDelayAvg === null ? "No hay embarques tardíos" : "Promedio solo si retraso > 0"),
    kpiCard("Incidentes", hasData ? formatInt.format(m.incidents) : "0", "Excluye “Sin incidente”", m.incidents > 0),
    kpiCard("Excursiones >8 °C", hasData ? formatInt.format(m.excursions) : "0", "Conteo de indicador “Sí”", m.excursions > 0),
    kpiCard("Reclamaciones", hasData ? formatMoney.format(m.claims) : "$0", "Suma asociada a embarques", m.claims > 0),
    kpiCard("Satisfacción", m.satisfaction === null ? "—" : `${m.satisfaction.toFixed(1)}/10`, "Promedio simple"),
  ].join("");
}

function renderBarChart(containerId, items, options = {}) {
  const container = $(containerId);
  if (!items.length) {
    container.innerHTML = '<div class="chart-empty">No hay datos para esta combinación de filtros.</div>';
    container.setAttribute("aria-label", `${options.title || "Gráfica"}: sin datos`);
    return;
  }
  const max = options.fixedMax ?? Math.max(...items.map((item) => item.value), 1);
  container.innerHTML = items.map((item) => {
    const width = Math.max(0, Math.min(100, item.value / max * 100));
    const target = options.target ? '<span class="target-line" aria-hidden="true"></span>' : "";
    const warn = options.target && item.value < options.target;
    return `<div class="bar-row">
      <span class="bar-label" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}${item.meta ? `<span class="bar-meta">${escapeHtml(item.meta)}</span>` : ""}</span>
      <span class="bar-track">${target}<span class="bar-fill${warn ? " warn" : ""}" style="width:${width.toFixed(2)}%"></span></span>
      <span class="bar-value">${escapeHtml(options.format(item.value))}</span>
    </div>`;
  }).join("");
  container.setAttribute("aria-label", `${options.title || "Gráfica"}. ${items.map((item) => `${item.label}: ${options.format(item.value)}`).join("; ")}`);
}

function renderCharts(rows) {
  const monthly = groupBy(rows, null, monthOf).map((group) => ({
    label: MONTH_NAMES[group.label] || group.label,
    sortKey: group.label,
    value: calculateMetrics(group.rows).slaRate,
    meta: `n=${group.rows.length}`,
  })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  renderBarChart("monthly-sla-chart", monthly, { title: "SLA mensual", fixedMax: 100, target: TARGET_SLA, format: (v) => `${v.toFixed(1)}%` });

  const dimension = $("segment-dimension").value;
  const segments = groupBy(rows, dimension).map((group) => ({
    label: group.label,
    value: calculateMetrics(group.rows).slaRate,
    meta: `n=${group.rows.length}`,
  })).sort((a, b) => a.value - b.value || b.rows?.length - a.rows?.length);
  renderBarChart("segment-sla-chart", segments, { title: "SLA por segmento", fixedMax: 100, target: TARGET_SLA, format: (v) => `${v.toFixed(1)}%` });

  const incidents = groupBy(rows.filter((row) => row.tipo_incidente !== "Sin incidente"), "tipo_incidente")
    .map((group) => ({ label: group.label, value: group.rows.length }))
    .sort((a, b) => b.value - a.value);
  renderBarChart("incident-chart", incidents, { title: "Incidentes", format: (v) => formatInt.format(v) });

  const claims = groupBy(rows, "producto").map((group) => ({
    label: group.label,
    value: group.rows.reduce((sum, row) => sum + row.reclamacion_mxn, 0),
  })).sort((a, b) => b.value - a.value);
  renderBarChart("claims-chart", claims, { title: "Reclamaciones por producto", format: (v) => formatMoney.format(v) });
}

function renderInterpretation(rows) {
  if (!rows.length) {
    $("facts-panel").innerHTML = "<p>No hay observaciones para describir.</p>";
    $("hypotheses-panel").innerHTML = "<p>Amplía o restablece los filtros antes de formular hipótesis.</p>";
    $("next-step-panel").innerHTML = "<p>Restablece filtros o selecciona una combinación con datos.</p>";
    return;
  }
  const m = calculateMetrics(rows);
  const incidentGroups = groupBy(rows.filter((row) => row.tipo_incidente !== "Sin incidente"), "tipo_incidente")
    .map((g) => ({ label: g.label, value: g.rows.length })).sort((a, b) => b.value - a.value);
  const productClaims = groupBy(rows, "producto").map((g) => ({ label: g.label, value: g.rows.reduce((s, r) => s + r.reclamacion_mxn, 0) })).sort((a, b) => b.value - a.value);
  const routeGroups = groupBy(rows, "tipo_ruta").map((g) => ({ label: g.label, metrics: calculateMetrics(g.rows) }))
    .sort((a, b) => b.metrics.claims - a.metrics.claims || a.metrics.slaRate - b.metrics.slaRate);
  const leadIncident = incidentGroups[0];
  const leadClaims = productClaims[0];
  const pilot = routeGroups[0];
  $("facts-panel").innerHTML = `<ul>
    <li>${formatInt.format(m.shipments)} embarques tienen un SLA de ${m.slaRate.toFixed(1)}%, ${Math.abs(m.slaRate - TARGET_SLA).toFixed(1)} pp ${m.slaRate < TARGET_SLA ? "debajo" : "arriba"} de la meta.</li>
    <li>${leadIncident ? `${escapeHtml(leadIncident.label)} es el incidente más frecuente (${leadIncident.value}).` : "No hay incidentes registrados en este alcance."}</li>
    <li>${leadClaims ? `${escapeHtml(leadClaims.label)} concentra ${formatMoney.format(leadClaims.value)} en reclamaciones.` : "No hay reclamaciones."}</li>
  </ul>`;
  $("hypotheses-panel").innerHTML = `<ul>
    <li>La frecuencia de ${escapeHtml(leadIncident?.label || "incidentes")} podría asociarse con el incumplimiento; validar causa raíz y tiempos por etapa.</li>
    <li>El impacto en ${escapeHtml(leadClaims?.label || "productos")} podría reflejar exposición o severidad, no necesariamente peor operación; comparar valor de carga y kilómetros.</li>
  </ul>`;
  $("next-step-panel").innerHTML = `<ul>
    <li>Piloto de 30 días en rutas <strong>${escapeHtml(pilot.label)}</strong>: línea base SLA ${pilot.metrics.slaRate.toFixed(1)}%, retraso tardío ${pilot.metrics.lateDelayAvg?.toFixed(1) ?? "—"} min.</li>
    <li>Intervención: control de salida y ventana de entrega; responsable operativo y registro de causa por etapa.</li>
    <li>Éxito preliminar: +8 pp de SLA y −20% de retraso, sin elevar reclamaciones; contrastar con otra ruta antes de atribuir efecto.</li>
  </ul>`;
}

function searchedRows() {
  const query = state.search.trim().toLocaleLowerCase("es");
  return query ? state.filtered.filter((row) => row.id_embarque.toLocaleLowerCase("es").includes(query)) : state.filtered;
}

function renderTable() {
  const rows = searchedRows();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);
  $("detail-body").innerHTML = pageRows.length ? pageRows.map((row) => `<tr>
    <td>${escapeHtml(row.id_embarque)}</td><td>${escapeHtml(row.fecha_salida)}</td>
    <td>${escapeHtml(row.origen)} → ${escapeHtml(row.destino)}</td><td>${escapeHtml(row.producto)}</td>
    <td>${escapeHtml(row.transportista)}</td><td>${escapeHtml(row.tipo_ruta)}</td>
    <td><span class="status-pill ${row.sla_entrega === "Cumple" ? "ok" : "late"}">${escapeHtml(row.sla_entrega)}</span></td>
    <td>${row.retraso_min ? `${row.retraso_min.toFixed(0)} min` : "0 min"}</td><td>${escapeHtml(row.tipo_incidente)}</td>
    <td>${row.temperatura_max_c.toFixed(1)} °C</td><td>${formatMoney.format(row.reclamacion_mxn)}</td><td>${row.satisfaccion_1_10}/10</td>
  </tr>`).join("") : '<tr><td colspan="12">No hay embarques que coincidan con los filtros y la búsqueda.</td></tr>';
  $("table-count").textContent = `${formatInt.format(rows.length)} resultado${rows.length === 1 ? "" : "s"}`;
  $("page-status").textContent = `Página ${state.page} de ${pages}`;
  $("prev-page").disabled = state.page <= 1;
  $("next-page").disabled = state.page >= pages;
}

function renderStatus() {
  const count = Object.keys(activeFilters()).length;
  $("filter-status").textContent = `${state.filtered.length} de ${state.data.length} embarques · ${count} filtro${count === 1 ? "" : "s"} activo${count === 1 ? "" : "s"}`;
}

function renderAll() {
  renderStatus();
  renderKpis(state.filtered);
  renderCharts(state.filtered);
  renderInterpretation(state.filtered);
  renderTable();
}

function resetFilters() {
  FILTERS.forEach(([id]) => { $(id).value = ""; });
  state.search = "";
  $("table-search").value = "";
  filterData();
}

function downloadCsv() {
  const rows = searchedRows();
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [keys.map(quote).join(","), ...rows.map((row) => keys.map((key) => quote(row[key])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = "logifresh_filtrado.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  FILTERS.forEach(([id]) => $(id).addEventListener("change", filterData));
  $("reset-filters").addEventListener("click", resetFilters);
  $("segment-dimension").addEventListener("change", () => renderCharts(state.filtered));
  $("table-search").addEventListener("input", (event) => { state.search = event.target.value; state.page = 1; renderTable(); });
  $("prev-page").addEventListener("click", () => { state.page -= 1; renderTable(); });
  $("next-page").addEventListener("click", () => { state.page += 1; renderTable(); });
  $("download-csv").addEventListener("click", downloadCsv);
}

async function init() {
  try {
    const response = await fetch("./logifresh.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    state.filtered = [...state.data];
    populateFilters();
    bindEvents();
    renderAll();
    window.__LOGIFRESH__ = {
      calculateMetrics,
      getState: () => ({ rows: state.filtered.length, filters: activeFilters(), metrics: calculateMetrics(state.filtered) }),
      resetFilters,
    };
  } catch (error) {
    console.error(error);
    $("load-error").hidden = false;
    $("filter-status").textContent = "Datos no disponibles";
    renderKpis([]);
    renderCharts([]);
    renderInterpretation([]);
    renderTable();
  }
}

init();
