/**
 * tarjetas.js
 *
 * Script para la gestión de tarjetas VIP y compras asociadas.
 * Incluye búsqueda, registro, eliminación y validación de clientes y compras.
 *
 * Funcionalidad principal:
 * - Búsqueda y validación de tarjetas VIP
 * - Registro y eliminación de compras
 * - Manejo de errores y mensajes al usuario
 */
// -------------------- Elementos del DOM --------------------
const searchForm = document.getElementById("searchForm");
const cardNumberInput = document.getElementById("cardNumber");
const searchBtn = document.getElementById("searchBtn");
const clientInfo = document.getElementById("clientInfo");
const birthdayModal = document.getElementById("birthdayModal");

// -----------------------------------------------------------
let birthdayShown = false; // evita mostrar el modal varias veces
// -----------------------------------------------------------

// Event listeners
searchForm.addEventListener("submit", handleSearch);
cardNumberInput.addEventListener("input", handleCardInput);

// Simular lectura de código de barras (Enter)
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && cardNumberInput.value) handleSearch(e);
});

// --------------------------- Funciones ---------------------------

function handleCardInput() {
  searchBtn.disabled = cardNumberInput.value.trim().length === 0;
}

function handleSearch(e) {
  e.preventDefault();

  // Obtener número de tarjeta (solo quitar espacios extras)
  const cardNumber = cardNumberInput.value.trim();
  if (!cardNumber) {
    alert("Por favor ingrese el número de tarjeta VIP");
    return;
  }

  // Reset panel y botón
  clientInfo.classList.remove("show");
  searchBtn.disabled = true;
  searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';

  // Petición al servidor (ruta absoluta)
  fetch("php/buscarClientes.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ num_tarjeta: cardNumber }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.data) {
        displayClientInfo(data.data);
        checkBirthday(data.data);
      } else {
        alert(
          data.message ||
            "Cliente VIP no encontrado. Verifique el número de tarjeta."
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al buscar el cliente.");
    })
    .finally(() => {
      searchBtn.disabled = false;
      searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar Cliente';
    });
}

function displayClientInfo(client) {
  // Nombre completo y cumpleaños
  document.getElementById("clientName").textContent = client.nombre;
  document.getElementById(
    "clientBirthday"
  ).innerHTML = `<i class="fas fa-birthday-cake"></i> ${formatDate(
    client.fecha_cumpleanos
  )}`;

  // Mostrar número de tarjeta
  document.getElementById(
    "clientCardNumber"
  ).innerHTML = `<i class="fas fa-id-card"></i> Tarjeta VIP: ${client.num_tarjeta}`;

  // Avatar (iniciales)
  const initials = client.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);
  document.getElementById("clientAvatar").textContent = initials;

  // Antigüedad (años desde la fecha de entrega de la tarjeta)
  const memberSince = document.getElementById("memberSince");
  if (memberSince && client.fecha_entrega_tarjeta) {
    const fechaEntrega = new Date(client.fecha_entrega_tarjeta);
    const hoy = new Date();

    const diffMs = hoy - fechaEntrega;
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let mensaje = "";

    if (diffDias === 0) {
      mensaje = "Hoy";
    } else if (diffDias < 30) {
      mensaje = `Hace ${diffDias} día${diffDias !== 1 ? "s" : ""}`;
    } else if (diffDias < 365) {
      const meses = Math.round(diffDias / 30);
      mensaje = `Hace ${meses} mes${meses !== 1 ? "es" : ""}`;
    } else {
      const años = Math.round(diffDias / 365);
      mensaje = `Hace ${años} año${años !== 1 ? "s" : ""}`;
    }

    memberSince.innerHTML = `<i class="fas fa-star"></i> Miembro VIP desde ${mensaje}`;

    // Badge si tiene más de 2 años
    if (diffDias >= 365 * 2) {
      memberSince.innerHTML +=
        ' <span class="vip-badge">⭐ Cliente leal</span>';
    }
  }

  document
    .getElementById("clientInfo")
    .setAttribute("data-cedula", client.cedula);
  clientInfo.classList.add("show");
  cargarComprasCliente(client.cedula);
}

