<?php
/**
 * buscarClientes.php
 *
 * Script backend para la búsqueda y validación de clientes por número de tarjeta.
 *
 * Funcionalidad principal:
 * - Búsqueda de clientes por número de tarjeta
 * - Manejo de respuestas JSON para frontend
 */
require_once "../conexion/conexion.php";
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $debug_file = __DIR__ . "/debug.log";
    file_put_contents($debug_file, "------------------------\n", FILE_APPEND);
    // Log de depuración eliminado para producción

    $num_tarjeta = $_POST['num_tarjeta'] ?? '';
    if (!$num_tarjeta) {
        file_put_contents($debug_file, "Falta num_tarjeta\n", FILE_APPEND);
        echo json_encode(['success' => false, 'message' => 'Número de tarjeta requerido']);
        exit;
    }

    $num_tarjeta = trim($num_tarjeta);
    file_put_contents($debug_file, "Número recibido: $num_tarjeta\n", FILE_APPEND);

    try {
        $stmt = $conexion->prepare(
            "SELECT num_tarjeta, cedula, nombre, fecha_cumpleanos, telefono, lugar_origen, fecha_entrega_tarjeta, alergias, gustos_especiales
             FROM clientes_vip
             WHERE num_tarjeta = ?"
        );
        $stmt->bind_param("i", $num_tarjeta);
        $stmt->execute();
        $result = $stmt->get_result();
        $cliente = $result->fetch_assoc();

    // Log de depuración eliminado para producción

        if ($cliente) {
            echo json_encode(['success' => true, 'data' => $cliente]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Cliente no encontrado']);
        }

        $stmt->close();
    } catch (Exception $e) {
        file_put_contents($debug_file, "ERROR EXCEPTION: " . $e->getMessage(), FILE_APPEND);
        echo json_encode(['success' => false, 'message' => 'Error en la consulta']);
    }

    $conexion->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
