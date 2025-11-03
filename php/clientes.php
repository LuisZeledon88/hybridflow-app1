<?php
/**
 * clientes.php
 *
 * Script backend para la gestión de clientes y tarjetas VIP.
 * Incluye registro, reasignación y consulta de clientes.
 *
 * Funcionalidad principal:
 * - Registro y reasignación de tarjetas VIP
 * - Consulta y validación de clientes
 * - Manejo de respuestas JSON para frontend
 */
require_once "../conexion/conexion.php";
header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => []];

// Debug temporal
error_log("=== DEBUG CLIENTES.PHP ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);
// Log de depuración eliminado para producción

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? limpiarCadena($_POST['action']) : '';
    error_log("Action: " . $action);

    if ($action === 'registrar_cliente') {
        error_log("Procesando registrar_cliente");
        
        // Manejar diferencias entre cliente interno y externo
        $num_tarjeta = isset($_POST['num_tarjeta']) ? limpiarCadena($_POST['num_tarjeta']) : null;
        $cedula = limpiarCadena($_POST['cedula']);
        $nombre = limpiarCadena($_POST['nombre']);
        $fecha_cumpleanos = limpiarCadena($_POST['fecha_cumpleanos']);
        $telefono = limpiarCadena($_POST['telefono']);
        $lugar_origen = limpiarCadena($_POST['lugar_origen']);
        $fecha_entrega_tarjeta = isset($_POST['fecha_entrega_tarjeta']) ? limpiarCadena($_POST['fecha_entrega_tarjeta']) : date('Y-m-d');
        $alergias = limpiarCadena($_POST['alergias'] ?? '');
        $gustos_especiales = limpiarCadena($_POST['gustos_especiales'] ?? '');

        // Si es cliente externo (sin num_tarjeta), generar uno automáticamente
        if (empty($num_tarjeta)) {
            // Buscar el número de tarjeta más alto que sea numérico
            $sql_max = "SELECT MAX(CAST(num_tarjeta AS UNSIGNED)) as max_tarjeta FROM clientes_vip WHERE num_tarjeta REGEXP '^[0-9]+$'";
            $result_max = ejecutarConsultaSimpleFila($sql_max);
            $next_number = ($result_max && $result_max['max_tarjeta']) ? $result_max['max_tarjeta'] + 1 : 1;
            $num_tarjeta = strval($next_number);
            
            error_log("Número de tarjeta generado automáticamente: $num_tarjeta");
        }

        error_log("Datos procesados: num_tarjeta=$num_tarjeta, cedula=$cedula, nombre=$nombre, alergias=$alergias");

        // Verificar si ya existe por cédula únicamente (para evitar duplicados)
        $sql_check = "SELECT cedula FROM clientes_vip WHERE cedula = '$cedula'";
        if (!empty($_POST['num_tarjeta'])) {
            // Solo verificar número de tarjeta si viene del formulario interno
            $sql_check = "SELECT cedula FROM clientes_vip WHERE cedula = '$cedula' OR num_tarjeta = '" . limpiarCadena($_POST['num_tarjeta']) . "'";
        }
        
        error_log("SQL Check: " . $sql_check);
        
        $result = ejecutarConsultaSimpleFila($sql_check);
    // Log de depuración eliminado para producción

        if ($result) {
            $response['message'] = 'Ya existe un cliente con esa cédula' . (isset($_POST['num_tarjeta']) ? ' o número de tarjeta' : '');
            error_log("Cliente ya existe");
        } else {
            $sql = "INSERT INTO clientes_vip 
                    (num_tarjeta, cedula, nombre, fecha_cumpleanos, telefono, lugar_origen, fecha_entrega_tarjeta, alergias, gustos_especiales)
                    VALUES 
                    ('$num_tarjeta', '$cedula', '$nombre', '$fecha_cumpleanos', '$telefono', '$lugar_origen', '$fecha_entrega_tarjeta', '$alergias', '$gustos_especiales')";
            
            error_log("SQL Insert: " . $sql);
            
            if (ejecutarConsulta($sql)) {
                $response['success'] = true;
                $response['message'] = 'Cliente registrado correctamente';
                $response['id'] = $cedula;
                $response['num_tarjeta'] = $num_tarjeta; // Incluir número de tarjeta generado
                // Log de depuración eliminado para producción
            } else {
                global $conexion;
                $error = $conexion ? $conexion->error : "Error de conexión desconocido";
                $response['message'] = 'Error al registrar el cliente: ' . $error;
                error_log("Error al registrar: " . $error);
            }
        }
    } 
    elseif ($action === 'actualizar_cliente') {
        $num_tarjeta = limpiarCadena($_POST['num_tarjeta']);
        $cedula = limpiarCadena($_POST['cedula']);
        $nombre = limpiarCadena($_POST['nombre']);
        $fecha_cumpleanos = limpiarCadena($_POST['fecha_cumpleanos']);
        $telefono = limpiarCadena($_POST['telefono']);
        $lugar_origen = limpiarCadena($_POST['lugar_origen']);
        $fecha_entrega_tarjeta = limpiarCadena($_POST['fecha_entrega_tarjeta']);
        $alergias = limpiarCadena($_POST['alergias'] ?? '');
        $gustos_especiales = limpiarCadena($_POST['gustos_especiales'] ?? '');

        // Verificar si el número de tarjeta ya está asignado a otro cliente
        $sql_check = "SELECT cedula FROM clientes_vip WHERE num_tarjeta = '$num_tarjeta' AND cedula != '$cedula'";
        $result = ejecutarConsultaSimpleFila($sql_check);

        if ($result) {
            $response['message'] = 'El número de tarjeta ya está asignado a otro cliente';
        } else {
            $sql = "UPDATE clientes_vip 
                    SET num_tarjeta = '$num_tarjeta', nombre = '$nombre', fecha_cumpleanos = '$fecha_cumpleanos', 
                        telefono = '$telefono', lugar_origen = '$lugar_origen', 
                        fecha_entrega_tarjeta = '$fecha_entrega_tarjeta', alergias = '$alergias', gustos_especiales = '$gustos_especiales'
                    WHERE cedula = '$cedula'";

            if (ejecutarConsulta($sql)) {
                $response['success'] = true;
                $response['message'] = 'Cliente actualizado correctamente';
            } else {
                $response['message'] = 'Error al actualizar el cliente: ' . $conexion->error;
            }
        }
    }
    elseif ($action === 'reasignar_tarjeta') {
        error_log("Procesando reasignar_tarjeta");
        
        $cedula = limpiarCadena($_POST['cedula']);
        $tarjeta_anterior = limpiarCadena($_POST['tarjeta_anterior']);
        $tarjeta_nueva = limpiarCadena($_POST['tarjeta_nueva']);
        $motivo = limpiarCadena($_POST['motivo']);

        error_log("Datos reasignación: cedula=$cedula, anterior=$tarjeta_anterior, nueva=$tarjeta_nueva, motivo=$motivo");

        // Iniciar transacción
        $conexion->begin_transaction();

        try {
            // 1. Actualizar la tarjeta en clientes_vip
            $sql_update = "UPDATE clientes_vip SET num_tarjeta = '$tarjeta_nueva' WHERE cedula = '$cedula'";
            error_log("SQL Update: " . $sql_update);
            
            if (!ejecutarConsulta($sql_update)) {
                throw new Exception("Error al actualizar la tarjeta: " . $conexion->error);
            }

            // 2. Registrar en el historial de cambios
            $sql_historial = "INSERT INTO historial_cambios_tarjeta 
                             (cedula_cliente, tarjeta_anterior, tarjeta_nueva, motivo_cambio, fecha_cambio)
                             VALUES ('$cedula', '$tarjeta_anterior', '$tarjeta_nueva', '$motivo', NOW())";
            
            error_log("SQL Historial: " . $sql_historial);
            
            if (!ejecutarConsulta($sql_historial)) {
                throw new Exception("Error al registrar en historial: " . $conexion->error);
            }

            // Confirmar transacción
            $conexion->commit();
            
            $response['success'] = true;
            $response['message'] = 'Tarjeta reasignada correctamente';
            // Log de depuración eliminado para producción
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conexion->rollback();
            $response['message'] = $e->getMessage();
            error_log("Error en reasignación: " . $e->getMessage());
        }
    }
    elseif ($action === 'registrar_compra') {
        $cedula_cliente = limpiarCadena($_POST['cedula_cliente']);
        $monto = limpiarCadena($_POST['monto']);
        $fecha_compra = limpiarCadena($_POST['fecha_compra']);

        $sql_check = "SELECT cedula FROM clientes_vip WHERE cedula = '$cedula_cliente'";
        $result = ejecutarConsultaSimpleFila($sql_check);

        if (!$result) {
            $response['message'] = 'El cliente no existe';
        } else {
            $sql = "INSERT INTO compras (cedula_cliente, monto, fecha_compra)
                    VALUES ('$cedula_cliente', '$monto', '$fecha_compra')";

            if (ejecutarConsulta($sql)) {
                $response['success'] = true;
                $response['message'] = 'Compra registrada correctamente';
                $response['id'] = $conexion->insert_id;
            } else {
                $response['message'] = 'Error al registrar la compra: ' . $conexion->error;
            }
        }
    } 
    elseif ($action === 'eliminar_cliente') {
        $cedula = limpiarCadena($_POST['cedula']);
        $sql = "DELETE FROM clientes_vip WHERE cedula = '$cedula'";

        if (ejecutarConsulta($sql)) {
            $response['success'] = true;
            $response['message'] = 'Cliente eliminado correctamente';
        } else {
            $response['message'] = 'Error al eliminar el cliente: ' . $conexion->error;
        }
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? limpiarCadena($_GET['action']) : '';

    if ($action === 'obtener_clientes') {
        $sql = "SELECT * FROM clientes_vip";
        $query = ejecutarConsulta($sql);

        if ($query) {
            while ($row = $query->fetch_assoc()) {
                $response['data'][] = $row;
            }
            $response['success'] = true;
        } else {
            $response['message'] = 'Error al obtener los clientes: ' . $conexion->error;
        }
    } 
    elseif ($action === 'obtener_cliente') {
        $cedula = isset($_GET['cedula']) ? limpiarCadena($_GET['cedula']) : '';
        if (empty($cedula)) {
            $response['message'] = 'Cédula no proporcionada';
        } else {
            $sql = "SELECT num_tarjeta, cedula, nombre, fecha_cumpleanos, telefono, lugar_origen, fecha_entrega_tarjeta, alergias, gustos_especiales 
                    FROM clientes_vip WHERE cedula = '$cedula'";
            $result = ejecutarConsultaSimpleFila($sql);

            if ($result) {
                $response['success'] = true;
                $response['data'] = $result;
            } else {
                $response['message'] = 'Cliente no encontrado: ' . $conexion->error;
            }
        }
    }
    elseif ($action === 'verificar_tarjeta') {
        $numero = isset($_GET['numero']) ? limpiarCadena($_GET['numero']) : '';
        
        if (empty($numero)) {
            $response['message'] = 'Número de tarjeta no proporcionado';
        } else {
            $sql = "SELECT COUNT(*) as count FROM clientes_vip WHERE num_tarjeta = '$numero'";
            $result = ejecutarConsultaSimpleFila($sql);
            
            if ($result) {
                $response['success'] = true;
                $response['existe'] = $result['count'] > 0;
            } else {
                $response['message'] = 'Error al verificar tarjeta: ' . $conexion->error;
            }
        }
    }
    elseif ($action === 'obtener_historial_cambios') {
        $cedula = isset($_GET['cedula']) ? limpiarCadena($_GET['cedula']) : '';
        
        if (empty($cedula)) {
            $response['message'] = 'Cédula no proporcionada';
        } else {
            $sql = "SELECT * FROM historial_cambios_tarjeta 
                    WHERE cedula_cliente = '$cedula'
                    ORDER BY fecha_cambio DESC";
            $query = ejecutarConsulta($sql);
            
            if ($query) {
                while ($row = $query->fetch_assoc()) {
                    $response['data'][] = $row;
                }
                $response['success'] = true;
            } else {
                $response['message'] = 'Error al obtener historial: ' . $conexion->error;
            }
        }
    }
    elseif ($action === 'historial_cambios') {
        $num_tarjeta = isset($_GET['num_tarjeta']) ? limpiarCadena($_GET['num_tarjeta']) : '';
        $cedula = isset($_GET['cedula']) ? limpiarCadena($_GET['cedula']) : '';
        
        if (empty($cedula)) {
            $response['message'] = 'Cédula no proporcionada';
        } else {
            $sql = "SELECT tarjeta_anterior, tarjeta_nueva, motivo_cambio as motivo, 
                           DATE_FORMAT(fecha_cambio, '%d/%m/%Y %H:%i') as fecha
                    FROM historial_cambios_tarjeta 
                    WHERE cedula_cliente = '$cedula'
                    ORDER BY fecha_cambio DESC";
            $query = ejecutarConsulta($sql);
            
            if ($query) {
                while ($row = $query->fetch_assoc()) {
                    $response['data'][] = $row;
                }
                $response['success'] = true;
            } else {
                $response['message'] = 'Error al obtener historial: ' . $conexion->error;
            }
        }
    }
    else {
        $response['message'] = "Acción no reconocida: $action";
        error_log("Acción no reconocida: " . $action);
    }
} 
else {
    $response['message'] = 'Método no permitido';
    error_log("Método no permitido: " . $_SERVER['REQUEST_METHOD']);
}

error_log("Respuesta final: " . json_encode($response));
echo json_encode($response);
?>