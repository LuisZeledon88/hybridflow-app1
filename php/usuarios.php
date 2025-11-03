<?php
/**
 * usuarios.php
 *
 * Script backend para la autenticación y gestión de usuarios.
 *
 * Funcionalidad principal:
 * - Autenticación de usuarios
 * - Manejo de respuestas JSON para frontend
 */
require_once "../conexion/conexion.php";

// Configuración de headers para CORS y tipo de contenido
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Función para enviar respuestas estandarizadas
function sendResponse($success, $message = '', $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Verificar método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Método no permitido', null, 405);
    }

    // Obtener datos del request
    $json = file_get_contents('php://input');
    $input = json_decode($json, true);

    // Si falla el decode, intentar con $_POST
    if (json_last_error() !== JSON_ERROR_NONE) {
        $input = $_POST;
    }

    // Verificar datos recibidos
    if (empty($input)) {
        sendResponse(false, 'Datos inválidos recibidos', null, 400);
    }

    // Procesar acción de login
    if (isset($input['action']) && $input['action'] === 'login') {
        // Validar campos requeridos
        if (empty($input['correo']) || empty($input['contrasena'])) {
            sendResponse(false, 'Correo y contraseña son requeridos', null, 400);
        }

        $correo = trim($input['correo']);
        $contrasena = trim($input['contrasena']);

        // Consulta preparada para seguridad
        $stmt = $conexion->prepare("SELECT id, nombre, correo, rol, contrasena FROM usuarios WHERE correo = ?");
        
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $conexion->error);
        }

        $stmt->bind_param("s", $correo);
        
        if (!$stmt->execute()) {
            throw new Exception("Error ejecutando consulta: " . $stmt->error);
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            sendResponse(false, 'Credenciales incorrectas', null, 401);
        }

        $usuario = $result->fetch_assoc();

        // Verificar contraseña (en texto plano en este ejemplo)
        if ($usuario['contrasena'] !== $contrasena) {
            sendResponse(false, 'Credenciales incorrectas', null, 401);
        }

        // Eliminar contraseña del resultado
        unset($usuario['contrasena']);

        // Autenticación exitosa
        sendResponse(true, 'Autenticación exitosa', $usuario, 200);

    // Procesar acción obtener_usuarios
    } elseif (isset($input['action']) && $input['action'] === 'obtener_usuarios') {
        if (empty($input['id'])) {
            sendResponse(false, 'ID de usuario requerido', null, 400);
        }

        $id = (int)$input['id'];
        $stmt = $conexion->prepare("SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?");
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $conexion->error);
        }

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            sendResponse(false, 'Usuario no encontrado', null, 404);
        }

        $usuario = $result->fetch_assoc();
        sendResponse(true, 'Usuario obtenido', [$usuario], 200);
    
    // Procesar acción editar_usuario
    } elseif (isset($input['action']) && $input['action'] === 'editar_usuario') {
        // Validar campos requeridos
        if (empty($input['id']) || empty($input['nombre']) || empty($input['correo']) || empty($input['rol'])) {
            sendResponse(false, 'Todos los campos son requeridos', null, 400);
        }

        $id = (int)$input['id'];
        $nombre = trim($input['nombre']);
        $correo = trim($input['correo']);
        $rol = trim($input['rol']);
        
        // Verificar si el correo ya existe para otro usuario
        $stmt = $conexion->prepare("SELECT id FROM usuarios WHERE correo = ? AND id != ?");
        $stmt->bind_param("si", $correo, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            sendResponse(false, 'El correo electrónico ya está en uso por otro usuario', null, 400);
        }

        // Actualizar datos básicos
        if (empty($input['contrasena'])) {
            $stmt = $conexion->prepare("UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?");
            $stmt->bind_param("sssi", $nombre, $correo, $rol, $id);
        } else {
            // Si se proporcionó contraseña, actualizarla también
            $contrasena = trim($input['contrasena']);
            $stmt = $conexion->prepare("UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, contrasena = ? WHERE id = ?");
            $stmt->bind_param("ssssi", $nombre, $correo, $rol, $contrasena, $id);
        }

        if (!$stmt->execute()) {
            throw new Exception("Error al actualizar usuario: " . $stmt->error);
        }

        if ($stmt->affected_rows === 0) {
            sendResponse(false, 'No se realizaron cambios o el usuario no existe', null, 200);
        }

        // Obtener datos actualizados del usuario
        $stmt = $conexion->prepare("SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $usuario = $result->fetch_assoc();

        sendResponse(true, 'Usuario actualizado correctamente', $usuario, 200);
    
    } else {
        sendResponse(false, 'Acción no válida', null, 400);
    }

} catch (Exception $e) {
    error_log("Error en usuarios.php: " . $e->getMessage());
    sendResponse(false, 'Error en el servidor: ' . $e->getMessage(), null, 500);
}
?>