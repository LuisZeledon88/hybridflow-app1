/**
 * RegistrarClientes.js
 *
 * Script para la gestión de clientes y tarjetas VIP.
 * Incluye registro, edición, impresión de etiquetas y manejo de historial de clientes.
 *
 * Funcionalidad principal:
 * - Registro y edición de clientes
 * - Impresión de etiquetas con código de barras
 * - Visualización y gestión de historial de clientes
 */
// RegistrarClientes.js – versión 2025‑07‑15
// -------------------------------------------------------------
// Incluye generación de código de barras, impresión de etiqueta, exportación a PDF
// y funcionalidad completa de reasignación de tarjetas VIP.
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  // -------------------- Elementos del DOM --------------------
  const registerTab = document.getElementById("registerTab");
  const listTab = document.getElementById("listTab");
  const registerFormPane = document.getElementById("registerForm");
  const clientListPane = document.getElementById("clientList");
  const clientForm = document.getElementById("clientForm");
  const clientsTableBody = document.getElementById("clientsTableBody");
  const searchInput = document.getElementById("searchInput");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");
  const editBtn = document.getElementById("editBtn");
  const changeCardModal = document.getElementById("changeCardModal");
  const cancelChangeBtn = document.getElementById("cancelChangeBtn");
  const changeCardForm = document.getElementById("changeCardForm");
  const successModal = document.getElementById("successModal");
  const goToMenuBtn = document.getElementById("goToMenuBtn");
  const addAnotherBtn = document.getElementById("addAnotherBtn");

  // Elementos para alergias personalizadas
  const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]');
  const otroAlergiaGroup = document.getElementById("otroAlergiaGroup");
  const otraAlergiaInput = document.getElementById("clientOtraAlergia");

  // -------------------- Variables de estado ------------------
  let currentClientId = null;
  let allClients = [];

  // -------------------- Inicialización -----------------------
  loadUserInfo();
  loadClients();
  
  // Establecer fecha actual por defecto
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("clientCardDate").value = today;

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
          otroAlergiaGroup.style.display = 'none';
          if (otraAlergiaInput) {
            otraAlergiaInput.required = false;
            otraAlergiaInput.value = '';
          }
        } else if (this.value !== 'Ninguna' && this.checked) {
          // Si selecciona cualquier otra, desmarcar "Ninguna"
          const ningunaCheckbox = document.querySelector('input[name="alergias"][value="Ninguna"]');
          if (ningunaCheckbox) ningunaCheckbox.checked = false;
        }

        // Manejar campo "Otro"
        const otroCheckbox = document.querySelector('input[name="alergias"][value="Otro"]');
        if (otroCheckbox && otroCheckbox.checked) {
          otroAlergiaGroup.style.display = 'block';
          if (otraAlergiaInput) otraAlergiaInput.required = true;
        } else {
          otroAlergiaGroup.style.display = 'none';
          if (otraAlergiaInput) {
            otraAlergiaInput.required = false;
            otraAlergiaInput.value = '';
          }
        }
      });
    });
  }

  // -------------------- Listeners globales -------------------
  registerTab.addEventListener("click", () => switchTab("register"));
  listTab.addEventListener("click", () => switchTab("list"));
  clientForm.addEventListener("submit", handleFormSubmit);
  clearBtn.addEventListener("click", resetForm);
  refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadClients();
  });
  searchInput.addEventListener("input", filterClients);
  
  // Listeners condicionales (solo si los elementos existen)
  if (cancelChangeBtn) {
    cancelChangeBtn.addEventListener("click", closeChangeCardModal);
  }
  if (changeCardForm) {
    changeCardForm.addEventListener("submit", handleCardReassignment);
  }
  if (goToMenuBtn) {
    goToMenuBtn.addEventListener("click", goToMainMenu);
  }
  if (addAnotherBtn) {
    addAnotherBtn.addEventListener("click", addAnotherClient);
  }

  // Cerrar modal de éxito al hacer clic fuera
  if (successModal) {
    successModal.addEventListener("click", function(e) {
      if (e.target === successModal) {
        closeSuccessModal();
      }
    });
  }

  // ============================================================
  //                      Funciones UI
  // ============================================================

  function switchTab(tab) {
    if (tab === "register") {
      registerTab.classList.add("active");
      listTab.classList.remove("active");
      registerFormPane.classList.add("active");
      clientListPane.classList.remove("active");
    } else {
      registerTab.classList.remove("active");
      listTab.classList.add("active");
      registerFormPane.classList.remove("active");
      clientListPane.classList.add("active");
    }
  }

  // ------------------------------------------------------------
  //   Carga de usuario actual y verificación de permisos
  // ------------------------------------------------------------
  function loadUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      window.location.href = "autenticacion.html";
      return;
    }

    fetch("php/usuarios.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=obtener_usuarios&id=${encodeURIComponent(currentUser.id)}`,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          const user = data.data[0];
          document.getElementById("userName").textContent = user.nombre;
          document.getElementById("userRole").textContent = user.rol;

          if (!["Salonero", "Propietario", "Desarrollador"].includes(user.rol)) {
            alert("No tienes permisos para acceder a esta sección");
            window.location.href = "MenuPrincipal.html";
          }
        }
      })
      .catch((err) => {
        console.error("Error al cargar usuario:", err);
        window.location.href = "autenticacion.html";
      });
  }

  // ------------------------------------------------------------
  //      CRUD – obtener lista de clientes y dibujar tabla
  // ------------------------------------------------------------
  function loadClients() {
    fetch("php/clientes.php?action=obtener_clientes")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          allClients = data.data;
          renderClients(allClients);
        } else {
          showError("Error al cargar clientes");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        showError("Error de conexión");
      });
  }

  function renderClients(clients) {
    clientsTableBody.innerHTML = "";

    clients.forEach((client) => {
      const row = document.createElement("tr");
      const barcodeId = `barcode-${client.num_tarjeta || client.cedula}`;

        row.innerHTML = `
          <td><strong>${client.num_tarjeta || "N/A"}</strong></td>
        <td>${client.cedula}</td>
        <td>${client.nombre}</td>
        <td>${client.telefono}</td>
        <td>${client.lugar_origen}</td>
        <td>${client.fecha_cumpleanos}</td>
        <td><div class="cell-content">${client.alergias || 'No especificado'}</div></td>
        <td><div class="cell-content">${client.gustos_especiales || 'No especificado'}</div></td>
        <td>
          <div class="barcode-container">
            ${
              client.num_tarjeta
                ? `<canvas id="${barcodeId}" class="barcode-canvas"></canvas>`
                : "Sin código"
            }
          </div>
        </td>
        <td class="actions">
          <!-- Botones de acción principal -->
          <div class="action-group">
            <button class="action-btn edit-btn" data-id="${client.cedula}" title="Editar Cliente">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${client.cedula}" title="Eliminar Cliente">
              <i class="fas fa-trash"></i>
            </button>
            ${
              client.num_tarjeta
                ? `<button class="action-btn change-card-btn" data-client-id="${client.cedula}" 
                          data-card-number="${client.num_tarjeta}" title="Reasignar Tarjeta">
                    <i class="fas fa-exchange-alt"></i>
                  </button>`
                : ""
            }
            ${
              client.num_tarjeta
                ? `<button class="action-btn btn-historial-cambios" data-card="${client.num_tarjeta}" 
                          data-cedula="${client.cedula}" title="Ver historial de cambios">
                    <i class="fas fa-history"></i>
                  </button>`
                : ""
            }
          </div>
          
          <!-- Botones de impresión (solo si hay tarjeta) -->
          ${
            client.num_tarjeta
              ? `
              <div class="print-group">
                <button class="action-btn print-btn" data-num="${client.num_tarjeta}" title="Imprimir Etiqueta">
                  <i class="fas fa-print"></i>
                </button>
                <button class="action-btn pdf-btn" data-num="${client.num_tarjeta}" title="Exportar PDF">
                  <i class="fas fa-file-pdf"></i>
                </button>
              </div>
              `
              : ""
          }
        </td>`;      clientsTableBody.appendChild(row);

      // Agregar contenedor para historial de cambios justo después de la fila del cliente
      if (client.num_tarjeta) {
        const historialDiv = document.createElement('tr');
        historialDiv.className = 'historial-row';
        historialDiv.style.display = 'none';
        historialDiv.innerHTML = `<td colspan="10">
          <div class="historial-cambios-container" id="historial-cambios-${client.num_tarjeta}">
            <div class="historial-cambios-loading" style="display:none;">Cargando historial...</div>
            <div class="historial-cambios-content"></div>
          </div>
        </td>`;
        clientsTableBody.appendChild(historialDiv);
      }

      // Generar código de barras si existe tarjeta
      if (client.num_tarjeta) {
        setTimeout(() => {
          try {
            const canvas = document.getElementById(barcodeId);
            if (canvas) {
              JsBarcode(canvas, client.num_tarjeta, {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: true,
                fontSize: 10,
                textMargin: 2,
                margin: 5,
                scale: 1,
                fontOptions: "normal",
                background: "#ffffff",
                lineColor: "#000000",
              });
            }
          } catch (err) {
            console.error("Error generando código de barras:", err);
            const canvas = document.getElementById(barcodeId);
            if (canvas) canvas.parentElement.textContent = "Error";
          }
        }, 100);
      }
    });

    // Agrega los event listeners para todos los botones
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', loadClientForEdit));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deleteClient));
    document.querySelectorAll('.print-btn').forEach(btn => btn.addEventListener('click', handlePrintBarcode));
    document.querySelectorAll('.pdf-btn').forEach(btn => btn.addEventListener('click', handleExportBarcodePdf));
    document.querySelectorAll('.change-card-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const clientId = this.getAttribute('data-client-id');
        const cardNumber = this.getAttribute('data-card-number');
        showChangeCardModal(clientId, cardNumber);
      });
    });

    // Listener para el botón de historial de cambios
    document.querySelectorAll('.btn-historial-cambios').forEach(btn => {
      btn.addEventListener('click', function(e) {
  // Botón de historial clickeado (eliminar en producción)
        const card = btn.getAttribute('data-card');
        const cedula = btn.getAttribute('data-cedula');
  // Card y cédula seleccionados (eliminar en producción)
        
        const row = btn.closest('tr');
        const nextRow = row.nextElementSibling;
  // Fila actual y siguiente (eliminar en producción)
        
        if (nextRow && nextRow.classList.contains('historial-row')) {
          // Encontró historial-row (eliminar en producción)
          // Toggle visual
          if (nextRow.style.display === 'none') {
            nextRow.style.display = '';
            cargarHistorialCambios(card, cedula);
          } else {
            nextRow.style.display = 'none';
          }
        } else {
          // No encontró historial-row (eliminar en producción)
        }
      });
    });
  // Función para cargar historial de cambios de tarjeta (AJAX)
  function cargarHistorialCambios(numTarjeta, cedula) {
  // Cargando historial para tarjeta y cédula (eliminar en producción)
    const contenedor = document.getElementById(`historial-cambios-${numTarjeta}`);
  // Contenedor encontrado (eliminar en producción)
    if (!contenedor) return;
    const loading = contenedor.querySelector('.historial-cambios-loading');
    const content = contenedor.querySelector('.historial-cambios-content');
    loading.style.display = '';
    content.innerHTML = '';
    
    const url = `php/clientes.php?action=historial_cambios&num_tarjeta=${encodeURIComponent(numTarjeta)}&cedula=${encodeURIComponent(cedula)}`;
  // URL generada para historial (eliminar en producción)
    
    fetch(url)
      .then(r => r.json())
      .then(data => {
  // Respuesta del servidor recibida (eliminar en producción)
        loading.style.display = 'none';
        if (data.success && data.data.length > 0) {
          let tabla = `<table class="tabla-historial-cambios"><thead><tr><th>Antes</th><th>Después</th><th>Motivo</th><th>Fecha</th></tr></thead><tbody>`;
          data.data.forEach(item => {
            tabla += `<tr><td>${item.tarjeta_anterior}</td><td>${item.tarjeta_nueva}</td><td>${item.motivo}</td><td>${item.fecha}</td></tr>`;
          });
          tabla += '</tbody></table>';
          content.innerHTML = tabla;
        } else {
          content.innerHTML = '<div class="historial-vacio">No hay historial de cambios para esta tarjeta.</div>';
        }
      })
      .catch(err => {
        console.error('Error al cargar historial:', err);
        loading.style.display = 'none';
        content.innerHTML = '<div class="historial-error">Error al cargar historial.</div>';
      });
  }
  }

  // ------------------------------------------------------------
  //      Funciones de impresión y exportación
  // ------------------------------------------------------------
  function handlePrintBarcode(e) {
    const numTarjeta = e.currentTarget.getAttribute("data-num");
    const canvas = document.getElementById(`barcode-${numTarjeta}`);
    if (!canvas) {
      showError("No se encontró el código de barras");
      return;
    }

    const dataURL = canvas.toDataURL("image/png");
    const printWin = window.open("", "_blank");
    printWin.document.write(
      `<!DOCTYPE html><html><head><title>Etiqueta ${numTarjeta}</title><style>@media print{body{margin:0}.label{width:45mm;height:20mm;display:flex;align-items:center;justify-content:center}}</style></head><body><div class="label"><img src="${dataURL}" style="max-width:100%;max-height:100%"/></div></body></html>`
    );
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 500);
  }

  async function handleExportBarcodePdf(e) {
    const numTarjeta = e.currentTarget.getAttribute("data-num");
    const canvas = document.getElementById(`barcode-${numTarjeta}`);
    if (!canvas) {
      showError("No se encontró el código de barras");
      return;
    }

    if (!window.jspdf) {
      showError("Librería PDF no disponible");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [45, 25],
    });

    const dataURL = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(dataURL);
    const maxWidth = 50;
    const imgWidth = Math.min(maxWidth, pdf.internal.pageSize.getWidth());
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;

    pdf.addImage(dataURL, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`Etiqueta_${numTarjeta}.pdf`);
  }

  // ============================================================
  //              Funciones para Reasignación de Tarjeta
  // ============================================================

  function showChangeCardModal(clientId, cardNumber) {
    const modal = changeCardModal;
    if (!modal) {
      showError("Modal no encontrado");
      return;
    }
    
    const currentCardInput = document.getElementById('currentCardNumber');
    const newCardInput = document.getElementById('newCardNumber');
    const reasonSelect = document.getElementById('changeReason');
    const otherReasonInput = document.getElementById('otherReason');
    const otherReasonGroup = document.getElementById('otherReasonGroup');
    const errorSpan = document.getElementById('newCardError');
    
    if (currentCardInput) currentCardInput.value = cardNumber;
    if (newCardInput) newCardInput.value = '';
    if (reasonSelect) reasonSelect.value = '';
    if (otherReasonInput) otherReasonInput.value = '';
    if (otherReasonGroup) otherReasonGroup.style.display = 'none';
    if (errorSpan) errorSpan.textContent = '';
    
    modal.dataset.clientId = clientId;
    modal.style.display = 'flex';
  }

  function closeChangeCardModal() {
    if (changeCardModal) {
      changeCardModal.style.display = 'none';
    }
  }

  function handleCardReassignment(e) {
    e.preventDefault();
    
    const clientId = changeCardModal.dataset.clientId;
    const currentCard = document.getElementById('currentCardNumber').value;
    const newCard = document.getElementById('newCardNumber').value.trim();
    const reason = document.getElementById('changeReason').value;
    const otherReason = document.getElementById('otherReason').value.trim();
    const finalReason = reason === 'Otro' ? otherReason : reason;

    // Validaciones
    if (!newCard) {
      document.getElementById('newCardError').textContent = 'Ingrese el nuevo número';
      return;
    }
    
    if (!/^\d{1,10}$/.test(newCard)) {
      document.getElementById('newCardError').textContent = 'Número inválido (1-10 dígitos)';
      return;
    }
    
    if (!reason) {
      alert('Seleccione un motivo para el cambio');
      return;
    }

    if (reason === 'Otro' && !otherReason) {
      alert('Especifique el motivo del cambio');
      return;
    }

    // Deshabilitar botón durante la operación
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    // Verificar si la nueva tarjeta ya existe
    fetch(`php/clientes.php?action=verificar_tarjeta&numero=${encodeURIComponent(newCard)}`)
      .then(response => response.json())
      .then(data => {
        if (data.existe) {
          document.getElementById('newCardError').textContent = 'Esta tarjeta ya está asignada';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Cambio';
          return;
        }

        // Proceder con la reasignación
        const formData = new FormData();
        formData.append('action', 'reasignar_tarjeta');
        formData.append('cedula', clientId);
        formData.append('tarjeta_anterior', currentCard);
        formData.append('tarjeta_nueva', newCard);
        formData.append('motivo', finalReason);

        return fetch('php/clientes.php', {
          method: 'POST',
          body: formData
        });
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Tarjeta reasignada correctamente');
          closeChangeCardModal();
          loadClients();
        } else {
          showError(data.message || 'Error al reasignar tarjeta');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showError('Error de conexión');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Cambio';
      });
  }

  // ------------------------------------------------------------
  //   Cargar cliente para edición
  // ------------------------------------------------------------
  function loadClientForEdit(e) {
    const cedula = e.currentTarget.getAttribute("data-id");
    const client = allClients.find((c) => c.cedula === cedula);
    if (!client) return;

    currentClientId = client.cedula;
    document.getElementById("clientCardNumber").value = client.num_tarjeta || "";
    document.getElementById("clientCedula").value = client.cedula;
    document.getElementById("clientName").value = client.nombre;
    document.getElementById("clientPhone").value = client.telefono;
    document.getElementById("clientBirthday").value = client.fecha_cumpleanos;
    document.getElementById("clientOrigin").value = client.lugar_origen;
    document.getElementById("clientCardDate").value = client.fecha_entrega_tarjeta.split(" ")[0];
    
    // Manejar alergias (ahora son múltiples en checkboxes)
    const clientAlergias = client.alergias || "";
    const alergiasArray = clientAlergias.split(',').map(a => a.trim()).filter(a => a);
    const predefinedAllergies = ['Ninguna', 'Gluten', 'Lactosa', 'Frutos secos', 'Mariscos', 'Huevos', 'Soja', 'Pescado', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos'];
    
    // Desmarcar todos los checkboxes primero
    const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]');
    alergiasCheckboxes.forEach(cb => cb.checked = false);
    
    let hasCustomAllergy = false;
    let customAllergyValue = '';
    
    alergiasArray.forEach(alergia => {
      if (predefinedAllergies.includes(alergia)) {
        const checkbox = document.querySelector(`input[name="alergias"][value="${alergia}"]`);
        if (checkbox) checkbox.checked = true;
      } else if (alergia) {
        // Es una alergia personalizada
        hasCustomAllergy = true;
        customAllergyValue = alergia;
      }
    });
    
    // Si hay alergia personalizada, marcar "Otro" y mostrar el campo
    if (hasCustomAllergy) {
      const otroCheckbox = document.querySelector('input[name="alergias"][value="Otro"]');
      if (otroCheckbox) otroCheckbox.checked = true;
      document.getElementById("clientOtraAlergia").value = customAllergyValue;
      otroAlergiaGroup.style.display = 'block';
      if (otraAlergiaInput) otraAlergiaInput.required = true;
    } else {
      otroAlergiaGroup.style.display = 'none';
      if (otraAlergiaInput) otraAlergiaInput.required = false;
    }
    
    document.getElementById("clientGustosEspeciales").value = client.gustos_especiales || "";
    document.getElementById("clientCedula").readOnly = true;
    searchInput.value = "";

    switchTab("register");
    saveBtn.style.display = "none";
    editBtn.style.display = "block";
  }

  // ------------------------------------------------------------
  //      Eliminar cliente
  // ------------------------------------------------------------
  function deleteClient(e) {
    const cedula = e.currentTarget.getAttribute("data-id");
    const client = allClients.find((c) => c.cedula === cedula);
    if (!client) return;

    if (!confirm(`¿Está seguro de eliminar al cliente ${client.nombre}?`)) {
      return;
    }

    const formData = new FormData();
    formData.append("action", "eliminar_cliente");
    formData.append("cedula", cedula);

    fetch("php/clientes.php", {
      method: "POST",
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          showSuccess("Cliente eliminado correctamente");
          loadClients();
        } else {
          showError(data.message || "Error al eliminar cliente");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        showError("Error de conexión");
      });
  }

  // ------------------------------------------------------------
  //      Manejar envío del formulario
  // ------------------------------------------------------------
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    const isEdit = currentClientId !== null;

    formData.append("action", isEdit ? "actualizar_cliente" : "registrar_cliente");
    if (isEdit) formData.append("cedula_original", currentClientId);

    formData.append("num_tarjeta", document.getElementById("clientCardNumber").value.trim());
    formData.append("cedula", document.getElementById("clientCedula").value.trim());
    formData.append("nombre", document.getElementById("clientName").value.trim());
    formData.append("telefono", document.getElementById("clientPhone").value.trim());
    formData.append("fecha_cumpleanos", document.getElementById("clientBirthday").value.trim());
    formData.append("lugar_origen", document.getElementById("clientOrigin").value.trim());
    formData.append("fecha_entrega_tarjeta", document.getElementById("clientCardDate").value);
    
    // Manejar alergias (ahora son múltiples checkboxes)
    const selectedAllergies = [];
    const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]:checked');
    
    alergiasCheckboxes.forEach(checkbox => {
      if (checkbox.value === 'Otro') {
        const otraAlergia = document.getElementById("clientOtraAlergia").value.trim();
        if (otraAlergia) {
          selectedAllergies.push(otraAlergia);
        }
      } else {
        selectedAllergies.push(checkbox.value);
      }
    });
    
    // Si no hay alergias seleccionadas, poner "Ninguna" por defecto
    const alergiasValue = selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'Ninguna';
    formData.append("alergias", alergiasValue);
    
    formData.append("gustos_especiales", document.getElementById("clientGustosEspeciales").value.trim());

    // Debug: Mostrar los datos que se van a enviar
  // === DATOS A ENVIAR === (eliminar en producción)
  // Modo de operación (eliminar en producción)
    for (let [key, value] of formData.entries()) {
  // Datos de formulario (eliminar en producción)
    }
  // ===================== (eliminar en producción)

    const submitBtn = isEdit ? editBtn : saveBtn;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    fetch("php/clientes.php", {
      method: "POST",
      body: formData,
    })
      .then((r) => {
  // Respuesta del servidor (eliminar en producción)
  // Status de la respuesta (eliminar en producción)
  // Texto de estado de la respuesta (eliminar en producción)
        
        // Verificar si la respuesta es válida
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        
        return r.text(); // Primero obtenemos el texto crudo
      })
      .then((text) => {
  // Texto de respuesta crudo (eliminar en producción)
        
        try {
          const data = JSON.parse(text);
          // Datos parseados (eliminar en producción)
          
          if (data.success) {
            showSuccess(isEdit ? "Cliente actualizado correctamente" : "Cliente registrado correctamente");
            resetForm();
            loadClients();
          } else {
            console.error("Error del servidor:", data);
            showError(data.message || "Error al guardar cliente");
          }
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          console.error("Respuesta no es JSON válido:", text);
          showError("Error: Respuesta inválida del servidor");
        }
      })
      .catch((err) => {
        console.error("Error completo:", err);
        console.error("Stack trace:", err.stack);
        showError(`Error de conexión: ${err.message}`);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = isEdit ? '<i class="fas fa-edit"></i> Actualizar' : '<i class="fas fa-save"></i> Guardar Cliente';
      });
  }

  // ------------------------------------------------------------
  //      Validación del formulario
  // ------------------------------------------------------------
  function validateForm() {
    clearErrors();
    let isValid = true;

    const cardNumber = document.getElementById("clientCardNumber").value.trim();
    const cedula = document.getElementById("clientCedula").value.trim();
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const birthday = document.getElementById("clientBirthday").value.trim();
    const origin = document.getElementById("clientOrigin").value.trim();
    const cardDate = document.getElementById("clientCardDate").value;

    // Validar número de tarjeta
    if (cardNumber && !/^\d{1,10}$/.test(cardNumber)) {
      showFieldError("cardNumberError", "Número de tarjeta inválido (1-10 dígitos)");
      isValid = false;
    }

    // Validar cédula
    if (!cedula || !/^\d{8,15}$/.test(cedula)) {
      showFieldError("cedulaError", "Cédula debe tener 8-15 dígitos");
      isValid = false;
    }

    // Validar nombre
    if (!name || name.length < 2) {
      showFieldError("nameError", "Nombre debe tener al menos 2 caracteres");
      isValid = false;
    }

    // Validar teléfono
    if (!phone || !/^\d{8,15}$/.test(phone)) {
      showFieldError("phoneError", "Teléfono debe tener 8-15 dígitos");
      isValid = false;
    }

    // Validar cumpleaños (formato DD/MM)
    if (!birthday || !/^\d{2}\/\d{2}$/.test(birthday)) {
      showFieldError("birthdayError", "Formato debe ser DD/MM");
      isValid = false;
    } else {
      const [day, month] = birthday.split("/").map(Number);
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        showFieldError("birthdayError", "Fecha inválida");
        isValid = false;
      }
    }

    // Validar origen
    if (!origin || origin.length < 2) {
      showFieldError("originError", "Lugar de origen debe tener al menos 2 caracteres");
      isValid = false;
    }

    // Validar fecha de entrega
    if (!cardDate) {
      showFieldError("cardDateError", "Seleccione la fecha de entrega");
      isValid = false;
    }

    return isValid;
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".error-msg");
    errorElements.forEach((el) => (el.textContent = ""));
  }

  function showFieldError(elementId, message) {
    document.getElementById(elementId).textContent = message;
  }

  // ------------------------------------------------------------
  //      Resetear formulario
  // ------------------------------------------------------------
  function resetForm() {
    clientForm.reset();
    clearErrors();
    currentClientId = null;
    document.getElementById("clientCedula").readOnly = false;
    saveBtn.style.display = "block";
    editBtn.style.display = "none";

    // Restablecer checkboxes de alergias
    const alergiasCheckboxes = document.querySelectorAll('input[name="alergias"]');
    alergiasCheckboxes.forEach(cb => cb.checked = false);
    otroAlergiaGroup.style.display = 'none';
    if (otraAlergiaInput) {
      otraAlergiaInput.required = false;
      otraAlergiaInput.value = '';
    }

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("clientCardDate").value = today;
  }

  // ------------------------------------------------------------
  //      Filtrar clientes
  // ------------------------------------------------------------
  function filterClients() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
      renderClients(allClients);
      return;
    }

    const filtered = allClients.filter((client) =>
      client.nombre.toLowerCase().includes(searchTerm) ||
      client.cedula.includes(searchTerm) ||
      (client.num_tarjeta && client.num_tarjeta.includes(searchTerm)) ||
      client.telefono.includes(searchTerm) ||
      client.lugar_origen.toLowerCase().includes(searchTerm)
    );

    renderClients(filtered);
  }

  // ------------------------------------------------------------
  //      Funciones de notificación
  // ------------------------------------------------------------
  function showSuccess(message) {
    // Mostrar modal de éxito solo para registro de clientes
    if (message.includes("registrado correctamente")) {
      if (successModal) {
        successModal.style.display = 'flex';
        return;
      }
    }
    
    // Para otros casos, mantener la notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  function showError(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // ------------------------------------------------------------
  //      Funciones del modal (si existe)
  // ------------------------------------------------------------
  function closeModal() {
    const modal = document.getElementById("confirmationModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  function continueAfterSuccess() {
    closeModal();
    resetForm();
  }

  // ------------------------------------------------------------
  //      Funciones del modal de éxito
  // ------------------------------------------------------------
  function goToMainMenu() {
    window.location.href = "MenuPrincipal.html";
  }

  function addAnotherClient() {
    if (successModal) {
      successModal.style.display = 'none';
    }
    resetForm();
    switchTab("register");
  }

  function closeSuccessModal() {
    if (successModal) {
      successModal.style.display = 'none';
    }
  }

  // ------------------------------------------------------------
  //      Configurar listener para "motivo otro"
  // ------------------------------------------------------------
  const changeReasonSelect = document.getElementById('changeReason');
  if (changeReasonSelect) {
    changeReasonSelect.addEventListener('change', function() {
      const otherReasonGroup = document.getElementById('otherReasonGroup');
      if (this.value === 'Otro') {
        otherReasonGroup.style.display = 'block';
      } else {
        otherReasonGroup.style.display = 'none';
      }
    });
  }
});
