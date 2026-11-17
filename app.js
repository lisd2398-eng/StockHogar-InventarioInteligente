// --- 0. INICIALIZACIÓN (Para cargar el modo oscuro guardado) ---
window.onload = function() {
    const modoOscuro = localStorage.getItem('modoOscuro') === 'true';
    if(modoOscuro) {
        document.body.classList.add('modo-oscuro');
        document.body.classList.remove('modo-claro');
        document.getElementById('toggle-modo-oscuro').checked = true;
    }
}

// --- 1. NAVEGACIÓN ---
function irA(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(idPantalla).classList.add('activa');
    
    if(idPantalla === 'pantalla-home') { actualizarHome(); }
    if(idPantalla === 'pantalla-inventario') { cargarInventario(); }
    if(idPantalla === 'pantalla-categorias') { cargarCategorias(); }
    if(idPantalla === 'pantalla-ajustes') { cargarAjustes(); }
}

function toggleAuth() {
    const login = document.getElementById('form-login');
    const reg = document.getElementById('form-registro');
    if(login.style.display === 'none') { login.style.display = 'block'; reg.style.display = 'none'; }
    else { login.style.display = 'none'; reg.style.display = 'block'; }
}

// --- 2. LOGIN Y REGISTRO ---
function registrarUsuario() {
    const nombre = document.getElementById('reg-nombre').value;
    const correo = document.getElementById('reg-correo').value;
    const pass = document.getElementById('reg-pass').value;
    const pass2 = document.getElementById('reg-pass2').value;

    if (nombre === "" || correo === "" || pass === "") { alert("Completa todos los campos."); return; }
    if (pass !== pass2) { alert("Las contraseñas no coinciden."); return; }

    localStorage.setItem('usuarioStockhogar', JSON.stringify({ nombre, correo, pass }));
    alert("¡Registro exitoso!");
    toggleAuth();
}

function iniciarSesion() {
    const correoInput = document.getElementById('login-correo').value;
    const passInput = document.getElementById('login-pass').value;
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioStockhogar'));

    if (usuarioGuardado && usuarioGuardado.correo === correoInput && usuarioGuardado.pass === passInput) {
        irA('pantalla-home');
        pedirPermisoNotificaciones();
    } else {
        alert("Datos incorrectos.");
    }
}

function cerrarSesion() {
    irA('pantalla-auth');
}

// --- 3. HOME Y ALERTAS ---
function actualizarHome() {
    const usuario = JSON.parse(localStorage.getItem('usuarioStockhogar'));
    if(usuario) document.getElementById('saludo-usuario').innerText = `¡Hola, ${usuario.nombre}!`;

    let inventario = JSON.parse(localStorage.getItem('inventarioStockhogar')) || [];
    
    let totalProductos = inventario.length;
    let porVencer = 0;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    inventario.forEach(prod => {
        if(prod.fecha) {
            const fechaVenc = new Date(prod.fecha);
            const diffDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24)); 
            if(diffDias >= 0 && diffDias <= 7) { porVencer++; }
        }
    });

    document.getElementById('total-productos').innerText = totalProductos;
    document.getElementById('total-por-vencer').innerText = porVencer;
    document.getElementById('badge-alertas').innerText = porVencer;

    // Solo lanzar notificación si está activada en ajustes
    const alertasActivas = localStorage.getItem('alertasActivas') !== 'false';
    if(porVencer > 0 && alertasActivas) { 
        lanzarNotificacion(`¡Atención! Tenés ${porVencer} producto(s) que vencen esta semana.`); 
    }
}

function pedirPermisoNotificaciones() {
    if ("Notification" in window) { Notification.requestPermission(); }
}

function lanzarNotificacion(mensaje) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Stockhogar", { body: mensaje, icon: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png" });
    }
}

// --- 4. AGREGAR PRODUCTO ---
function agregarProducto() {
    const codigo = document.getElementById('prod-codigo').value;
    const nombre = document.getElementById('prod-nombre').value;
    const categoria = document.getElementById('prod-categoria').value;
    const fecha = document.getElementById('prod-fecha').value;
    const cantidad = parseInt(document.getElementById('prod-cantidad').value);

    if (nombre === "" || fecha === "") { alert("El nombre y la fecha son obligatorios."); return; }

    let inventario = JSON.parse(localStorage.getItem('inventarioStockhogar')) || [];
    let index = inventario.findIndex(p => p.codigo === codigo && codigo !== "");

    if (index !== -1) {
        inventario[index].cantidad += cantidad;
        inventario[index].fecha = fecha;
        inventario[index].categoria = categoria;
        alert("Producto existente. Se sumaron unidades.");
    } else {
        inventario.push({ codigo: codigo, nombre: nombre, categoria: categoria, fecha: fecha, cantidad: cantidad });
        alert("Producto agregado.");
    }
    
    localStorage.setItem('inventarioStockhogar', JSON.stringify(inventario));
    limpiarFormulario();
    irA('pantalla-home');
}

function limpiarFormulario() {
    document.getElementById('prod-codigo').value = "";
    document.getElementById('prod-nombre').value = "";
    document.getElementById('prod-fecha').value = "";
    document.getElementById('prod-cantidad').value = "1";
}

