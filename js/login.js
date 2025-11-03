/**
 * login.js
 *
 * Script para la gestión del formulario de inicio de sesión.
 * Incluye validación, recuperación de contraseña y manejo de mensajes al usuario.
 *
 * Funcionalidad principal:
 * - Validación de campos de login
 * - Recuperación de contraseña
 * - Manejo de errores y mensajes al usuario
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const forgotPassword = document.getElementById('forgotPassword');
    const recoveryModal = document.getElementById('recoveryModal');
    const recoveryForm = document.getElementById('recoveryForm');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const closeModal = document.getElementById('closeModal');
    const cancelRecovery = document.getElementById('cancelRecovery');
    const successModal = document.getElementById('successModal');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const continueBtn = document.getElementById('continueBtn');
    const quickButtons = document.querySelectorAll('.quick-btn');

    // Usuarios de prueba
    const DEMO_USERS = {
        'admin': {
            password: 'admin123',
            name: 'Administrador',
            role: 'Administrador del Sistema',
            permissions: ['all']
        },
        'gerente': {
            password: 'gerente123',
            name: 'Carlos Mendoza',
            role: 'Gerente General',
            permissions: ['reports', 'staff', 'reservations']
        },
        'staff': {
            password: 'staff123',
            name: 'Ana López',
            role: 'Personal de Servicio',
            permissions: ['reservations', 'orders']
        }
    };

    // Alternar visibilidad de contraseña
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Validación de formulario
    const validateInput = (input, errorElement, message) => {
        errorElement.textContent = message;
        input.classList.toggle('error', !!message);
        return !message;
    };

    // Mostrar/Ocultar Loader del botón
    const toggleButtonLoader = (show) => {
        loginBtn.querySelector('.btn-text').style.display = show ? 'none' : 'flex';
        loginBtn.querySelector('.btn-loader').style.display = show ? 'flex' : 'none';
        loginBtn.disabled = show;
    };

    // Mostrar/Ocultar Error General
    const showLoginError = (message) => {
        loginErrorText.textContent = message;
        loginError.style.display = message ? 'flex' : 'none';
    };

    // Manejar Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        // Validar campos
        isValid &= validateInput(usernameInput, usernameError, 
            usernameInput.value.trim() ? '' : 'El usuario es requerido');
        isValid &= validateInput(passwordInput, passwordError, 
            passwordInput.value.trim() ? '' : 'La contraseña es requerida');

        if (!isValid) return;

        toggleButtonLoader(true);
        showLoginError('');

        // Simular autenticación
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value.trim();

            if (!DEMO_USERS[username]) {
                throw new Error('Usuario no encontrado');
            }

            if (DEMO_USERS[username].password !== password) {
                throw new Error('Contraseña incorrecta');
            }

            // Guardar preferencia de "Recordarme"
            if (rememberMe.checked) {
                localStorage.setItem('rememberedUser', username);
            } else {
                localStorage.removeItem('rememberedUser');
            }

            // Mostrar modal de éxito
            userName.textContent = DEMO_USERS[username].name;
            userRole.textContent = DEMO_USERS[username].role;
            welcomeMessage.textContent = `Bienvenido(a), ${DEMO_USERS[username].name}!`;
            successModal.style.display = 'flex';

        } catch (error) {
            showLoginError(error.message);
        } finally {
            toggleButtonLoader(false);
        }
    });

    // Cargar usuario recordado
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        usernameInput.value = rememberedUser;
        rememberMe.checked = true;
    }

    // Mostrar modal de recuperación
    forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        recoveryModal.style.display = 'flex';
        recoveryEmail.focus();
    });

    // Cerrar modales
    const closeModals = () => {
        recoveryModal.style.display = 'none';
        successModal.style.display = 'none';
        recoveryForm.reset();
    };

    closeModal.addEventListener('click', closeModals);
    cancelRecovery.addEventListener('click', closeModals);

    // Manejar recuperación de contraseña
    recoveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = recoveryEmail.value.trim();

        if (!email) {
            alert('Por favor, ingrese un email o usuario válido');
            return;
        }

        // Simular envío de instrucciones
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Instrucciones enviadas a ' + email);
            closeModals();
        } catch {
            alert('Error al enviar las instrucciones. Intente nuevamente.');
        }
    });

    // Continuar después de login exitoso
    continueBtn.addEventListener('click', () => {
        // Simular redirección al sistema
        alert('Redirigiendo al panel de ' + userRole.textContent);
        closeModals();
        loginForm.reset();
    });

    // Botones de acceso rápido
    quickButtons.forEach(button => {
        button.addEventListener('click', () => {
            const role = button.getAttribute('data-role');
            if (DEMO_USERS[role]) {
                usernameInput.value = role;
                passwordInput.value = DEMO_USERS[role].password;
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Cerrar modales al hacer clic fuera
    [recoveryModal, successModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModals();
        });
    });
});