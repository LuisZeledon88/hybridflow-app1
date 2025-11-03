<?php
/**
 * send-whatsapp-web.php
 *
 * Script backend para el envío de mensajes de WhatsApp desde el sistema.
 *
 * Funcionalidad principal:
 * - Envío de mensajes personalizados por WhatsApp
 * - Manejo de respuestas JSON para frontend
 */
// Envío de WhatsApp usando WhatsApp Web API
require_once '../conexion/conexion.php';
require_once 'whatsapp-config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Obtener datos JSON
    $rawInput = file_get_contents('php://input');
    error_log("Raw input: " . $rawInput); // Para debug
    
    $input = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido: ' . json_last_error_msg());
    }
    
    if (!isset($input['telefono']) || !isset($input['nombre'])) {
        throw new Exception('Datos incompletos - telefono: ' . ($input['telefono'] ?? 'missing') . ', nombre: ' . ($input['nombre'] ?? 'missing'));
    }

    $telefono = $input['telefono'];
    $nombre = $input['nombre'];
    $metodo = $input['metodo'] ?? 'whatsapp_web';
    
    // Limpiar el número de teléfono
    $cleanPhone = preg_replace('/[^0-9]/', '', $telefono);
    
    // Asegurar formato correcto para Costa Rica
    if (!str_starts_with($cleanPhone, '506')) {
        $cleanPhone = '506' . $cleanPhone;
    }
    
    // Crear mensaje personalizado
    $mensaje = "🎉 ¡Feliz cumpleaños, $nombre! 🎂\n\n";
    $mensaje .= "¡En Bastos Restaurante queremos celebrar tu día especial contigo!\n\n";
    $mensaje .= "🎁 Tenemos una sorpresa especial para ti en tu cumpleaños\n";
    $mensaje .= "🍽️ Ven a disfrutar de nuestros mejores platillos\n";
    $mensaje .= "👑 Como cliente VIP, mereces lo mejor\n\n";
    $mensaje .= "¡Te esperamos para hacer de tu cumpleaños una celebración inolvidable!\n\n";
    $mensaje .= "Reserva tu mesa llamando o visitándonos.\n\n";
    $mensaje .= "¡Que tengas un día maravilloso! 🌟\n\n";
    $mensaje .= "- Equipo Bastos Restaurante";

    // Registrar en base de datos
    $sqlLog = "INSERT INTO whatsapp_log (telefono, nombre, mensaje, fecha_envio, estado, metodo) 
               VALUES (?, ?, ?, NOW(), 'enviado_web', ?)";
    $stmt = mysqli_prepare($conexion, $sqlLog);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "ssss", $cleanPhone, $nombre, $mensaje, $metodo);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => "WhatsApp Web abierto para $nombre",
        'phone' => $cleanPhone,
        'formatted_message' => $mensaje
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conexion);
?>