function checkBirthday(client) {
  if (birthdayShown || !client.fecha_cumpleanos) return;

  const today = new Date();
  let birthdayDate;

  // Si la fecha está en formato dd/mm
  if (
    client.fecha_cumpleanos.includes("/") &&
    !client.fecha_cumpleanos.includes("-")
  ) {
    const [day, month] = client.fecha_cumpleanos.split("/");
    // Usar el año actual para la comparación
    birthdayDate = new Date(
      today.getFullYear(),
      parseInt(month) - 1,
      parseInt(day)
    );
  } else {
    // Si es una fecha completa
    birthdayDate = new Date(client.fecha_cumpleanos);
  }

  // Calcular lunes‑domingo de la semana actual
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 (lunes)‑7 (domingo)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const thisYearsBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getMonth(),
    birthdayDate.getDate()
  );

  if (thisYearsBirthday >= startOfWeek && thisYearsBirthday <= endOfWeek) {
    birthdayShown = true;
    showBirthdayModal(client.nombre);
  }
}

function showBirthdayModal(clientName) {
  const firstName = clientName.split(" ")[0];
  document.getElementById(
    "birthdayMessage"
  ).textContent = `¡${firstName} está de cumpleaños esta semana! 🎂`;

  birthdayModal.classList.add("active");
  createBirthdayAnimations();
}

function createBirthdayAnimations() {
  const modal = document.querySelector(".birthday-content");

  // Globos
  for (let i = 0; i < 10; i++) {
    const balloon = document.createElement("div");
    balloon.className = "balloon";
    balloon.textContent = "🎈";
    balloon.style.left = Math.random() * 100 + "%";
    balloon.style.animationDelay = Math.random() * 2 + "s";
    modal.appendChild(balloon);
  }

  // Confeti
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.animationDelay = Math.random() * 3 + "s";
    modal.appendChild(confetti);
  }
}

function getRandomColor() {
  const colors = [
    "#d4af37",
    "#28a745",
    "#dc3545",
    "#ffc107",
    "#17a2b8",
    "#6f42c1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function closeBirthdayModal() {
  birthdayModal.classList.remove("active");
  setTimeout(() => {
    document
      .querySelectorAll(".balloon, .confetti")
      .forEach((el) => el.remove());
  }, 500);
}

function formatDate(dateString) {
  // Si la fecha está en formato dd/mm (sin año)
  if (dateString && dateString.includes("/") && !dateString.includes("-")) {
    return dateString; // Devolver tal como está: "24/10"
  }

  // Si es una fecha completa, formatearla
  if (dateString && dateString.length > 5) {
    try {
      return new Date(dateString).toLocaleDateString("es-CR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString; // Si hay error, devolver el string original
    }
  }

  return dateString || "No disponible";
}

// Foco inicial
document.addEventListener("DOMContentLoaded", () => {
  cardNumberInput.focus();
  loadUserInfo();
});

document.addEventListener("DOMContentLoaded", () => {
  const modalCompra = document.getElementById("modalCompra");
  const formCompra = document.getElementById("formCompra");
  const cedulaClienteInput = document.getElementById("cedulaClienteInput");
  const montoInput = document.getElementById("montoInput");
  const fechaInput = document.getElementById("fechaInput");

  // Abrir modal y precargar fecha actual (hacerla global con window)
  window.abrirModalCompra = function () {
    document.getElementById("formCompra").reset();
    document.getElementById("idCompraInput").value = ""; // Limpia el ID
    document.getElementById("formCompra").setAttribute("data-mode", "crear");

    const cedulaCliente = document
      .getElementById("clientInfo")
      .getAttribute("data-cedula");

    if (!cedulaCliente) {
      alert("No se ha cargado ningún cliente.");
      return;
    }

    document.getElementById("cedulaClienteInput").value = cedulaCliente;
    document.getElementById("fechaInput").value = new Date()
      .toISOString()
      .split("T")[0];

    document.getElementById("modalCompra").classList.add("show");
    document.getElementById("montoInput").focus();
  };

  // Cerrar modal
  window.cerrarModalCompra = function () {
    modalCompra.classList.remove("show");
    formCompra.reset();
  };

  // Enviar datos
  formCompra.addEventListener("submit", function (e) {
    e.preventDefault();

    const modo = formCompra.getAttribute("data-mode");
    const cedula = cedulaClienteInput.value.trim();
    const rawMonto = montoInput.value.trim().replace(/[.,](?=\d{3})/g, "");
    const monto = parseFloat(rawMonto.replace(",", "."));
    const fecha = fechaInput.value;
    const id_compra = document.getElementById("idCompraInput").value;

    if (!cedula || isNaN(monto) || monto <= 0 || !fecha) {
      alert("Por favor complete todos los campos correctamente.");
      return;
    }

    const datos = {
      action: modo === "editar" ? "editar" : "crear",
      cedula_cliente: cedula,
      monto: monto,
      fecha_compra: fecha,
    };

    if (modo === "editar") datos.id_compra = id_compra;

    fetch("php/compras.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(datos),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(
            "Compra " +
              (modo === "editar" ? "editada" : "registrada") +
              " correctamente."
          );
          cerrarModalCompra();
          cargarComprasCliente(cedula);
        } else {
          alert("Error: " + (data.message || "No se pudo procesar la compra."));
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Error de red o servidor.");
      });
  });
});

