/**
 * registroExterno.js
 *
 * Script para el registro de clientes externos con tarjeta VIP.
 * Incluye validación, registro y manejo de mensajes de éxito/error.
 *
 * Funcionalidad principal:
 * - Registro de clientes externos
 * - Validación de datos y manejo de errores
 * - Mensajes de éxito y confirmación
 */
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos
    
    const vipForm = document.getElementById('vipForm');
    const cedulaInput = document.getElementById('cedula');
    const nombreInput = document.getElementById('fullName');
    const telefonoInput = document.getElementById('phone');
    const lugarOrigenInput = document.getElementById('origin');
    const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]');
    const otraAlergiaInput = document.getElementById('otraAlergia');
    const otroAlergiaGroupExt = document.getElementById('otroAlergiaGroupExt');
    const gustosEspecialesInput = document.getElementById('gustosEspeciales');
    const birthDaySelect = document.getElementById('birthDay');
    const birthMonthSelect = document.getElementById('birthMonth');

    const cedulaError = document.getElementById('cedulaError');
    const nombreError = document.getElementById('fullNameError');
    const telefonoError = document.getElementById('phoneError');
    const lugarOrigenError = document.getElementById('originError');
    const alergiasError = document.getElementById('alergiasError');
    const otraAlergiaError = document.getElementById('otraAlergiaError');
    const gustosEspecialesError = document.getElementById('gustosEspecialesError');
    const birthdayError = document.getElementById('birthdayError');

    const registerBtn = document.getElementById('registerBtn');
    const successMessageDiv = document.getElementById('successMessage');
    const generatedCodeSpan = document.getElementById('generatedCode');

    // Función para llenar los selects Día y Mes
    function populateBirthDate() {
        // Días 1-31
        for (let d = 1; d <= 31; d++) {
            const option = document.createElement('option');
            option.value = d.toString().padStart(2, '0');
            option.textContent = d;
            birthDaySelect.appendChild(option);
        }
        // Meses 1-12
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        for (let m = 1; m <= 12; m++) {
            const option = document.createElement('option');
            option.value = m.toString().padStart(2, '0');
            option.textContent = monthNames[m-1];
            birthMonthSelect.appendChild(option);
        }
    }
    populateBirthDate();

    // Manejar cambio en checkboxes de alergias
    if (alergiasCheckboxes.length > 0) {
        alergiasCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Si selecciona "Ninguna", desmarcar todas las demás
                if (this.value === 'Ninguna' && this.checked) {
                    alergiasCheckboxes.forEach(cb => {
                        if (cb.value !== 'Ninguna') {
                            cb.checked = false;
                        }
                    });
                    otroAlergiaGroupExt.style.display = 'none';
                    otraAlergiaInput.required = false;
                    otraAlergiaInput.value = '';
                } else if (this.value !== 'Ninguna' && this.checked) {
                    // Si selecciona cualquier otra, desmarcar "Ninguna"
                    const ningunaCheckbox = document.querySelector('input[name="alergias"][value="Ninguna"]');
                    if (ningunaCheckbox) ningunaCheckbox.checked = false;
                }

                // Manejar campo "Otro"
                const otroCheckbox = document.querySelector('input[name="alergias"][value="Otro"]');
                if (otroCheckbox && otroCheckbox.checked) {
                    otroAlergiaGroupExt.style.display = 'block';
                    otraAlergiaInput.required = true;
                } else {
                    otroAlergiaGroupExt.style.display = 'none';
                    otraAlergiaInput.required = false;
                    otraAlergiaInput.value = '';
                    clearError(otraAlergiaInput, otraAlergiaError);
                }
            });
        });
    }

    // Validaciones
    function clearError(input, errorEl) {
        input.classList.remove('error');
        errorEl.textContent = '';
    }

    function showError(input, errorEl, msg) {
        input.classList.add('error');
        errorEl.textContent = msg;
    }
