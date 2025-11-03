/**
 * MenuPrincipal.js
 *
 * Script principal para la gestión del menú y panel principal del sistema.
 * Incluye manejo de eventos, validación de formularios y comunicación con el backend.
 *
 * Funcionalidad principal:
 * - Gestión de accesos y permisos
 * - Envío de mensajes por WhatsApp
 * - Manejo de la interfaz principal y modales
 */
document.addEventListener("DOMContentLoaded", () => {
    // Variables globales
    let dashboardData = {};
    let earningsChart = null;

    // Elementos del DOM
    const welcomeUserName = document.getElementById("welcomeUserName");
    const logoutBtn = document.getElementById("logoutBtn");
    const btnCrearUsuario = document.getElementById("btnCrearUsuario");
    const btnRegistrarClientes = document.getElementById("btnRegistrarClientes");
    const btnTarjetasVIP = document.getElementById("btnTarjetasVIP");
    const btnEditarPerfil = document.getElementById("btnEditarPerfil");
    const btnManualTecnico = document.getElementById("btnManualTecnico");
    const btnManualUsuario = document.getElementById("btnManualUsuario");

    // 1. Verificar autenticación
    const userSession = localStorage.getItem("currentUser");
    if (!userSession) {
        window.location.href = "autenticacion.html";
        return;
    }

    // Parsear datos del usuario
    let currentUser;
    try {
        currentUser = JSON.parse(userSession);
        if (!currentUser.id || !currentUser.rol) {
            throw new Error("Datos de usuario incompletos");
        }
    } catch (error) {
        console.error("Error al parsear datos de usuario:", error);
        localStorage.removeItem("currentUser");
        window.location.href = "autenticacion.html";
        return;
    }

    // ---- Dashboard stats ----
    const loadDashboardStats = async () => {
        try {
            const response = await fetch("php/dashboard.php");
            const data = await response.json();

            if (data.success) {
                dashboardData = data;

                // Contadores
                document.getElementById("newClientsCount").textContent = data.newClients;
                document.getElementById("birthdaysCount").textContent = data.upcomingBirthdays;
                document.getElementById("frequentClientsCount").textContent = data.frequentClients;

                // Ganancias
                document.getElementById("dailyEarnings").textContent = `₡${data.dailyEarnings}`;
                document.getElementById("weeklyEarnings").textContent = `₡${data.weeklyEarnings}`;
                document.getElementById("monthlyEarnings").textContent = `₡${data.monthlyEarnings}`;
            } else {
                console.error("Error loading dashboard stats:", data.error);
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    // ---- Chart ----
    const loadChartData = async (period = "day") => {
        try {
            const response = await fetch(`php/chart-data.php?period=${period}`);
            const data = await response.json();

            if (data.success) {
                updateChart(data.chart);
            } else {
                console.error("Error loading chart data:", data.error);
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
        }
    };

    const updateChart = (chartData) => {
        const canvas = document.getElementById("earningsChartCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (earningsChart) earningsChart.destroy();

        earningsChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: "Ganancias (₡)",
                        data: chartData.data,
                        borderColor: "#007bff",
                        backgroundColor: "rgba(0, 123, 255, 0.1)",
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: "#007bff",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartData.title,
                        font: { size: 16, weight: "bold" },
                    },
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return "₡" + value.toLocaleString();
                            },
                        },
                    },
                    x: { grid: { display: false } },
                },
                interaction: { intersect: false, mode: "index" },
                elements: { point: { hoverBackgroundColor: "#007bff" } },
            },
        });
    };

    // ---- Modales ----
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            populateModal(modalId);
        }
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };

    const populateModal = (modalId) => {
        let data, containerId, templateFn;

        switch (modalId) {
            case "newClientsModal":
                data = dashboardData.newClientsList || [];
                containerId = "newClientsModalList";
                templateFn = (item) => `
          <div class="client-item">
            <div class="client-avatar">${item.nombre.charAt(0).toUpperCase()}</div>
            <div class="client-info">
              <div class="client-name">${item.nombre}</div>
              <div class="client-detail">Registrado: ${item.fecha}</div>
            </div>
            <div class="client-badge">Nuevo</div>
          </div>`;
                break;

            case "birthdaysModal":
                data = dashboardData.birthdaysList || [];
                containerId = "birthdaysModalList";
                templateFn = (item) => `
                    <div class="client-item">
                        <div class="client-avatar">${item.nombre.charAt(0).toUpperCase()}</div>
                        <div class="client-info">
                            <div class="client-name">${item.nombre}</div>
                            <div class="client-detail">Cumpleaños: ${item.fecha}</div>
                        </div>
                        <div class="client-actions">
                            <div class="client-badge" style="background:var(--secondary);">🎂</div>
                            ${item.telefono && item.telefono !== ""
                                ? `<button class="whatsapp-btn" data-telefono="${item.telefono}" data-nombre="${encodeURIComponent(item.nombre)}" title="Enviar mensaje de cumpleaños">
                                            <i class="fab fa-whatsapp"></i>
                                        </button>`
                                : '<span class="no-phone">Sin teléfono</span>'
                            }
                        </div>
                    </div>`;
                break;

            case "frequentClientsModal":
                data = dashboardData.frequentClientsList || [];
                containerId = "frequentClientsModalList";
                templateFn = (item) => `
          <div class="client-item">
            <div class="client-avatar">${item.nombre.charAt(0).toUpperCase()}</div>
            <div class="client-info">
              <div class="client-name">${item.nombre}</div>
              <div class="client-detail">${item.compras}</div>
            </div>
            <div class="client-badge" style="background:var(--primary-dark);">VIP</div>
          </div>`;
                break;

            default:
                return;
        }

        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML =
                data.length > 0
                    ? data.map(templateFn).join("")
                    : '<p style="text-align:center;color:#666;font-style:italic;">No hay datos disponibles</p>';
        }
    };

    // Exponer función para WhatsApp
    window.sendBirthdayWhatsApp = function (telefono, nombre) {
        const cleanPhone = (telefono || '').replace(/[^0-9]/g, '');
        const cleanName = (nombre || '').toString().trim();
        if (!cleanPhone) { alert('Teléfono inválido o vacío'); return; }
        if (!cleanName) { alert('Nombre inválido o vacío'); return; }

        const finalPhone = cleanPhone.startsWith('506') ? cleanPhone : '506' + cleanPhone;

        // Emojis por código (no dependen de codificación del archivo)
        const mensaje = [
            '\u{1F389} *¡Feliz cumpleaños, ' + cleanName + '!* \u{1F382}',         // 🎉 🎂
            '',
            '¡En *Bastos Restaurante* queremos celebrar tu día especial contigo!',
            '',
            '\u2022 \u{1F381} Tenemos una sorpresa especial para ti en tu cumpleaños', // • 🎁
            '\u2022 \u{1F37D}\uFE0F Ven a disfrutar de nuestros mejores platillos',     // • 🍽️
            '\u2022 \u{1F451} Como cliente VIP, mereces lo mejor',                      // • 👑
            '',
            '¡Te esperamos para hacer de tu cumpleaños una celebración inolvidable!',
            '',
            'Reserva tu mesa llamando o visitándonos.',
            '',
            '¡Que tengas un día maravilloso! \u2728',                                   // ✨
            '',
            '- *Equipo Bastos Restaurante*'
        ].join('\n');

        // Detectar móvil vs escritorio
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Forzar Web en escritorio; API en móvil
        const base = isMobile
            ? 'https://api.whatsapp.com/send'
            : 'https://web.whatsapp.com/send';

        const params = new URLSearchParams({ phone: finalPhone, text: mensaje });
        const url = `${base}?${params.toString()}`;

    // URL generada para WhatsApp (útil para depuración, eliminar en producción)
        const win = window.open(url, '_blank');
        if (!win) window.location.href = url;
    };


    // ---- UI Usuario ----
    const updateUserInfo = () => {
        if (welcomeUserName) welcomeUserName.textContent = currentUser.nombre || "Usuario";
        const sidebarUserName = document.getElementById("sidebarUserName");
        if (sidebarUserName) sidebarUserName.textContent = currentUser.nombre || "Usuario";
    };

    // ---- Filtros del gráfico ----
    const setupChartFilters = () => {
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                filterButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                const period = btn.dataset.period;
                loadChartData(period);
            });
        });
    };

    // ---- Navegación y eventos ----
    const setupEventListeners = () => {
        // Tarjetas → abrir modal
        document.querySelectorAll(".clickable-card").forEach((card) => {
            card.addEventListener("click", () => {
                const modalId = card.getAttribute("data-modal");
                if (modalId) openModal(modalId);
            });
        });

        // Cerrar modal
        document.querySelectorAll(".close").forEach((closeBtn) => {
            closeBtn.addEventListener("click", () => {
                const modalId = closeBtn.getAttribute("data-modal");
                if (modalId) closeModal(modalId);
            });
        });

        // WhatsApp botón cumpleaños (delegado por si se repinta)
        document.body.addEventListener('click', function(e) {
            if (e.target.closest('.whatsapp-btn')) {
                const btn = e.target.closest('.whatsapp-btn');
                const telefono = btn.getAttribute('data-telefono');
                const nombre = decodeURIComponent(btn.getAttribute('data-nombre'));
                if (telefono && nombre) {
                    sendBirthdayWhatsApp(telefono, nombre);
                }
            }
        });

        // Click fuera del modal
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) closeModal(modal.id);
            });
        });

        // Mostrar botones según rol
        if ((currentUser.rol === "Desarrollador" || currentUser.rol === "Propietario") && btnCrearUsuario) {
            btnCrearUsuario.style.display = "flex";
        }
        if (currentUser.rol === "Salonero" && btnTarjetasVIP) {
            btnTarjetasVIP.style.display = "flex";
        }

        // Navegación
        const setupNavItem = (element, pageUrl) => {
            if (!element) return;
            element.addEventListener("click", (e) => {
                e.preventDefault();

                if (pageUrl === "CrearUsuarios.html" && !["Desarrollador", "Propietario"].includes(currentUser.rol)) {
                    alert("No tienes permisos para acceder a esta sección.");
                    return;
                }
                if (pageUrl === "tarjetas.html" && currentUser.rol !== "Salonero") {
                    alert("No tienes permisos para acceder a esta sección.");
                    return;
                }
                window.location.href = pageUrl;
            });
        };

        setupNavItem(btnRegistrarClientes, "RegistrarClientes.html");
        setupNavItem(btnTarjetasVIP, "tarjetas.html");
        setupNavItem(btnEditarPerfil, "EditarPerfil.html");
        setupNavItem(btnCrearUsuario, "CrearUsuarios.html");
        setupNavItem(btnManualTecnico, "manualTecnico.html");
        setupNavItem(btnManualUsuario, "manualUsuario.html");

        // Historial de Ventas
        const btnHistorialVentas = document.getElementById("btnHistorialVentas");
        if (btnHistorialVentas) {
            btnHistorialVentas.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = "HistorialVentas.html";
            });
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("currentUser");
                window.location.href = "autenticacion.html";
            });
        }
    };

    // ---- Fecha y hora ----
    function updateDateTime() {
        const now = new Date();
        const optionsDate = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit" };

        const dateElement = document.getElementById("currentDate");
        if (dateElement) dateElement.textContent = now.toLocaleDateString("es-ES", optionsDate);

        const timeElement = document.getElementById("currentTime");
        if (timeElement) timeElement.textContent = now.toLocaleTimeString("es-ES", optionsTime);
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // ---- Inicialización ----
    const initializeApp = () => {
        updateUserInfo();
        setupEventListeners();
        setupChartFilters();
        loadDashboardStats();
        loadChartData("day");

        // Animación suave
        document.body.style.opacity = "0";
        setTimeout(() => {
            document.body.style.transition = "opacity 0.5s ease";
            document.body.style.opacity = "1";
        }, 100);
    };

    initializeApp();
});
