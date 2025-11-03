<?php
/**
 * vercompras.php
 *
 * Script backend para consultar el historial de compras de un cliente VIP.
 *
 * Funcionalidad principal:
 * - Consulta de compras por cédula de cliente
 * - Cálculo del total gastado
 * - Manejo de respuestas JSON para frontend
 *
 * @author Bastos
 * @date 2025-08-20
 */

require_once '../conexion/conexion.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cedula = $_POST['cedula'] ?? '';

    if (!$cedula) {
        echo json_encode(['success' => false, 'message' => 'Cédula requerida']);
        exit;
    }

    $stmt = $conexion->prepare("SELECT id_compra, monto, fecha_compra FROM compras WHERE cedula_cliente = ? ORDER BY fecha_compra DESC");
    $stmt->bind_param("s", $cedula);
    $stmt->execute();
    $result = $stmt->get_result();

    $compras = [];
    $total = 0;

    while ($row = $result->fetch_assoc()) {
        $compras[] = $row;
        $total += floatval($row['monto']);
    }

    echo json_encode(['success' => true, 'compras' => $compras, 'total' => $total]);
    $stmt->close();
    $conexion->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>