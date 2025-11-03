<?php
/**
 * gestionarUsuarios.php
 *
 * Script backend para la gestión de usuarios del sistema.
 *
 * Funcionalidad principal:
 * - Registro, edición y consulta de usuarios
 * - Manejo de respuestas JSON para frontend
 */
require_once "../conexion/global.php";
require_once "../conexion/conexion.php";
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'registrar_usuario':
        $nombre = limpiarCadena($_POST['nombre']);
        $correo = limpiarCadena($_POST['correo']);
        // Sin password_hash - guardar contraseña en texto plano
        $contrasena = limpiarCadena($_POST['contrasena']);
        $rol = limpiarCadena($_POST['rol']);

        $verificar = ejecutarConsulta("SELECT id FROM usuarios WHERE correo = '$correo'");
        if ($verificar && $verificar->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está en uso.']);
            exit;
        }

        $sql = "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES ('$nombre', '$correo', '$contrasena', '$rol')";
        $resultado = ejecutarConsulta($sql);

        echo json_encode(['success' => $resultado ? true : false, 'message' => $resultado ? 'Usuario registrado' : 'Error al registrar']);
        exit;

    case 'editar_usuario':
        $id = intval($_POST['id']);
        $nombre = limpiarCadena($_POST['nombre']);
        $correo = limpiarCadena($_POST['correo']);
        $rol = limpiarCadena($_POST['rol']);
        // Sin password_hash - guardar contraseña en texto plano
        $contrasena = $_POST['contrasena'] ? limpiarCadena($_POST['contrasena']) : null;

        $verificar = ejecutarConsulta("SELECT id FROM usuarios WHERE correo = '$correo' AND id != $id");
        if ($verificar && $verificar->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está en uso por otro usuario.']);
            exit;
        }

        $sql = $contrasena
            ? "UPDATE usuarios SET nombre = '$nombre', correo = '$correo', contrasena = '$contrasena', rol = '$rol' WHERE id = $id"
            : "UPDATE usuarios SET nombre = '$nombre', correo = '$correo', rol = '$rol' WHERE id = $id";

        $resultado = ejecutarConsulta($sql);
        echo json_encode(['success' => $resultado ? true : false, 'message' => $resultado ? 'Usuario actualizado' : 'Error al actualizar']);
        exit;

    case 'eliminar_usuario':
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

        if ($id <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'ID inválido para eliminación.'
            ]);
            exit;
        }

        $sql = "DELETE FROM usuarios WHERE id = $id";
        $resultado = ejecutarConsulta($sql);

        echo json_encode([
            'success' => $resultado ? true : false,
            'message' => $resultado ? 'Usuario eliminado correctamente.' : 'No se pudo eliminar el usuario.'
        ]);
        exit;

    case 'obtener_usuarios':
        $id = isset($_POST['id']) ? intval($_POST['id']) : null;
        $sql = $id ? "SELECT id, nombre, correo, rol FROM usuarios WHERE id = $id" : "SELECT id, nombre, correo, rol FROM usuarios";
        $resultado = ejecutarConsulta($sql);
        $datos = [];
        while ($fila = $resultado->fetch_assoc()) {
            $datos[] = $fila;
        }
        echo json_encode(['success' => true, 'data' => $datos]);
        exit;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        exit;
}
?>