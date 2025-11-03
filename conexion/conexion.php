
<?php
/**
 * conexion.php
 *
 * Script de conexión global a la base de datos para el sistema CRM Bastos.
 * Incluye funciones utilitarias para consultas y sanitización de datos.
 *
 * - Conexión segura a MySQL usando MySQLi
 * - Validación de conexión y codificación
 * - Funciones globales para ejecutar consultas y limpiar cadenas
 *
 * @author Bastos
 * @date 2025-08-20
 */

require_once "global.php";

// Conexión a la base de datos
$conexion = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Validar conexión
if ($conexion->connect_errno) {
    die("Fallo al conectar a la base de datos: " . $conexion->connect_error);
}

// Asignar codificación
if (!$conexion->set_charset(DB_ENCODE)) {
    die("Error al configurar codificación: " . $conexion->error);
}

// Definir funciones utilitarias globales si no existen
if (!function_exists('ejecutarConsulta')) {
    /**
     * Ejecuta una consulta SQL y retorna el resultado.
     * Lanza error si la consulta falla.
     * @param string $sql
     * @return mysqli_result
     */
    function ejecutarConsulta($sql) {
        global $conexion;
        $query = $conexion->query($sql);
        if (!$query) {
            die("Error en la consulta: " . $conexion->error . " - SQL: $sql");
        }
        return $query;
    }

    /**
     * Ejecuta una consulta y retorna la primera fila como array asociativo.
     * @param string $sql
     * @return array|null
     */
    function ejecutarConsultaSimpleFila($sql) {
        global $conexion;
        $query = ejecutarConsulta($sql);
        return $query->fetch_assoc();
    }

    /**
     * Ejecuta una consulta de inserción y retorna el último ID insertado.
     * @param string $sql
     * @return int
     */
    function ejecutarConsulta_retornarID($sql) {
        global $conexion;
        ejecutarConsulta($sql);
        return $conexion->insert_id;
    }

    /**
     * Limpia y escapa una cadena para evitar inyección SQL y XSS.
     * @param string $str
     * @return string
     */
    function limpiarCadena($str) {
        global $conexion;
        $str = mysqli_real_escape_string($conexion, trim($str));
        return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
    }
}