function validateCedula(cedula) {
    const c = cedula.replace(/[\s-]/g, '');
    return /^\d{9}$/.test(c); // Solo revisa que sean 9 dígitos
}


    function validatePhone(phone) {
        const p = phone.replace(/[\s-]/g,'');
        return /^\d{8}$/.test(p);
    }

    function validateName(name) {
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(name.trim());
    }

    function validateForm() {
        let valid = true;
        clearError(cedulaInput, cedulaError);
        clearError(nombreInput, nombreError);
        clearError(telefonoInput, telefonoError);
        clearError(lugarOrigenInput, lugarOrigenError);
        // Limpiar error de alergias (para checkboxes)
        alergiasError.textContent = '';
        clearError(birthDaySelect, birthdayError);
        clearError(birthMonthSelect, birthdayError);

        if (!cedulaInput.value.trim()) {
            showError(cedulaInput, cedulaError, 'La cédula es requerida');
            valid = false;
        } else if (!validateCedula(cedulaInput.value.trim())) {
            showError(cedulaInput, cedulaError, 'Cédula inválida');
            valid = false;
        }
        if (!nombreInput.value.trim()) {
            showError(nombreInput, nombreError, 'El nombre es requerido');
            valid = false;
        } else if (!validateName(nombreInput.value.trim())) {
            showError(nombreInput, nombreError, 'Nombre inválido');
            valid = false;
        }
        if (!birthDaySelect.value) {
            showError(birthDaySelect, birthdayError, 'Seleccione un día');
            valid = false;
        }
        if (!birthMonthSelect.value) {
            showError(birthMonthSelect, birthdayError, 'Seleccione un mes');
            valid = false;
        }
        if (!telefonoInput.value.trim()) {
            showError(telefonoInput, telefonoError, 'El teléfono es requerido');
            valid = false;
        } else if (!validatePhone(telefonoInput.value.trim())) {
            showError(telefonoInput, telefonoError, 'Teléfono inválido (8 dígitos)');
            valid = false;
        }
        if (!lugarOrigenInput.value.trim()) {
            showError(lugarOrigenInput, lugarOrigenError, 'El lugar de origen es requerido');
            valid = false;
        }
        
        // Validar alergias (ahora son checkboxes)
        const selectedAllergies = document.querySelectorAll('input[name="alergias"]:checked');
        if (selectedAllergies.length === 0) {
            // Mostrar error en el primer checkbox o en un elemento de error específico
            const firstCheckbox = document.querySelector('input[name="alergias"]');
            if (firstCheckbox) {
                showError(firstCheckbox, alergiasError, 'Debe seleccionar al menos una opción de alergias');
            }
            valid = false;
        } else {
            // Verificar si seleccionó "Otro" pero no especificó la alergia
            const otroCheckbox = document.querySelector('input[name="alergias"][value="Otro"]');
            if (otroCheckbox && otroCheckbox.checked && !otraAlergiaInput.value.trim()) {
                showError(otraAlergiaInput, otraAlergiaError, 'Especifique la alergia');
                valid = false;
            } else {
                // Limpiar errores de alergias si todo está bien
                clearError(document.querySelector('input[name="alergias"]'), alergiasError);
            }
        }
        return valid;
    }

    // ...existing code...
