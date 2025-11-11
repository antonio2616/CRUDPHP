// Ruta del archivo PHP que maneja las peticiones (API REST con MySQL)
const API = "../api/usuarios.php";

// Atajo para seleccionar elementos del DOM fácilmente
const $ = s => document.querySelector(s);

// Cuerpo de la tabla donde se mostrarán los registros
const $tb = $("#tabla tbody");

// Variable que guarda el ID del usuario que se está editando
let editingId = null;

// Variable para controlar la cámara (stream de video)
let stream = null;



// SECCIÓN DE CÁMARA


// 🔹 Activa la cámara del dispositivo
$("#btnCam").onclick = async () => {
  try {
    // Pide permiso y activa la cámara
    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    // Muestra el video en tiempo real dentro del elemento <video>
    $("#video").srcObject = stream;

    // Habilita los botones de "Tomar foto" y "Eliminar"
    $("#btnShot").disabled = false;
    $("#btnDelPhoto").disabled = false;
  } catch (err) {
    // Si el usuario niega el acceso o no hay cámara disponible
    alert("No se pudo acceder a la cámara: " + err.message);
  }
};

// 🔹 Toma una fotografía del video y la convierte a base64
$("#btnShot").onclick = () => {
  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d");

  // Dibuja el fotograma actual del video en el canvas (imagen estática)
  ctx.drawImage($("#video"), 0, 0, canvas.width, canvas.height);

  // Convierte el contenido del canvas a imagen codificada Base64
  const data = canvas.toDataURL("image/jpeg");

  // Guarda la imagen en el campo oculto y muestra vista previa
  $("#b64").value = data;
  $("#preview").src = data;

  // Habilita el botón de "Reintentar"
  $("#btnRetry").disabled = false;
};

// 🔹 Permite borrar la foto actual y tomar otra
$("#btnRetry").onclick = () => {
  $("#b64").value = "";
  $("#preview").src = "";
};

// Elimina la foto y apaga la cámara completamente
$("#btnDelPhoto").onclick = () => {
  // Detiene el stream de la cámara
  if (stream) stream.getTracks().forEach(t => t.stop());

  // Limpia la imagen y desactiva botones
  $("#b64").value = "";
  $("#preview").src = "";
  $("#btnShot").disabled = true;
  $("#btnRetry").disabled = true;
  $("#btnDelPhoto").disabled = true;
};



// FUNCIONES AUXILIARES


// Recolecta todos los valores del formulario para enviarlos al backend
const datos = () => ({
  nombre: $("#nombre").value,
  apellido_p: $("#ap_p").value,
  apellido_m: $("#ap_m").value,
  curp: $("#curp").value,
  nacimiento: $("#nac").value,
  genero: $("#genero").value,
  login: $("#login").value,
  pwd: $("#pwd").value,
  foto_base64: $("#b64").value || null
});

// Función general para enviar peticiones POST al API (usando fetch y JSON)
async function post(op, extra = {}) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, ...extra })
  });
  return r.json(); // Devuelve la respuesta convertida en objeto
}

