<?php
/**
 * chart-data.php
 *
 * Script backend para la obtención de datos de gráficos de ganancias.
 *
 * Funcionalidad principal:
 * - Proveer datos de ganancias por día, semana o mes
 * - Manejo de respuestas JSON para frontend
 */
session_start();
require_once '../conexion/conexion.php';

header('Content-Type: application/json');

try {
    if (!$conexion) {
        throw new Exception("Error de conexión a la base de datos");
    }

    $period = $_GET['period'] ?? 'day';
    $response = [];

    switch ($period) {
        case 'day':
            // Ganancias por día de los últimos 7 días (más detallado que 'week')
            $sql = "SELECT 
                        DATE(fecha_compra) as fecha,
                        COALESCE(SUM(monto), 0) as total
                    FROM compras 
                    WHERE fecha_compra >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    GROUP BY DATE(fecha_compra)
                    ORDER BY fecha";
            
            $result = mysqli_query($conexion, $sql);
            $labels = [];
            $data = [];
            
            // Inicializar últimos 7 días
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i day"));
                $labels[] = date('d/m', strtotime($date));
                $data[] = 0;
            }
            
            if ($result) {
                while ($row = mysqli_fetch_assoc($result)) {
                    $date = $row['fecha'];
                    $dayIndex = array_search(date('d/m', strtotime($date)), $labels);
                    if ($dayIndex !== false) {
                        $data[$dayIndex] = (float)$row['total'];
                    }
                }
            }
            
            $response = [
                'labels' => $labels,
                'data' => $data,
                'title' => 'Ganancias por Día - Últimos 7 días'
            ];
            break;

        case 'week':
            // Ganancias por semana (últimas 4 semanas - simplificado)
            $sql = "SELECT 
                        WEEK(fecha_compra, 1) as semana_num,
                        YEAR(fecha_compra) as año,
                        COALESCE(SUM(monto), 0) as total,
                        DATE_FORMAT(MIN(fecha_compra), '%d/%m') as inicio,
                        DATE_FORMAT(MAX(fecha_compra), '%d/%m') as fin
                    FROM compras 
                    WHERE fecha_compra >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
                    GROUP BY YEAR(fecha_compra), WEEK(fecha_compra, 1)
                    ORDER BY año, semana_num";
            
            $result = mysqli_query($conexion, $sql);
            $labels = [];
            $data = [];
            
            if ($result && mysqli_num_rows($result) > 0) {
                while ($row = mysqli_fetch_assoc($result)) {
                    $labels[] = "Sem " . $row['semana_num'] . " (" . $row['inicio'] . " - " . $row['fin'] . ")";
                    $data[] = (float)$row['total'];
                }
            } else {
                // Si no hay datos, mostrar semanas vacías
                for ($i = 3; $i >= 0; $i--) {
                    $week_start = date('d/m', strtotime("-" . ($i * 7 + 6) . " days"));
                    $week_end = date('d/m', strtotime("-" . ($i * 7) . " days"));
                    $week_num = date('W', strtotime("-" . ($i * 7) . " days"));
                    $labels[] = "Sem $week_num ($week_start - $week_end)";
                    $data[] = 0;
                }
            }
            
            $response = [
                'labels' => $labels,
                'data' => $data,
                'title' => 'Ganancias por Semana - Últimas 4 semanas'
            ];
            break;

        case 'month':
            // Ganancias por día del mes actual
            $sql = "SELECT 
                        DAY(fecha_compra) as dia,
                        COALESCE(SUM(monto), 0) as total
                    FROM compras 
                    WHERE MONTH(fecha_compra) = MONTH(CURDATE()) 
                    AND YEAR(fecha_compra) = YEAR(CURDATE())
                    GROUP BY DAY(fecha_compra)
                    ORDER BY dia";
            
            $result = mysqli_query($conexion, $sql);
            $labels = [];
            $data = [];
            
            // Inicializar días del mes actual
            $daysInMonth = date('t'); // Número de días en el mes actual
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $labels[] = $i;
                $data[] = 0;
            }
            
            if ($result) {
                while ($row = mysqli_fetch_assoc($result)) {
                    $day = (int)$row['dia'];
                    $data[$day - 1] = (float)$row['total']; // -1 porque el array empieza en 0
                }
            }
            
            $response = [
                'labels' => $labels,
                'data' => $data,
                'title' => 'Ganancias por Día - ' . date('F Y')
            ];
            break;

        default:
            throw new Exception("Período no válido");
    }

    echo json_encode([
        'success' => true,
        'chart' => $response
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