window.clearForm = function() {
    vipForm.reset();
    
    // Limpiar checkboxes de alergias
    const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]');
    alergiasCheckboxes.forEach(cb => cb.checked = false);
    
    [cedulaInput,nombreInput,telefonoInput,lugarOrigenInput,otraAlergiaInput,gustosEspecialesInput,birthDaySelect,birthMonthSelect].forEach(i => {
        i.classList.remove('error');
    });
    [cedulaError,nombreError,telefonoError,lugarOrigenError,alergiasError,otraAlergiaError,gustosEspecialesError,birthdayError].forEach(e => {
        e.textContent = '';
    });
    
    // Ocultar campo de otra alergia y limpiar checkboxes
    otroAlergiaGroupExt.style.display = 'none';
    otraAlergiaInput.required = false;
    
    successMessageDiv.style.display = 'none';
    vipForm.style.display = 'block';
    registerBtn.disabled = false;
    registerBtn.querySelector('.btn-text').style.display = 'inline-block';
    registerBtn.querySelector('.btn-loader').style.display = 'none';
}
// ...existing code...

    // Al enviar formulario
    vipForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Construir fecha cumpleaños
        const fecha_cumpleanos = `${birthDaySelect.value}/${birthMonthSelect.value}`;

        // Preparar datos para enviar
        const formData = new FormData();
        formData.append('action', 'registrar_cliente');
        formData.append('cedula', cedulaInput.value.trim());
        formData.append('nombre', nombreInput.value.trim());
        formData.append('fecha_cumpleanos', fecha_cumpleanos);
        formData.append('telefono', telefonoInput.value.trim());
        formData.append('lugar_origen', lugarOrigenInput.value.trim());
        
        // Manejar alergias (ahora son múltiples checkboxes)
        const selectedAllergies = [];
        const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]:checked');
        
        alergiasCheckboxes.forEach(checkbox => {
            if (checkbox.value === 'Otro') {
                const otraAlergia = otraAlergiaInput.value.trim();
                if (otraAlergia) {
                    selectedAllergies.push(otraAlergia);
                }
            } else {
                selectedAllergies.push(checkbox.value);
            }
        });
        
        // Si no hay alergias seleccionadas, poner "Ninguna" por defecto
        const alergiasValue = selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'Ninguna';
        formData.append('alergias', alergiasValue);
        
        formData.append('gustos_especiales', gustosEspecialesInput.value.trim());

        // Mostrar loader y deshabilitar botón
        registerBtn.querySelector('.btn-text').style.display = 'none';
        registerBtn.querySelector('.btn-loader').style.display = 'inline-block';
        registerBtn.disabled = true;

        try {
            const response = await fetch('php/clientes.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                // Mostrar el número de tarjeta generado automáticamente
                const numeroTarjeta = data.num_tarjeta || data.id;
                generatedCodeSpan.textContent = numeroTarjeta;
                successMessageDiv.style.display = 'block';
                vipForm.style.display = 'none';
                
                // Cliente registrado exitosamente (eliminar en producción)
            } else {
                alert(data.message || 'Error al registrar el cliente');
            }
        } catch (error) {
            alert('Error en la conexión con el servidor');
            console.error(error);
        } finally {
            registerBtn.querySelector('.btn-text').style.display = 'inline-block';
            registerBtn.querySelector('.btn-loader').style.display = 'none';
            registerBtn.disabled = false;
        }
    });

    // También puedes agregar listeners para limpiar error mientras se escribe
    [cedulaInput, nombreInput, telefonoInput, lugarOrigenInput, otraAlergiaInput, gustosEspecialesInput, birthDaySelect, birthMonthSelect].forEach(input => {
        input.addEventListener('input', () => {
            const errorEl = document.getElementById(input.id + 'Error');
            if (errorEl) {
                input.classList.remove('error');
                errorEl.textContent = '';
            }
        });
    });
});

// Función para salir del sistema - Cierra la ventana directamente
function exitApplication() {
    const confirmExit = confirm(
        '¿Está seguro que desea salir del sistema?\n\n' +
        'Se cerrará esta ventana del navegador completamente.'
    );
    
    if (confirmExit) {
        // Múltiples intentos para cerrar la ventana
        try {
            // Método 1: Cerrar ventana directamente
            window.close();
            
            // Método 2: Si es una ventana popup o abierta con JavaScript
            self.close();
            
            // Método 3: Para ventanas parent
            if (window.parent && window.parent !== window) {
                window.parent.close();
            }
            
            // Método 4: Usando top window
            if (window.top && window.top !== window) {
                window.top.close();
            }
            
        } catch (error) {
            // Intentando cerrar ventana (eliminar en producción)
        }
        
        // Si no se puede cerrar programáticamente, usar métodos alternativos
        setTimeout(() => {
            try {
                // Intentar cerrar con diferentes métodos
                window.open('', '_self').close();
                window.opener = null;
                window.open('', '_self');
                window.close();
                
                // Último recurso: navegar a about:blank y cerrar
                window.location.replace('about:blank');
                window.close();
                
            } catch (e) {
                // Si nada funciona, redirigir a una página que se cierre automáticamente
                window.location.href = 'data:text/html,<html><head><title>Cerrando...</title></head><body><script>window.close();setTimeout(function(){window.location.href="about:blank"},100);</script><h1 style="text-align:center;margin-top:200px;font-family:Arial;">Cerrando ventana...</h1></body></html>';
            }
        }, 200);
    }
}