function cargarComprasCliente(cedula) {
  fetch("php/compras.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "ver", cedula: cedula }),
  })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("tablaComprasBody");
      const totalCell = document.getElementById("totalCompras");
      tbody.innerHTML = "";

      if (data.success && data.compras.length > 0) {
        data.compras.forEach((compra, index) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
  <td>${index + 1}</td>
  <td>₡${parseFloat(compra.monto).toLocaleString("es-CR")}</td>
  <td>${compra.fecha_compra}</td>
  <td>
  <button class="accion-boton editar" title="Editar" onclick="editarCompra('${
    compra.id_compra
  }', '${compra.monto}', '${compra.fecha_compra}')">
    <i class="fas fa-edit"></i>
  </button>
  <button class="accion-boton eliminar" title="Eliminar" onclick="eliminarCompra('${
    compra.id_compra
  }')">
    <i class="fas fa-trash-alt"></i>
  </button>
</td>

`;

          tbody.appendChild(tr);
        });
        totalCell.textContent =
          "₡" + parseFloat(data.total).toLocaleString("es-CR");
      } else {
        tbody.innerHTML =
          '<tr><td colspan="3">No hay compras registradas</td></tr>';
        totalCell.textContent = "₡0";
      }
    })
    .catch((err) => {
      console.error("Error al cargar compras:", err);
    });
}

function editarCompra(id, monto, fecha) {
  document.getElementById("formCompra").reset();
  document.getElementById("idCompraInput").value = id;
  document.getElementById("montoInput").value = monto;
  document.getElementById("fechaInput").value = fecha;
  document.getElementById("formCompra").setAttribute("data-mode", "editar");

  const cedula = document
    .getElementById("clientInfo")
    .getAttribute("data-cedula");
  document.getElementById("cedulaClienteInput").value = cedula;

  document.getElementById("modalCompra").classList.add("show");
}

function eliminarCompra(id) {
  if (!confirm("¿Está seguro de eliminar esta compra?")) return;

  fetch("php/compras.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "eliminar", id_compra: id }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Compra eliminada correctamente.");
        const cedula = document
          .getElementById("clientInfo")
          .getAttribute("data-cedula");
        cargarComprasCliente(cedula);
      } else {
        alert("Error al eliminar compra: " + data.message);
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Error al eliminar compra.");
    });
}

function loadUserInfo() {
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) {
    window.location.href = "autenticacion.html";
    return;
  }

  const currentUser = JSON.parse(storedUser);

  const formData = new URLSearchParams();
  formData.append("action", "obtener_usuarios");
  formData.append("id", currentUser.id);

  fetch("php/usuarios.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.data.length > 0) {
        const user = data.data[0];
        document.getElementById("userName").textContent = user.nombre;
        document.getElementById("userRole").textContent = user.rol;
  // Usuario cargado correctamente (eliminar en producción)
      } else {
        console.warn("⚠ No se encontró el usuario:", data);
      }
    })
    .catch((err) => {
      console.error("❌ Error cargando usuario:", err);
      window.location.href = "autenticacion.html";
    });
}
