/**
 * autenticacion.js
 *
 * Script para gestionar la autenticación de usuarios en el sistema.
 * Incluye validación de formularios, manejo de respuestas del servidor y redirección según el rol.
 *
 * Funcionalidad principal:
 * - Validación de campos de login
 * - Comunicación con backend PHP para autenticación
 * - Manejo de errores y mensajes al usuario
 * - Redirección según el rol del usuario
 * - Recordar usuario si así lo desea
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');

    if (!loginForm) {
        console.error('No se encontró el formulario de login');
        return;
    }

    // Cargar usuario recordado si existe
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const usernameInput = document.querySelector('input[name="username"]');
        if (usernameInput) usernameInput.value = rememberedUser;
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar errores previos
        if (loginError) {
            loginError.style.display = 'none';
            loginErrorText.textContent = '';
        }
        
        const formData = new FormData(loginForm);
        const correo = formData.get('username').trim();
        const contrasena = formData.get('password').trim();

        // Validación básica
        if (!correo || !contrasena) {
            showError('Por favor complete todos los campos');
            return;
        }

        // Validar formato de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            showError('Por favor ingrese un correo electrónico válido');
            return;
        }

        try {
            // Mostrar estado de carga en el botón de login
            toggleLoading(true);

            // Enviar solicitud de autenticación
            const response = await fetch('php/usuarios.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    correo: correo,
                    contrasena: contrasena
                })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Respuesta no JSON:', text);
                throw new Error('Error en la comunicación con el servidor');
            }

            const data = await response.json();
            // Respuesta recibida del servidor (ver manejo de errores más abajo)

            if (!data) {
                throw new Error('No se recibieron datos del servidor');
            }

            if (!data.success) {
                throw new Error(data.message || 'Error en la autenticación');
            }

            if (!data.data || !data.data.id) {
                throw new Error('Datos de usuario incompletos');
            }

            // Autenticación exitosa - manejar redirección
            handleSuccessfulLogin(data.data, correo);

        } catch (error) {
            // Mostrar error completo solo en desarrollo
            // showError(getFriendlyError(error));
            showError(getFriendlyError(error));
        } finally {
            toggleLoading(false);
        }
    });

    // Funciones auxiliares
    function toggleLoading(show) {
    /**
     * Muestra u oculta el estado de carga en el botón de login
     * @param {boolean} show
     */
        const btn = document.getElementById('loginBtn');
        if (!btn) return;
        
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');
        
        if (text && loader) {
            text.style.display = show ? 'none' : 'flex';
            loader.style.display = show ? 'flex' : 'none';
        }
        btn.disabled = show;
    }

    function showError(message) {
    // Mostrar error de autenticación en consola solo para depuración
        
        if (loginError && loginErrorText) {
            loginErrorText.textContent = message;
            loginError.style.display = 'flex';
            loginError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(message); // Fallback si no hay elementos de error
        }
    }

    function getFriendlyError(error) {
    /**
     * Devuelve un mensaje de error amigable para mostrar al usuario
     * @param {Error} error
     * @returns {string}
     */
        const message = error.message || 'Error desconocido';
        
        if (message.includes('Failed to fetch')) {
            return 'Error de conexión. Verifique su conexión a internet.';
        }
        if (message.includes('401')) {
            return 'Credenciales incorrectas. Por favor intente nuevamente.';
        }
        if (message.includes('400')) {
            return 'Datos inválidos. Por favor verifique la información.';
        }
        if (message.includes('servidor') || message.includes('server')) {
            return 'Error en el servidor. Por favor intente más tarde.';
        }
        
        return message;
    }

    function handleSuccessfulLogin(userData, correo) {
    // Inicio de sesión exitoso, datos del usuario disponibles en userData
        
        // Almacenar datos del usuario
        const userSession = {
            id: userData.id,
            nombre: userData.nombre,
            correo: userData.correo,
            rol: userData.rol,
            timestamp: Date.now()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userSession));
        
        // Recordar usuario si está marcado
        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('rememberedUser', correo);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Redirigir según el rol del usuario
        // Los Saloneros van directamente a la pantalla de tarjetas VIP como acceso rápido
        let redirectUrl;
        if (userData.rol === 'Salonero') {
            // Usuario Salonero detectado: redirección directa a tarjetas.html para acceso rápido
            redirectUrl = 'tarjetas.html?t=' + Date.now();
        } else {
            // Redirigiendo a MenuPrincipal.html para otros roles
            redirectUrl = 'MenuPrincipal.html?t=' + Date.now();
        }
        
        // Redirigir con parámetro aleatorio para evitar caché
        window.location.href = redirectUrl;
    }
    // Mostrar/ocultar contraseñas
// Mostrar/ocultar contraseñas en los campos de tipo password
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        if (input) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });
});

});