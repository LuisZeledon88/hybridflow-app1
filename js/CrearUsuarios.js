/**
 * CrearUsuarios.js
 *
 * Script para la gestión de creación de usuarios en el sistema.
 * Incluye validación, registro y manejo de errores.
 *
 * Funcionalidad principal:
 * - Registro de nuevos usuarios
 * - Validación de datos y roles
 * - Manejo de errores y mensajes al usuario
 */
document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");
  const createUserForm = document.getElementById("createUserForm");
  const userUsername = document.getElementById("userUsername");
  const userEmail = document.getElementById("userEmail");
  const userPassword = document.getElementById("userPassword");
  const userRoleSelect = document.getElementById("userRoleSelect");
  const userUsernameError = document.getElementById("userUsernameError");
  const userEmailError = document.getElementById("userEmailError");
  const userPasswordError = document.getElementById("userPasswordError");
  const userRoleError = document.getElementById("userRoleError");
  const formError = document.getElementById("formError");
  const formErrorText = document.getElementById("formErrorText");
  const createUserBtn = document.getElementById("createUserBtn");
  const clearUserBtn = document.getElementById("clearUserBtn");
  const successModal = document.getElementById("successModal");
  const successTitle = document.getElementById("successTitle");
  const successMessage = document.getElementById("successMessage");
  const continueBtn = document.getElementById("continueBtn");
  const newUserBtn = document.getElementById("newUserBtn");
  const togglePasswordBtn = document.querySelector(".toggle-password");


// Verificar usuario autenticado
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  window.location.href = "MenuPrincipal.html";
  return;
}
const currentUser = JSON.parse(currentUserStr);

// Cargar información del usuario actual
const loadUserData = async () => {
  try {
    const response = await fetch("php/gestionarUsuarios.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=obtener_usuarios&id=${encodeURIComponent(currentUser.id)}`,
    });
    
      
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const user = data.data[0];
        userName.textContent = user.nombre;
        userRole.textContent = user.rol;

        // Verificar roles permitidos
        const rolesPermitidos = ["Desarrollador", "Propietario"];
        if (!rolesPermitidos.includes(user.rol)) {
          alert("No tienes permisos para registrar usuarios");
          window.location.href = "MenuPrincipal.html";
        }
      } else {
        throw new Error("Usuario no encontrado");
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      alert(error.message || "Error al cargar datos del usuario");
      window.location.href = "MenuPrincipal.html";
    }
  };

  // Funciones auxiliares
  const toggleButtonLoader = (button, show) => {
    button.disabled = show;
    button.innerHTML = show 
      ? '<i class="fas fa-spinner fa-spin"></i> Procesando...'
      : button.dataset.originalHtml;
  };

  // Guardar el HTML original de los botones
  createUserBtn.dataset.originalHtml = createUserBtn.innerHTML;
  clearUserBtn.dataset.originalHtml = clearUserBtn.innerHTML;

  const showError = (element, message) => {
    if (element) {
      element.textContent = message;
      element.style.display = message ? "block" : "none";
      if (element.parentElement) {
        element.parentElement.classList.toggle("has-error", !!message);
      }
    }
  };

  const clearErrors = () => {
    [userUsernameError, userPasswordError, userRoleError, userEmailError].forEach(el => {
      showError(el, "");
    });
    showError(formError, "");
    document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
  };

  // Alternar visibilidad de la contraseña
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = userPassword.type === "password" ? "text" : "password";
      userPassword.type = type;
      const icon = togglePasswordBtn.querySelector("i");
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  }

  // Limpiar formulario
  clearUserBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createUserForm.reset();
    clearErrors();
  });

  // Validaciones
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  // Enviar formulario
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    
    // Validar campos
    const username = userUsername.value.trim();
    const email = userEmail.value.trim();
    const password = userPassword.value.trim();
    const role = userRoleSelect.value;

    let isValid = true;

    if (!username) {
      showError(userUsernameError, "El nombre de usuario es requerido");
      isValid = false;
    }

    if (!email) {
      showError(userEmailError, "El correo es requerido");
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(userEmailError, "Ingrese un correo válido");
      isValid = false;
    }

    if (!password) {
      showError(userPasswordError, "La contraseña es requerida");
      isValid = false;
    } else if (!validatePassword(password)) {
      showError(userPasswordError, "La contraseña debe tener al menos 8 caracteres");
      isValid = false;
    }

    if (!role) {
      showError(userRoleError, "Seleccione un rol");
      isValid = false;
    }

    if (!isValid) return;

    toggleButtonLoader(createUserBtn, true);

    try {
      const formData = new FormData();
      formData.append('action', 'registrar_usuario');
      formData.append('nombre', username.charAt(0).toUpperCase() + username.slice(1));
      formData.append('correo', email);
      formData.append('contrasena', password);
      formData.append('rol', role);

      const response = await fetch("php/gestionarUsuarios.php", {
        method: "POST",
        body: formData
      });

      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      if (!data.success) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      // Éxito
      successTitle.textContent = "¡Usuario Creado!";
      successMessage.textContent = `El usuario ${username} (${email}) ha sido registrado exitosamente como ${role}.`;
      successModal.style.display = "flex";
      createUserForm.reset();
    } catch (error) {
      console.error("Error:", error);
      showError(formError, error.message);
    } finally {
      toggleButtonLoader(createUserBtn, false);
    }
  });

  // Manejar el modal de éxito
  continueBtn.addEventListener("click", () => {
    successModal.style.display = "none";
    window.location.href = "MenuPrincipal.html";
  });

  newUserBtn.addEventListener("click", () => {
    successModal.style.display = "none";
  });

  successModal.addEventListener("click", (e) => {
    if (e.target === successModal) {
      successModal.style.display = "none";
    }
  });

  // Inicializar
  loadUserData();
});