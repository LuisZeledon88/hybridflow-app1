<?php
/**
 * compras.php
 *
 * Script backend para la gestión de compras asociadas a clientes VIP.
 *
 * Funcionalidad principal:
 * - Registro, edición y eliminación de compras
 * - Manejo de respuestas JSON para frontend
 */
require_once '../conexion/conexion.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'crear') {
        $cedula_cliente = $_POST['cedula_cliente'] ?? '';
        $monto = $_POST['monto'] ?? 0;
        $fecha_compra = $_POST['fecha_compra'] ?? date('Y-m-d');

        if (!$cedula_cliente || !$monto || !$fecha_compra) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos.']);
            exit;
        }

        $stmt = $conexion->prepare("INSERT INTO compras (cedula_cliente, monto, fecha_compra) VALUES (?, ?, ?)");
        $stmt->bind_param("sds", $cedula_cliente, $monto, $fecha_compra);
        $success = $stmt->execute();

        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Compra registrada correctamente' : 'Error al registrar: ' . $stmt->error
        ]);
        $stmt->close();
    } elseif ($action === 'editar') {
        $id_compra = $_POST['id_compra'] ?? '';
        $monto = $_POST['monto'] ?? 0;
        $fecha_compra = $_POST['fecha_compra'] ?? '';

        if (!$id_compra || !$monto || !$fecha_compra) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos para editar.']);
            exit;
        }

        $stmt = $conexion->prepare("UPDATE compras SET monto = ?, fecha_compra = ? WHERE id_compra = ?");
        $stmt->bind_param("dsi", $monto, $fecha_compra, $id_compra);
        $success = $stmt->execute();

        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Compra actualizada correctamente' : 'Error al editar: ' . $stmt->error
        ]);
        $stmt->close();
    } elseif ($action === 'eliminar') {
        $id_compra = $_POST['id_compra'] ?? '';

        if (!$id_compra) {
            echo json_encode(['success' => false, 'message' => 'ID de compra requerido.']);
            exit;
        }

        $stmt = $conexion->prepare("DELETE FROM compras WHERE id_compra = ?");
        $stmt->bind_param("i", $id_compra);
        $success = $stmt->execute();

        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Compra eliminada correctamente' : 'Error al eliminar: ' . $stmt->error
        ]);
        $stmt->close();
    } elseif ($action === 'ver') {
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
    } else {
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }

    $conexion->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
