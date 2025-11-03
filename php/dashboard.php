<?php
/**
 * dashboard.php
 *
 * Script backend para la obtención de estadísticas y datos del dashboard principal.
 *
 * Funcionalidad principal:
 * - Proveer datos de clientes, cumpleaños, ganancias y clientes frecuentes
 * - Manejo de respuestas JSON para frontend
 */
session_start();
require_once '../conexion/conexion.php';

header('Content-Type: application/json');

try {
    // Verificar conexión
    if (!$conexion) {
        throw new Exception("Error de conexión a la base de datos");
    }

    $response = [];

    // 1. Clientes nuevos (últimos 30 días - usando fecha_entrega_tarjeta)
    $sqlNewClients = "SELECT COUNT(*) as count FROM clientes_vip 
                     WHERE fecha_entrega_tarjeta >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                     AND fecha_entrega_tarjeta IS NOT NULL";
    $resultNewClients = mysqli_query($conexion, $sqlNewClients);
    if ($resultNewClients) {
        $newClientsData = mysqli_fetch_assoc($resultNewClients);
        $response['newClients'] = $newClientsData['count'];
    } else {
        $response['newClients'] = 0;
    }

    // 2. Próximos cumpleaños (hoy + próximos 7 días) - formato dd/mm
    $today_dm = date('d/m');        // Formato día/mes como 04/08
    $tomorrow_dm = date('d/m', strtotime('+1 day')); // 05/08
    
    // Generar rango de 7 días en formato dd/mm
    $next_days = [];
    for ($i = 0; $i <= 7; $i++) {
        $next_days[] = "'" . date('d/m', strtotime("+$i day")) . "'";
    }
    $days_range = implode(',', $next_days);
    
    $sqlBirthdays = "SELECT COUNT(*) as count FROM clientes_vip 
                     WHERE fecha_cumpleanos IN ($days_range)";
    $resultBirthdays = mysqli_query($conexion, $sqlBirthdays);
    if ($resultBirthdays) {
        $birthdaysData = mysqli_fetch_assoc($resultBirthdays);
        $response['upcomingBirthdays'] = $birthdaysData['count'];
    } else {
        $response['upcomingBirthdays'] = 0;
    }

    // 3. Clientes frecuentes (basado en compras - más de 3 compras)
    $sqlFrequentClients = "SELECT COUNT(DISTINCT cedula_cliente) as count 
                          FROM (SELECT cedula_cliente, COUNT(*) as total_compras 
                                FROM compras 
                                GROUP BY cedula_cliente 
                                HAVING total_compras > 3) as frequent_clients";
    $resultFrequentClients = mysqli_query($conexion, $sqlFrequentClients);
    if ($resultFrequentClients) {
        $frequentClientsData = mysqli_fetch_assoc($resultFrequentClients);
        $response['frequentClients'] = $frequentClientsData['count'];
    } else {
        $response['frequentClients'] = 0;
    }

    // 4. Ganancias diarias, semanales y mensuales (tabla compras)
    
    // Ganancias de hoy (si no hay, tomar el último día con actividad)
    $sqlDailyEarnings = "SELECT COALESCE(SUM(monto), 0) as total FROM compras 
                        WHERE DATE(fecha_compra) = CURDATE()";
    $resultDailyEarnings = mysqli_query($conexion, $sqlDailyEarnings);
    $dailyTotal = 0;
    if ($resultDailyEarnings) {
        $earningsData = mysqli_fetch_assoc($resultDailyEarnings);
        $dailyTotal = $earningsData['total'];
    }
    
    // Si no hay ganancias hoy, buscar el último día con actividad
    if ($dailyTotal == 0) {
        $sqlLastActiveDay = "SELECT DATE(fecha_compra) as fecha, COALESCE(SUM(monto), 0) as total 
                            FROM compras 
                            GROUP BY DATE(fecha_compra) 
                            ORDER BY fecha DESC LIMIT 1";
        $resultLastActive = mysqli_query($conexion, $sqlLastActiveDay);
        if ($resultLastActive && mysqli_num_rows($resultLastActive) > 0) {
            $lastActiveData = mysqli_fetch_assoc($resultLastActive);
            $response['dailyEarnings'] = number_format($lastActiveData['total'], 0);
        } else {
            $response['dailyEarnings'] = '0';
        }
    } else {
        $response['dailyEarnings'] = number_format($dailyTotal, 0);
    }
    
    // Ganancias de la semana (últimos 7 días)
    $sqlWeeklyEarnings = "SELECT COALESCE(SUM(monto), 0) as total FROM compras 
                         WHERE fecha_compra >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $resultWeeklyEarnings = mysqli_query($conexion, $sqlWeeklyEarnings);
    if ($resultWeeklyEarnings) {
        $earningsData = mysqli_fetch_assoc($resultWeeklyEarnings);
        $response['weeklyEarnings'] = number_format($earningsData['total'], 0);
    } else {
        $response['weeklyEarnings'] = '0';
    }
    
    // Ganancias del mes actual
    $sqlMonthlyEarnings = "SELECT COALESCE(SUM(monto), 0) as total FROM compras 
                          WHERE MONTH(fecha_compra) = MONTH(CURDATE()) AND YEAR(fecha_compra) = YEAR(CURDATE())";
    $resultMonthlyEarnings = mysqli_query($conexion, $sqlMonthlyEarnings);
    if ($resultMonthlyEarnings) {
        $earningsData = mysqli_fetch_assoc($resultMonthlyEarnings);
        $response['monthlyEarnings'] = number_format($earningsData['total'], 0);
    } else {
        $response['monthlyEarnings'] = '0';
    }

    // 5. Lista de clientes nuevos (últimos 30 días - tabla clientes_vip)
    $sqlNewClientsList = "SELECT nombre, fecha_entrega_tarjeta FROM clientes_vip 
                         WHERE fecha_entrega_tarjeta >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                         AND fecha_entrega_tarjeta IS NOT NULL
                         ORDER BY fecha_entrega_tarjeta DESC LIMIT 5";
    $resultNewClientsList = mysqli_query($conexion, $sqlNewClientsList);
    $newClientsList = [];
    if ($resultNewClientsList) {
        while ($row = mysqli_fetch_assoc($resultNewClientsList)) {
            $newClientsList[] = [
                'nombre' => $row['nombre'],
                'fecha' => date('d/m/Y', strtotime($row['fecha_entrega_tarjeta']))
            ];
        }
    }
    // Si no hay datos con fecha_entrega_tarjeta, usar los más recientes por cedula
    if (empty($newClientsList)) {
        $sqlNewClientsList = "SELECT nombre, 'Reciente' as fecha FROM clientes_vip 
                             ORDER BY cedula DESC LIMIT 5";
        $resultNewClientsList = mysqli_query($conexion, $sqlNewClientsList);
        if ($resultNewClientsList) {
            while ($row = mysqli_fetch_assoc($resultNewClientsList)) {
                $newClientsList[] = [
                    'nombre' => $row['nombre'],
                    'fecha' => 'Cliente registrado'
                ];
            }
        }
    }
    $response['newClientsList'] = $newClientsList;

    // 6. Lista de próximos cumpleaños (formato dd/mm)
    $today_dm = date('d/m');
    $tomorrow_dm = date('d/m', strtotime('+1 day'));
    
    // Generar rango de 7 días en formato dd/mm
    $next_days = [];
    for ($i = 0; $i <= 7; $i++) {
        $next_days[] = "'" . date('d/m', strtotime("+$i day")) . "'";
    }
    $days_range = implode(',', $next_days);
    
    $sqlBirthdaysList = "SELECT nombre, fecha_cumpleanos, telefono FROM clientes_vip 
                        WHERE fecha_cumpleanos IN ($days_range)
                        ORDER BY 
                        CASE 
                            WHEN fecha_cumpleanos = '$today_dm' THEN 1
                            WHEN fecha_cumpleanos = '$tomorrow_dm' THEN 2
                            ELSE 3
                        END
                        LIMIT 5";
    $resultBirthdaysList = mysqli_query($conexion, $sqlBirthdaysList);
    $birthdaysList = [];
    if ($resultBirthdaysList) {
        while ($row = mysqli_fetch_assoc($resultBirthdaysList)) {
            $birthday = $row['fecha_cumpleanos']; // Ya está en formato dd/mm
            
            if ($birthday == $today_dm) {
                $displayDate = 'Hoy 🎂';
            } elseif ($birthday == $tomorrow_dm) {
                $displayDate = 'Mañana 🎉';
            } else {
                $displayDate = $birthday; // Mostrar fecha tal como está (dd/mm)
            }
            
            $birthdaysList[] = [
                'nombre' => $row['nombre'],
                'fecha' => $displayDate,
                'telefono' => $row['telefono']
            ];
        }
    }
    // Si no hay cumpleaños próximos, agregar mensaje
    if (empty($birthdaysList)) {
        $birthdaysList = [
            ['nombre' => 'No hay cumpleaños', 'fecha' => 'próximos']
        ];
    }
    $response['birthdaysList'] = $birthdaysList;

    // 7. Lista de clientes frecuentes (más de 3 compras)
    $sqlFrequentClientsList = "SELECT cv.nombre, COUNT(c.id_compra) as total_compras, SUM(c.monto) as total_gastado
                              FROM clientes_vip cv 
                              INNER JOIN compras c ON cv.cedula = c.cedula_cliente 
                              GROUP BY cv.cedula, cv.nombre 
                              HAVING total_compras > 3
                              ORDER BY total_compras DESC, total_gastado DESC LIMIT 5";
    $resultFrequentClientsList = mysqli_query($conexion, $sqlFrequentClientsList);
    $frequentClientsList = [];
    if ($resultFrequentClientsList) {
        while ($row = mysqli_fetch_assoc($resultFrequentClientsList)) {
            $comprasText = $row['total_compras'] == 1 ? 'compra' : 'compras';
            $frequentClientsList[] = [
                'nombre' => $row['nombre'],
                'compras' => $row['total_compras'] . ' ' . $comprasText . ' (₡' . number_format($row['total_gastado'], 0) . ')'
            ];
        }
    }
    // Si no hay clientes con compras, mostrar mensaje
    if (empty($frequentClientsList)) {
        $frequentClientsList = [
            ['nombre' => 'No hay clientes', 'compras' => 'con compras registradas']
        ];
    }
    $response['frequentClientsList'] = $frequentClientsList;

    // 8. Establecer éxito
    $response['success'] = true;
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

if (isset($conexion)) {
    mysqli_close($conexion);
}
?>