// --- 5. INVENTARIO CON SEMÁFORO ---
function cargarInventario() {
    const listaHTML = document.getElementById('lista-productos');
    listaHTML.innerHTML = ""; 
    let inventario = JSON.parse(localStorage.getItem('inventarioStockhogar')) || [];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    if (inventario.length === 0) {
        listaHTML.innerHTML = "<p style='text-align:center;'>No hay productos.</p>";
        return;
    }

    inventario.forEach(prod => {
        if(prod.fecha) {
            const diff = new Date(prod.fecha) - hoy;
            prod.diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
            prod.diasRestantes = 9999;
        }
    });

    inventario.sort((a, b) => a.diasRestantes - b.diasRestantes);

    inventario.forEach((prod) => {
        let claseBorde = "borde-verde"; 
        if (prod.diasRestantes <= 7 && prod.diasRestantes >= 0) { claseBorde = "borde-rojo"; } 
        else if (prod.diasRestantes <= 30 && prod.diasRestantes > 7) { claseBorde = "borde-amarillo"; } 
        else if (prod.diasRestantes < 0) { claseBorde = "borde-rojo"; }

        const li = document.createElement('li');
        li.className = claseBorde;
        li.innerHTML = `
            <span class="cantidad-badge">Cant: ${prod.cantidad}</span>
            <strong>${prod.nombre}</strong>
            <span>Cat: ${prod.categoria || 'Sin categoría'}</span>
            <span>Vence: ${prod.fecha || 'Sin fecha'}</span>
            <span>Cód: ${prod.codigo || 'N/A'}</span>
            <div style="margin-top: 10px;">
                <button onclick="descontar('${prod.codigo}', '${prod.nombre}')" style="background:#ffebee; color:#d32f2f; border:none; padding:5px 10px; border-radius:5px; font-size:12px; cursor:pointer;">- Usar 1</button>
            </div>
        `;
        listaHTML.appendChild(li);
    });
}

function descontar(codigo, nombre) {
    let inventario = JSON.parse(localStorage.getItem('inventarioStockhogar')) || [];
    let index = inventario.findIndex(p => (codigo !== "" && p.codigo === codigo) || (codigo === "" && p.nombre === nombre));
    
    if(index !== -1 && inventario[index].cantidad > 0) {
        inventario[index].cantidad -= 1;
        localStorage.setItem('inventarioStockhogar', JSON.stringify(inventario));
        cargarInventario(); 
    } else {
        alert("No te queda stock de este producto.");
    }
}

// --- 6. CATEGORÍAS ---
const categoriasPredefinidas = [
    { nombre: "Lácteos y Huevos", icono: "fa-egg", color: "#ffeb3b" },
    { nombre: "Carnes y Fiambres", icono: "fa-drumstick-bite", color: "#f44336" },
    { nombre: "Frutas y Verduras", icono: "fa-apple-alt", color: "#4caf50" },
    { nombre: "Almacén (Secos)", icono: "fa-wheat-awn", color: "#ff9800" },
    { nombre: "Conservas", icono: "fa-box-open", color: "#2196f3" },
    { nombre: "Bebidas", icono: "fa-wine-bottle", color: "#9c27b0" },
    { nombre: "Congelados", icono: "fa-snowflake", color: "#00bcd4" }
];

function cargarCategorias() {
    const lista = document.getElementById('lista-categorias');
    if (!lista) return; 
    lista.innerHTML = "";
    categoriasPredefinidas.forEach(cat => {
        const li = document.createElement('li');
        li.style.cssText = "padding: 15px; border-bottom: 1px solid #eee; display: flex; align-items: center; cursor: pointer;";
        li.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${cat.color}20; color: ${cat.color}; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <i class="fas ${cat.icono}"></i>
            </div>
            <span style="font-weight: 600; font-size: 16px;">${cat.nombre}</span>
        `;
        lista.appendChild(li);
    });
}

// --- 7. AJUSTES ---
function cargarAjustes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioStockhogar'));
    if(usuario) { document.getElementById('nombre-ajustes').innerText = usuario.nombre; }
    
    // Cargar estado de notificaciones
    const alertasActivas = localStorage.getItem('alertasActivas') !== 'false';
    document.getElementById('toggle-notificaciones').checked = alertasActivas;
}

function cambiarModoOscuro() {
    const isChecked = document.getElementById('toggle-modo-oscuro').checked;
    if(isChecked) {
        document.body.classList.add('modo-oscuro');
        document.body.classList.remove('modo-claro');
        localStorage.setItem('modoOscuro', 'true');
    } else {
        document.body.classList.remove('modo-oscuro');
        document.body.classList.add('modo-claro');
        localStorage.setItem('modoOscuro', 'false');
    }
}

function guardarPreferenciaNotificaciones() {
    const isChecked = document.getElementById('toggle-notificaciones').checked;
    localStorage.setItem('alertasActivas', isChecked);
}

function borrarTodo() {
    if (confirm("¿Borrar TODO el inventario?")) {
        localStorage.removeItem('inventarioStockhogar');
        alert("Inventario borrado.");
        irA('pantalla-home');
    }
}

// --- 8. CÁMARA ---
function abrirEscaner() {
    irA('pantalla-agregar');
    setTimeout(() => { encenderCamara('prod-codigo', 'lector-agregar'); }, 500);
}

let escanerActivo = false;
let html5QrCode;

function encenderCamara(idInputDestino, divLector) {
    if (escanerActivo) return;
    html5QrCode = new Html5Qrcode(divLector);
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            document.getElementById(idInputDestino).value = decodedText;
            html5QrCode.stop().then(() => {
                document.getElementById(divLector).innerHTML = ""; 
                escanerActivo = false;
            }).catch(err => console.error(err));
        },
        (errorMessage) => { /* Ignorar */ }
    ).then(() => { escanerActivo = true; })
    .catch((err) => { alert("No se pudo acceder a la cámara."); });
}