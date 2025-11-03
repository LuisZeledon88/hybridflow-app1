<?php
// php/historialVentas.php
// Devuelve el historial de ventas desde la última compra registrada
header('Content-Type: application/json');
require_once '../conexion/conexion.php';


// Historial completo
$sqlHistorial = "SELECT c.fecha_compra AS fecha, cv.nombre AS cliente, c.monto FROM compras c LEFT JOIN clientes_vip cv ON c.cedula_cliente = cv.cedula ORDER BY c.fecha_compra DESC";
$ventas = [];
$result = $conexion->query($sqlHistorial);
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $ventas[] = $row;
    }
}


// Ventas agrupadas por día
$dias = [];
$resultDias = $conexion->query("SELECT DATE(fecha_compra) AS dia, SUM(monto) AS total FROM compras GROUP BY dia ORDER BY dia ASC");
if ($resultDias && $resultDias->num_rows > 0) {
    while ($row = $resultDias->fetch_assoc()) {
        $dias[] = $row;
    }
}

// Ventas agrupadas por semana
$semanas = [];
$resultSemanas = $conexion->query("SELECT YEAR(fecha_compra) AS anio, WEEK(fecha_compra, 1) AS semana, SUM(monto) AS total FROM compras GROUP BY anio, semana ORDER BY anio ASC, semana ASC");
if ($resultSemanas && $resultSemanas->num_rows > 0) {
    while ($row = $resultSemanas->fetch_assoc()) {
        $semanas[] = $row;
    }
}

// Ventas agrupadas por año
$anios = [];
$resultAnios = $conexion->query("SELECT YEAR(fecha_compra) AS anio, SUM(monto) AS total FROM compras GROUP BY anio ORDER BY anio ASC");
if ($resultAnios && $resultAnios->num_rows > 0) {
    while ($row = $resultAnios->fetch_assoc()) {
        $anios[] = $row;
    }
}

// Totales actuales

$sqlMes = "SELECT COALESCE(SUM(monto),0) AS total FROM compras WHERE MONTH(fecha_compra) = MONTH(CURDATE()) AND YEAR(fecha_compra) = YEAR(CURDATE())";
$totalMes = $conexion->query($sqlMes)->fetch_assoc()['total'];
$sqlDia = "SELECT COALESCE(SUM(monto),0) AS total FROM compras WHERE DATE(fecha_compra) = CURDATE()";
$sqlSemana = "SELECT COALESCE(SUM(monto),0) AS total FROM compras WHERE YEARWEEK(fecha_compra, 1) = YEARWEEK(CURDATE(), 1)";
$sqlAnio = "SELECT COALESCE(SUM(monto),0) AS total FROM compras WHERE YEAR(fecha_compra) = YEAR(CURDATE())";
$totalDia = $conexion->query($sqlDia)->fetch_assoc()['total'];
$totalSemana = $conexion->query($sqlSemana)->fetch_assoc()['total'];
$totalAnio = $conexion->query($sqlAnio)->fetch_assoc()['total'];

echo json_encode([
    'historial' => $ventas,
    'totales' => [
        'dia' => $totalDia,
        'mes' => $totalMes,
        'semana' => $totalSemana,
        'anio' => $totalAnio
    ],
    'resumen' => [
        'dias' => $dias,
        'semanas' => $semanas,
        'anios' => $anios
    ]
]);
?>