// Función para mostrar los registros dentro de la tabla HTML
function render(rows) {
  $tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.foto_base64 ? `<img src="${r.foto_base64}" width="50">` : "-"}</td>
      <td>${r.nombre}</td>
      <td>${r.apellido_p}</td>
      <td>${r.apellido_m}</td>
      <td>${r.nacimiento}</td>
      <td>${r.genero}</td>
      <td>${r.curp}</td>
      <td>
        <!-- Botones de acciones dentro de cada fila -->
        <button class="btn btn-sm btn-info" onclick="editar(${r.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="borrar(${r.id})">Borrar</button>
      </td>
    </tr>`).join("");
}



//  BOTONES PRINCIPALES DEL CRUD


// Consulta ascendente (A-Z)
$("#btnAsc").onclick = async () => {
  const j = await post("CONSULTAS_ASC");
  if (j.ok) render(j.data);
};

// Consulta descendente (Z-A)
$("#btnDesc").onclick = async () => {
  const j = await post("CONSULTAS_DESC");
  if (j.ok) render(j.data);
};

// Alta de nuevo usuario
$("#btnAltas").onclick = async () => {
  const j = await post("ALTAS", datos());
  if (j.ok) {
    alert("Alta realizada correctamente ✅");
    limpiarFormulario();      // Limpia los campos
    $("#btnAsc").click();     // Refresca la tabla
  } else {
    alert("Error al guardar: " + (j.error || ''));
  }
};

// Guardar cambios (editar registro existente)
$("#btnCambios").onclick = async () => {
  if (!editingId) return alert("Selecciona un registro");
  const j = await post("CAMBIOS", { id: editingId, ...datos() });
  if (j.ok) {
    alert("Cambio guardado correctamente ✅");
    limpiarFormulario();
    $("#btnAsc").click();  // Actualiza tabla
    editingId = null;
  }
};

// 🔹 Limpia todos los campos del formulario
$("#btnLimpiar").onclick = () =>
  document.querySelectorAll("input,textarea").forEach(e => e.value = "");



// ELIMINAR Y EDITAR REGISTROS


// 🔹 Eliminar registro
window.borrar = async (id) => {
  if (confirm("¿Eliminar este registro?")) {
    const j = await post("BAJAS", { id });
    if (j.ok) $("#btnAsc").click(); // Refresca la tabla
  }
};

// 🔹 Cargar un registro en el formulario para editarlo
window.editar = async (id) => {
  const j = await post("CONSULTAS_ASC");
  if (!j.ok || !j.data) {
    alert("No se pudo obtener la información del usuario.");
    return;
  }

  // Busca el registro con el ID seleccionado
  const u = j.data.find(x => x.id == id);
  if (!u) {
    alert("Registro no encontrado.");
    return;
  }

  // Guarda el ID actual
  editingId = id;

  // Llena los campos del formulario con los datos del registro
  $("#nombre").value = u.nombre || "";
  $("#ap_p").value = u.apellido_p || "";
  $("#ap_m").value = u.apellido_m || "";
  $("#curp").value = u.curp || "";
  $("#nac").value = u.nacimiento || "";
  $("#genero").value = u.genero || "Indef.";
  $("#login").value = u.login || "";
  $("#pwd").value = ""; // Por seguridad, nunca se muestra la contraseña
  $("#b64").value = u.foto_base64 || "";

  // Si hay una foto guardada, la muestra
  if (u.foto_base64) {
    $("#preview").src = u.foto_base64;
    $("#preview").style.display = "block";
  } else {
    $("#preview").src = "";
    $("#preview").style.display = "none";
  }

  // Apaga la cámara si estaba encendida
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  // Oculta video y canvas, dejando solo la imagen previa
  $("#video").style.display = "none";
  $("#canvas").style.display = "none";
  $("#btnShot").disabled = false;
  $("#btnRetry").disabled = true;
  $("#btnDelPhoto").disabled = false;

  alert("Modo edición activo. Realiza tus cambios y presiona CAMBIOS.");
};



// FUNCIÓN DE LIMPIEZA DEL FORMULARIO


function limpiarFormulario() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.type === "select-one") {
      el.selectedIndex = 0;   // Restaura opción "Indef."
    } else {
      el.value = "";
    }
  });

  // Limpia imagen y apaga la cámara
  $("#preview").src = "";
  $("#b64").value = "";
  $("#video").style.display = "none";
  $("#canvas").style.display = "none";
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

// CARGA AUTOMÁTICA DE REGISTROS AL ABRIR LA PÁGINA


document.addEventListener("DOMContentLoaded", async () => {
  // Llama automáticamente a la consulta ascendente
  const j = await post("CONSULTAS_ASC");
  if (j.ok) render(j.data);
});
