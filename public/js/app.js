const API = "../api/usuarios.php";
const $ = s => document.querySelector(s);
const $tb = $("#tabla tbody");
let editingId = null;
let stream = null;

// Cámara
$("#btnCam").onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    $("#video").srcObject = stream;
    $("#btnShot").disabled = false;
    $("#btnDelPhoto").disabled = false;
  } catch (err) {
    alert("No se pudo acceder a la cámara: " + err.message);
  }
};

$("#btnShot").onclick = () => {
  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage($("#video"), 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL("image/jpeg");
  $("#b64").value = data;
  $("#preview").src = data;
  $("#btnRetry").disabled = false;
};

$("#btnRetry").onclick = () => { $("#b64").value = ""; $("#preview").src = ""; };
$("#btnDelPhoto").onclick = () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  $("#b64").value = "";
  $("#preview").src = "";
  $("#btnShot").disabled = true;
  $("#btnRetry").disabled = true;
  $("#btnDelPhoto").disabled = true;
};

// Helpers
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

async function post(op, extra={}) {
  const r = await fetch(API, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({op, ...extra})
  });
  return r.json();
}

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
        <button class="btn btn-sm btn-info" onclick="editar(${r.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="borrar(${r.id})">Borrar</button>
      </td>
    </tr>`).join("");
}

$("#btnAsc").onclick = async () => { 
    const j = await post("CONSULTAS_ASC"); 
    if(j.ok) 
        render(j.data); 
};

$("#btnDesc").onclick = async () => { 
    const j = await post("CONSULTAS_DESC"); 
    if(j.ok)
        render(j.data); 
};

$("#btnAltas").onclick = async () => { 
  const j = await post("ALTAS", datos()); 
  if (j.ok) {
    alert("Alta realizada correctamente ✅");
    limpiarFormulario();      // <-- Limpia los campos
    $("#btnAsc").click();     // <-- Refresca la tabla
  } else {
    alert("Error al guardar: " + (j.error || ''));
  }
};
$("#btnCambios").onclick = async () => { 
    if(!editingId) return alert("Selecciona un registro"); 
    const j = await post("CAMBIOS",{id:editingId,...datos()}); 
    
    if(j.ok){alert("Cambio ok"); 
        limpiarFormulario();
        $("#btnAsc").click(); 
        editingId=null;
    }
};

$("#btnLimpiar").onclick = () => document.querySelectorAll("input,textarea").forEach(e=>e.value="");

window.borrar = async (id) => { if(confirm("¿Eliminar?")) { const j = await post("BAJAS",{id}); if(j.ok) $("#btnAsc").click(); } };
window.editar = async (id) => {
  const j = await post("CONSULTAS_ASC");
  if (!j.ok || !j.data) {
    alert("No se pudo obtener la información del usuario.");
    return;
  }

  const u = j.data.find(x => x.id == id);
  if (!u) {
    alert("Registro no encontrado.");
    return;
  }

  // Guardamos el id que se está editando
  editingId = id;

  // Llenar todos los campos manualmente
  $("#nombre").value     = u.nombre || "";
  $("#ap_p").value       = u.apellido_p || "";
  $("#ap_m").value       = u.apellido_m || "";
  $("#curp").value       = u.curp || "";
  $("#nac").value        = u.nacimiento || "";
  $("#genero").value     = u.genero || "Indef.";
  $("#login").value      = u.login || "";
  $("#pwd").value        = "";  // nunca se rellena por seguridad
  $("#b64").value        = u.foto_base64 || "";

  // Mostrar la imagen si existe
  if (u.foto_base64) {
    $("#preview").src = u.foto_base64;
    $("#preview").style.display = "block";
  } else {
    $("#preview").src = "";
    $("#preview").style.display = "none";
  }

  // Desactivar la cámara si estaba activa
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  // Ocultar video/canvas y dejar solo la vista previa
  $("#video").style.display = "none";
  $("#canvas").style.display = "none";
  $("#btnShot").disabled = false;
  $("#btnRetry").disabled = true;
  $("#btnDelPhoto").disabled = false;

  alert("Modo edición activo. Realiza tus cambios y presiona CAMBIOS.");
};


function limpiarFormulario() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.type === "select-one") {
      el.selectedIndex = 0;   // vuelve al primer valor (Indef.)
    } else {
      el.value = "";
    }
  });

  // Limpia imagen y cámara
  $("#preview").src = "";
  $("#b64").value = "";
  $("#video").style.display = "none";
  $("#canvas").style.display = "none";
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}
//mantiene registros despues de actualizar paGINA
document.addEventListener("DOMContentLoaded", async () => {
  // Carga inicial de registros automáticamente
  const j = await post("CONSULTAS_ASC");
  if (j.ok) render(j.data);
});
