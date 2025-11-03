// js/HistorialVentas.js
// Script para cargar y mostrar el historial de ventas

document.addEventListener('DOMContentLoaded', function() {
    fetch('php/historialVentas.php')
        .then(response => response.json())
        .then(data => {
            // Análisis de ventas actual
            const analisis = data.totales;
            const analisisDiv = document.getElementById('analisisVentas');
            analisisDiv.innerHTML = `
                <div class="analisis-cards-flex">
                    <div class="analisis-card card-dia">
                        <i class="fas fa-calendar-day"></i>
                        <div><span>Hoy</span></div>
                        <div class="analisis-monto">₡${parseFloat(analisis.dia).toLocaleString('es-CR')}</div>
                    </div>
                    <div class="analisis-card card-mes">
                        <i class="fas fa-calendar-alt"></i>
                        <div><span>Mes</span></div>
                        <div class="analisis-monto">₡${parseFloat(analisis.mes).toLocaleString('es-CR')}</div>
                    </div>
                    <div class="analisis-card card-anio">
                        <i class="fas fa-calendar"></i>
                        <div><span>Año</span></div>
                        <div class="analisis-monto">₡${parseFloat(analisis.anio).toLocaleString('es-CR')}</div>
                    </div>
                </div>
            `;

            // Resumen por día, semana y año en el contenedor adecuado
            let resumenHtml = '<div class="resumen-ventas">';
            resumenHtml += '<h3>Ventas por Día</h3><table class="ventas-table"><thead><tr><th>Fecha</th><th>Total</th></tr></thead><tbody>';
            data.resumen.dias.forEach(dia => {
                resumenHtml += `<tr><td>${dia.dia}</td><td>₡${parseFloat(dia.total).toLocaleString('es-CR')}</td></tr>`;
            });
            resumenHtml += '</tbody></table>';

            resumenHtml += '<h3>Ventas por Semana</h3><table class="ventas-table"><thead><tr><th>Año</th><th>Semana</th><th>Total</th></tr></thead><tbody>';
            data.resumen.semanas.forEach(semana => {
                resumenHtml += `<tr><td>${semana.anio}</td><td>${semana.semana}</td><td>₡${parseFloat(semana.total).toLocaleString('es-CR')}</td></tr>`;
            });
            resumenHtml += '</tbody></table>';

            resumenHtml += '<h3>Ventas por Año</h3><table class="ventas-table"><thead><tr><th>Año</th><th>Total</th></tr></thead><tbody>';
            data.resumen.anios.forEach(anio => {
                resumenHtml += `<tr><td>${anio.anio}</td><td>₡${parseFloat(anio.total).toLocaleString('es-CR')}</td></tr>`;
            });
            resumenHtml += '</tbody></table>';
            resumenHtml += '</div>';

            document.getElementById('resumenVentasContainer').innerHTML = resumenHtml;

            // Historial de ventas
            const ventas = data.historial;
            const contenedor = document.getElementById('ventasEstadisticas');
            if (!Array.isArray(ventas) || ventas.length === 0) {
                contenedor.innerHTML = '<p>No hay ventas registradas.</p>';
                return;
            }
            let html = '<table class="ventas-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Monto</th></tr></thead><tbody>';
            ventas.forEach(venta => {
                html += `<tr><td>${venta.fecha}</td><td>${venta.cliente || ''}</td><td>₡${parseFloat(venta.monto).toLocaleString('es-CR')}</td></tr>`;
            });
            html += '</tbody></table>';
            contenedor.innerHTML = html;
        })
        .catch(err => {
            document.getElementById('ventasEstadisticas').innerHTML = '<p>Error al cargar el historial de ventas.</p>';
        });
});
