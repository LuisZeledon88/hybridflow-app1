/**
 * EditarPerfil.js
 *
 * Script para la edición y gestión del perfil de usuario.
 * Incluye actualización de datos, eliminación de cuenta y validación de formularios.
 *
 * Funcionalidad principal:
 * - Edición de datos de usuario
 * - Eliminación de cuenta
 * - Validación y manejo de errores
 */
document.addEventListener("DOMContentLoaded", () => {
    const currentUserName = document.getElementById("currentUserName");
    const currentUserRole = document.getElementById("currentUserRole");
    const editProfileForm = document.getElementById("editProfileForm");
    const profileEmail = document.getElementById("profileEmail");
    const profileName = document.getElementById("profileName");
    const profilePassword = document.getElementById("profilePassword");
    const profileRole = document.getElementById("profileRole");
    const togglePassword = document.getElementById("togglePassword");
    const cancelBtn = document.getElementById("cancelBtn");
    const successModal = document.getElementById("successModal");
    const errorModal = document.getElementById("errorModal");
    const successTitle = document.getElementById("successTitle");
    const successMessage = document.getElementById("successMessage");
    const errorTitle = document.getElementById("errorTitle");
    const errorMessage = document.getElementById("errorMessage");
    const continueBtn = document.getElementById("continueBtn");
    const errorContinueBtn = document.getElementById("errorContinueBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
        window.location.href = "autenticacion.html";
        return;
    }

    // Cargar datos del usuario con verificación
    // ID del usuario cargado (eliminar en producción)
    fetch("./php/usuarios.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `action=obtener_usuarios&id=${encodeURIComponent(currentUser.id)}`
    })
    .then((res) => {
        if (!res.ok) {
            throw new Error(`Error HTTP! Estado: ${res.status}`);
        }
        return res.json();
    })
    .then((data) => {
    // Respuesta del servidor recibida (eliminar en producción)
        if (data.success && data.data && data.data.length > 0) {
            const user = data.data[0];
            currentUserName.textContent = user.nombre || "Sin nombre";
            currentUserRole.textContent = user.rol || "Sin rol";
            profileEmail.value = user.correo || "";
            profileName.value = user.nombre || "";
            profileRole.value = user.rol || "";
        } else {
            showErrorModal("Error", data.message || "No se pudo cargar el usuario.");
        }
    })
    .catch((error) => {
        console.error("Error de fetch:", error);
        showErrorModal("Error", "No se pudo conectar con el servidor. Verifica tu conexión o contacta al soporte.");
    });

    // Alternar visibilidad de la contraseña
    togglePassword.addEventListener("click", () => {
        const type = profilePassword.getAttribute("type") === "password" ? "text" : "password";
        profilePassword.setAttribute("type", type);
        togglePassword.querySelector("i").classList.toggle("fa-eye");
        togglePassword.querySelector("i").classList.toggle("fa-eye-slash");
    });

    // Envío del formulario (nota: requiere acción editar_usuario en PHP)
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newName = profileName.value.trim();
        const newEmail = profileEmail.value.trim();
        const newPassword = profilePassword.value.trim();
        const newRole = profileRole.value;

        if (!newName || newName.length < 2) return showErrorModal("Error", "Nombre inválido.");
        if (!newEmail || !newEmail.includes("@")) return showErrorModal("Error", "Correo inválido.");
        if (newPassword && newPassword.length < 6) return showErrorModal("Error", "Contraseña muy corta.");
        if (!newRole) return showErrorModal("Error", "El rol es obligatorio.");

        const formData = new URLSearchParams();
        formData.append("action", "editar_usuario");
        formData.append("id", currentUser.id);
        formData.append("nombre", newName);
        formData.append("rol", newRole);
        formData.append("correo", newEmail);
        if (newPassword) formData.append("contrasena", newPassword);

        try {
            const response = await fetch("./php/usuarios.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            });
            if (!response.ok) throw new Error(`Error HTTP! Estado: ${response.status}`);
            const data = await response.json();

            if (data.success) {
                showSuccessModal("Perfil Actualizado", "Los cambios se guardaron correctamente.");
                profilePassword.value = "";
                localStorage.setItem("currentUser", JSON.stringify({ id: currentUser.id, nombre: newName, rol: newRole }));
            } else {
                showErrorModal("Error", data.message || "Error al actualizar. Acción 'editar_usuario' no soportada.");
            }
        } catch (error) {
            console.error("Error de fetch:", error);
            showErrorModal("Error", "Error de red o del servidor.");
        }
    });

    // Botón Cancelar
    cancelBtn.addEventListener("click", () => {
        window.location.href = "MenuPrincipal.html";
    });

    // Continuar desde el modal de éxito
    continueBtn.addEventListener("click", () => {
        successModal.style.display = "none";
        window.location.href = "MenuPrincipal.html";
    });

    // Cerrar el modal de error
    errorContinueBtn.addEventListener("click", () => {
        errorModal.style.display = "none";
    });

    // Eliminar cuenta
    deleteAccountBtn.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.")) {
            fetch("php/gestionarUsuarios.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `action=eliminar_usuario&id=${encodeURIComponent(currentUser.id)}`
            })
            .then((res) => {
                if (!res.ok) throw new Error(`Error HTTP! Estado: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data.success) {
                    alert("Tu cuenta ha sido eliminada correctamente.");
                    localStorage.removeItem("currentUser");
                    window.location.href = "autenticacion.html";
                } else {
                    alert("No se pudo eliminar tu cuenta: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Error de fetch:", error);
                alert("Error inesperado al intentar eliminar tu cuenta.");
            });
        }
    });

    function showSuccessModal(title, message) {
        successTitle.textContent = title;
        successMessage.textContent = message;
        successModal.style.display = "flex";
    }

    function showErrorModal(title, message) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorModal.style.display = "flex";
    }
});