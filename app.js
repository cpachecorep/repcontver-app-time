// ===== VARIABLES GLOBALES =====
let currentWorker = null;
let currentPhoto = null;
let mediaStream = null;
let currentLocation = null;
let marks = [];
let employees = [
    { cedula: '12345678', nombres: 'Juan Pérez', estado: 'activo' },
    { cedula: '87654321', nombres: 'María Gómez', estado: 'activo' },
    { cedula: '11223344', nombres: 'Carlos Rodríguez', estado: 'activo' },
    { cedula: '55667788', nombres: 'Ana Martínez', estado: 'inactivo' },
    { cedula: '0954939922', nombres: 'Carlos Pacheco', estado: 'activo' }
];

// ===== FUNCIÓN PARA OBTENER FECHA/HORA DE ECUADOR =====
function getHoraEcuador() {
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const partes = formatter.formatToParts(ahora);
    let year, month, day, hour, minute, second;
    partes.forEach(part => {
        if (part.type === 'year') year = part.value;
        if (part.type === 'month') month = part.value;
        if (part.type === 'day') day = part.value;
        if (part.type === 'hour') hour = part.value;
        if (part.type === 'minute') minute = part.value;
        if (part.type === 'second') second = part.value;
    });
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// ===== FUNCIÓN PARA FORMATEAR FECHA AL MOSTRAR =====
function formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const [fecha, hora] = fechaStr.split(' ');
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year} ${hora}`;
}

// ===== FUNCIONES DE NAVEGACIÓN =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showNotification(msg, type = 'info') {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.className = `notification ${type}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// ===== FUNCIONES DE CÁMARA =====
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
        });
        document.getElementById('video').srcObject = mediaStream;
        currentPhoto = null;
        updatePhotoStatus();
    } catch (error) {
        showNotification('Error al acceder a la cámara', 'error');
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    currentPhoto = canvas.toDataURL('image/jpeg');
    
    video.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('btnTomarFoto').style.display = 'none';
    document.getElementById('btnRepetirFoto').style.display = 'block';
    updatePhotoStatus();
}

function retakePhoto() {
    document.getElementById('video').style.display = 'block';
    document.getElementById('canvas').style.display = 'none';
    currentPhoto = null;
    document.getElementById('btnTomarFoto').style.display = 'block';
    document.getElementById('btnRepetirFoto').style.display = 'none';
    updatePhotoStatus();
}

function updatePhotoStatus() {
    const status = document.getElementById('photoStatus');
    const btnE = document.getElementById('btnEntrada');
    const btnS = document.getElementById('btnSalida');
    const cam = document.getElementById('cameraContainer');
    
    if (currentPhoto) {
        status.className = 'photo-status success';
        status.innerHTML = '✅ Foto tomada';
        cam.classList.remove('required');
        if (currentLocation) {
            btnE.disabled = false;
            btnS.disabled = false;
        }
    } else {
        status.className = 'photo-status error';
        status.innerHTML = '⚠️ Debe tomar foto';
        cam.classList.add('required');
        btnE.disabled = true;
        btnS.disabled = true;
    }
}

// ===== UBICACIÓN =====
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (p) => {
                currentLocation = { lat: p.coords.latitude, lng: p.coords.longitude };
                document.getElementById('coordinates').innerHTML = 
                    `Lat: ${currentLocation.lat.toFixed(6)}<br>Lng: ${currentLocation.lng.toFixed(6)}`;
                document.getElementById('locationInfo').innerHTML = 
                    `<p>✅ Ubicación obtenida</p><p>${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}</p>`;
                updatePhotoStatus();
            },
            () => {
                document.getElementById('locationInfo').innerHTML = '<p>⚠️ Error de ubicación</p>';
                showNotification('Error al obtener ubicación', 'error');
            }
        );
    }
}

// ===== LOGIN TRABAJADOR =====
function startWorkerSession() {
    const cedula = document.getElementById('workerCedula').value;
    if (!cedula) return showNotification('Ingrese cédula', 'error');
    
    const emp = employees.find(e => e.cedula === cedula && e.estado === 'activo');
    if (!emp) return showNotification('Cédula no registrada', 'error');
    
    currentWorker = emp;
    document.getElementById('workerName').textContent = emp.nombres;
    document.getElementById('workerCedulaDisplay').textContent = `Cédula: ${emp.cedula}`;
    showScreen('workerPanelScreen');
    startCamera();
    getLocation();
    loadTodayMarks();
}

// ===== LOGIN ADMIN =====
function adminLogin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    if (u === 'rrhh' && p === 'Repcontver@2026') {
        showScreen('adminPanelScreen');
        loadAdminTable();
        loadUsersTable();
        updateUserStats();
        const hoy = getHoraEcuador().split(' ')[0];
        document.getElementById('fechaInicio').value = hoy;
        document.getElementById('fechaFin').value = hoy;
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
    } else {
        showNotification('Credenciales incorrectas', 'error');
    }
}

// ===== CAMBIAR TABS =====
function switchAdminTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tab === 'marcaciones') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('tabMarcaciones').classList.add('active');
        loadAdminTable();
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('tabUsuarios').classList.add('active');
        loadUsersTable();
        updateUserStats();
    }
}

// ===== REGISTRAR MARCACIÓN (MODIFICADO PARA FIREBASE) =====
async function registerMark(tipo) {
    if (!currentPhoto) return showNotification('Debe tomar foto', 'error');
    if (!currentLocation) return showNotification('Espere ubicación', 'info');

    const fechaHora = getHoraEcuador();
    const today = fechaHora.split(' ')[0];
    
    console.log('Guardando en Ecuador:', fechaHora);

    // Buscar si ya existe marcación hoy
    let existente = marks.find(m => m.cedula === currentWorker.cedula && m.entrada?.startsWith(today));

    try {
        if (existente) {
            if (tipo === 'entrada' && !existente.entrada) {
                existente.entrada = fechaHora;
                existente.fotoEntrada = currentPhoto;
                existente.latEntrada = currentLocation.lat;
                existente.lngEntrada = currentLocation.lng;
                
                // Actualizar en Firebase
                await db.collection('marcaciones').doc(existente.id).update({
                    entrada: fechaHora,
                    fotoEntrada: currentPhoto,
                    latEntrada: currentLocation.lat,
                    lngEntrada: currentLocation.lng
                });
                
            } else if (tipo === 'salida' && !existente.salida) {
                existente.salida = fechaHora;
                existente.fotoSalida = currentPhoto;
                existente.latSalida = currentLocation.lat;
                existente.lngSalida = currentLocation.lng;
                
                // Actualizar en Firebase
                await db.collection('marcaciones').doc(existente.id).update({
                    salida: fechaHora,
                    fotoSalida: currentPhoto,
                    latSalida: currentLocation.lat,
                    lngSalida: currentLocation.lng
                });
                
            } else {
                return showNotification(`Ya registró ${tipo} hoy`, 'error');
            }
        } else {
            // Nueva marcación
            const newMark = {
                cedula: currentWorker.cedula,
                nombres: currentWorker.nombres,
                entrada: tipo === 'entrada' ? fechaHora : null,
                salida: tipo === 'salida' ? fechaHora : null,
                fotoEntrada: tipo === 'entrada' ? currentPhoto : null,
                fotoSalida: tipo === 'salida' ? currentPhoto : null,
                latEntrada: tipo === 'entrada' ? currentLocation.lat : null,
                lngEntrada: tipo === 'entrada' ? currentLocation.lng : null,
                latSalida: tipo === 'salida' ? currentLocation.lat : null,
                lngSalida: tipo === 'salida' ? currentLocation.lng : null,
                fechaHora: firebase.firestore.FieldValue.serverTimestamp(),
                fechaHoraStr: fechaHora
            };
            
            // Guardar en Firebase
            const docRef = await db.collection('marcaciones').add(newMark);
            
            // Agregar a marks local con el ID
            marks.push({ id: docRef.id, ...newMark });
        }

        showNotification(`Marcación de ${tipo} registrada`, 'success');
        retakePhoto();
        loadTodayMarks();
        loadAdminTable();
        
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        showNotification('Error al guardar en la nube', 'error');
    }
}

// ===== CARGAR MARCACIONES HOY =====
function loadTodayMarks() {
    if (!currentWorker) return;
    const today = getHoraEcuador().split(' ')[0];
    const hoy = marks.filter(m => m.cedula === currentWorker.cedula && m.entrada?.startsWith(today));
    
    let html = '';
    if (hoy.length === 0) {
        html = '<p style="text-align:center;color:#999;">No hay marcaciones hoy</p>';
    } else {
        hoy.forEach(m => {
            html += `<div style="background:#f8f9fa;padding:10px;border-radius:5px;margin-bottom:5px;">
                <p><strong>Entrada:</strong> ${formatearFecha(m.entrada)}</p>
                <p><strong>Salida:</strong> ${m.salida ? formatearFecha(m.salida) : 'Pendiente'}</p>
            </div>`;
        });
    }
    document.getElementById('todayMarks').innerHTML = html;
}

// ===== CARGAR TABLA ADMIN =====
function loadAdminTable() {
    const tbody = document.getElementById('marksTableBody');
    if (marks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;">No hay marcaciones</td></tr>';
        return;
    }
    let html = '';
    marks.forEach(m => {
        html += `<tr>
            <td>${m.cedula}</td>
            <td>${m.nombres}</td>
            <td>${formatearFecha(m.entrada)}</td>
            <td>${m.salida ? formatearFecha(m.salida) : '—'}</td>
            <td>
                <div class="action-buttons">
                    ${m.fotoEntrada ? `<button class="action-btn view" onclick='viewPhoto("${m.cedula}","entrada")'>📷 E</button>` : ''}
                    ${m.fotoSalida ? `<button class="action-btn view" onclick='viewPhoto("${m.cedula}","salida")'>📷 S</button>` : ''}
                    ${m.latEntrada ? `<button class="action-btn map" onclick='viewMap(${m.latEntrada},${m.lngEntrada})'>🗺️ E</button>` : ''}
                    ${m.latSalida ? `<button class="action-btn map" onclick='viewMap(${m.latSalida},${m.lngSalida})'>🗺️ S</button>` : ''}
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ===== CARGAR USUARIOS =====
function loadUsersTable() {
    let html = '';
    employees.forEach(e => {
        html += `<tr>
            <td>${e.cedula}</td>
            <td>${e.nombres}</td>
            <td><span style="color:${e.estado==='activo'?'#00d25b':'#ff4757'}">${e.estado==='activo'?'✅ Activo':'❌ Inactivo'}</span></td>
            <td><div class="action-buttons">
                <button class="action-btn edit" onclick='editUser("${e.cedula}")'>✏️</button>
                <button class="action-btn delete" onclick='deleteUser("${e.cedula}")'>🗑️</button>
            </div></td>
        </tr>`;
    });
    document.getElementById('usersTableBody').innerHTML = html;
}

function updateUserStats() {
    document.getElementById('totalUsuarios').textContent = employees.length;
    const today = getHoraEcuador().split(' ')[0];
    document.getElementById('activosHoy').textContent = marks.filter(m => m.entrada?.startsWith(today)).length;
}

// ===== CRUD USUARIOS (MODIFICADO PARA FIREBASE) =====
function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Agregar Usuario';
    document.getElementById('userCedula').value = '';
    document.getElementById('userNombres').value = '';
    document.getElementById('userEstado').value = 'activo';
    document.getElementById('userCedula').disabled = false;
    document.getElementById('userModal').classList.add('active');
}

function editUser(cedula) {
    const u = employees.find(e => e.cedula === cedula);
    if (!u) return;
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    document.getElementById('userCedula').value = u.cedula;
    document.getElementById('userCedula').disabled = true;
    document.getElementById('userNombres').value = u.nombres;
    document.getElementById('userEstado').value = u.estado;
    document.getElementById('userModal').classList.add('active');
}

async function guardarUsuario() {
    const cedula = document.getElementById('userCedula').value.trim();
    const nombres = document.getElementById('userNombres').value.trim();
    const estado = document.getElementById('userEstado').value;

    if (!cedula || !nombres) {
        showNotification('Complete todos los campos', 'error');
        return;
    }

    const existente = employees.find(e => e.cedula === cedula);
    
    try {
        if (existente && document.getElementById('userCedula').disabled) {
            // Es edición
            await db.collection('empleados').doc(existente.id).update({
                nombres, estado
            });
            existente.nombres = nombres;
            existente.estado = estado;
            showNotification('Usuario actualizado', 'success');
            
        } else if (existente) {
            showNotification('Ya existe un usuario con esa cédula', 'error');
            return;
            
        } else {
            // Es nuevo
            const docRef = await db.collection('empleados').add({
                cedula, nombres, estado
            });
            employees.push({ id: docRef.id, cedula, nombres, estado });
            showNotification('Usuario creado', 'success');
        }

        closeModal('userModal');
        loadUsersTable();
        updateUserStats();
        
    } catch (error) {
        console.error('Error guardando usuario:', error);
        showNotification('Error al guardar en Firebase', 'error');
    }
}

async function deleteUser(cedula) {
    if (!confirm(`¿Eliminar usuario ${cedula}?`)) return;
    
    const user = employees.find(e => e.cedula === cedula);
    if (!user) return;
    
    try {
        await db.collection('empleados').doc(user.id).delete();
        employees = employees.filter(e => e.cedula !== cedula);
        showNotification('Usuario eliminado', 'success');
        loadUsersTable();
        updateUserStats();
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// ===== FILTRAR =====
function filterMarks() {
    const fi = document.getElementById('fechaInicio').value;
    const ff = document.getElementById('fechaFin').value;
    if (!fi || !ff) return showNotification('Seleccione fechas', 'error');
    
    const filtradas = marks.filter(m => {
        if (!m.entrada) return false;
        const f = m.entrada.split(' ')[0];
        return f >= fi && f <= ff;
    });
    
    const tbody = document.getElementById('marksTableBody');
    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros</td></tr>';
    } else {
        let html = '';
        filtradas.forEach(m => {
            html += `<tr>
                <td>${m.cedula}</td>
                <td>${m.nombres}</td>
                <td>${formatearFecha(m.entrada)}</td>
                <td>${m.salida ? formatearFecha(m.salida) : '—'}</td>
                <td><div class="action-buttons">
                    ${m.fotoEntrada ? `<button class="action-btn view" onclick='viewPhoto("${m.cedula}","entrada")'>📷</button>` : ''}
                    ${m.fotoSalida ? `<button class="action-btn view" onclick='viewPhoto("${m.cedula}","salida")'>📷</button>` : ''}
                    ${m.latEntrada ? `<button class="action-btn map" onclick='viewMap(${m.latEntrada},${m.lngEntrada})'>🗺️</button>` : ''}
                    ${m.latSalida ? `<button class="action-btn map" onclick='viewMap(${m.latSalida},${m.lngSalida})'>🗺️</button>` : ''}
                </div></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
}

function verTodas() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    loadAdminTable();
}

// ===== EXPORTAR A EXCEL - VERSIÓN EXCEL VERDADERO =====
function exportToExcel() {
    try {
        if (marks.length === 0) {
            showNotification('No hay datos para exportar', 'info');
            return;
        }

        // Determinar qué datos exportar (filtrados o todos)
        let dataToExport = marks;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        
        if (fechaInicio && fechaFin) {
            dataToExport = marks.filter(m => {
                if (!m.entrada) return false;
                const fechaMark = m.entrada.split(' ')[0];
                return fechaMark >= fechaInicio && fechaMark <= fechaFin;
            });
        }

        if (dataToExport.length === 0) {
            showNotification('No hay datos en el rango seleccionado', 'info');
            return;
        }

        // Crear tabla HTML para Excel
        let tablaHTML = `
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>REPCONTVER - Reporte de Marcaciones</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; background: #fff; }
                        .header { 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white; 
                            padding: 20px; 
                            text-align: center; 
                            font-size: 24px; 
                            font-weight: bold;
                            border-radius: 10px 10px 0 0;
                        }
                        .subheader {
                            background: #f8f9fa;
                            padding: 15px;
                            text-align: right;
                            font-size: 12px;
                            color: #666;
                            border-bottom: 2px solid #667eea;
                        }
                        table { 
                            border-collapse: collapse; 
                            width: 100%; 
                            margin-top: 20px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        th { 
                            background-color: #667eea; 
                            color: white; 
                            font-weight: bold;
                            padding: 12px; 
                            text-align: left; 
                            border: 1px solid #5a6fd8;
                            font-size: 13px;
                        }
                        td { 
                            padding: 10px; 
                            border: 1px solid #ddd; 
                            vertical-align: middle;
                            font-size: 12px;
                        }
                        tr:nth-child(even) { 
                            background-color: #f8f9fa; 
                        }
                        .foto-si {
                            color: #00d25b;
                            font-weight: bold;
                            text-align: center;
                        }
                        .foto-no {
                            color: #ff4757;
                            font-weight: bold;
                            text-align: center;
                        }
                        .coordenadas {
                            font-size: 11px;
                            color: #333;
                        }
                        .footer {
                            margin-top: 20px;
                            text-align: center;
                            font-size: 11px;
                            color: #999;
                            padding: 10px;
                        }
                        .resumen {
                            background: #e9ecef;
                            padding: 10px 15px;
                            border-radius: 5px;
                            margin: 15px 0;
                            font-size: 13px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        REPCONTVER - CONTROL DE ASISTENCIA
                    </div>
                    <div class="subheader">
                        Reporte generado: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })} (hora Ecuador)
                    </div>
                    
                    <div class="resumen">
                        <strong>📊 RESUMEN DEL REPORTE:</strong><br>
                        • Total de registros: ${dataToExport.length}<br>
                        • Fecha de generación: ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                        • ${fechaInicio && fechaFin ? `Filtro aplicado: del ${fechaInicio} al ${fechaFin}` : 'Mostrando: TODOS los registros'}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>CÉDULA</th>
                                <th>NOMBRES COMPLETOS</th>
                                <th>ENTRADA</th>
                                <th>SALIDA</th>
                                <th>FOTO E</th>
                                <th>FOTO S</th>
                                <th>UBICACIÓN ENTRADA</th>
                                <th>UBICACIÓN SALIDA</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        dataToExport.forEach((mark, index) => {
            const entrada = mark.entrada ? formatearFecha(mark.entrada) : 'PENDIENTE';
            const salida = mark.salida ? formatearFecha(mark.salida) : 'PENDIENTE';
            const fotoE = mark.fotoEntrada ? '<span class="foto-si">✅ SI</span>' : '<span class="foto-no">❌ NO</span>';
            const fotoS = mark.fotoSalida ? '<span class="foto-si">✅ SI</span>' : '<span class="foto-no">❌ NO</span>';
            const ubiE = mark.latEntrada ? 
                `<span class="coordenadas">${mark.latEntrada.toFixed(6)}°<br>${mark.lngEntrada.toFixed(6)}°</span>` : 
                '<span style="color:#999;">—</span>';
            const ubiS = mark.latSalida ? 
                `<span class="coordenadas">${mark.latSalida.toFixed(6)}°<br>${mark.lngSalida.toFixed(6)}°</span>` : 
                '<span style="color:#999;">—</span>';
            
            tablaHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${mark.cedula}</strong></td>
                    <td>${mark.nombres}</td>
                    <td>${entrada}</td>
                    <td>${salida}</td>
                    <td class="foto-si">${fotoE}</td>
                    <td class="foto-si">${fotoS}</td>
                    <td>${ubiE}</td>
                    <td>${ubiS}</td>
                </tr>
            `;
        });

        tablaHTML += `
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>REPCONTVER - Sistema de Control de Asistencia v4.0</p>
                        <p>Este reporte fue generado automáticamente el ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'full', timeStyle: 'medium' })}</p>
                        <p>Total de empleados activos: ${employees.filter(e => e.estado === 'activo').length} | Total de marcaciones: ${marks.length}</p>
                    </div>
                </body>
            </html>
        `;

        // Crear y descargar archivo Excel verdadero
        const blob = new Blob([tablaHTML], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `REPCONTVER_Marcaciones_${getHoraEcuador().split(' ')[0]}.xls`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        showNotification(`✅ Excel generado correctamente con ${dataToExport.length} registros`, 'success');
        
    } catch (error) {
        console.error('Error al exportar:', error);
        showNotification('Error al generar el reporte Excel', 'error');
    }
}

// ===== VER FOTO =====
function viewPhoto(cedula, tipo) {
    const m = marks.find(m => m.cedula === cedula);
    if (!m) return;
    const foto = m[`foto${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`];
    if (!foto) return showNotification('No hay foto', 'error');
    document.getElementById('modalPhoto').src = foto;
    document.getElementById('modalInfo').innerHTML = `<strong>${m.nombres}</strong><br>${formatearFecha(m[tipo])}<br>${tipo.toUpperCase()}`;
    document.getElementById('photoModal').classList.add('active');
}

// ===== VER MAPA =====
function viewMap(lat, lng) {
    if (!lat || !lng) return;
    document.getElementById('mapIframe').src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    document.getElementById('mapCoordinates').innerHTML = `Lat: ${lat}<br>Lng: ${lng}`;
    document.getElementById('mapModal').classList.add('active');
}

// ===== CERRAR MODAL =====
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'mapModal') document.getElementById('mapIframe').src = '';
    if (modalId === 'userModal') document.getElementById('userCedula').disabled = false;
}

// ===== LOGOUT =====
function logout() {
    if (mediaStream) stopCamera();
    currentWorker = currentPhoto = currentLocation = null;
    showScreen('homeScreen');
}

// ===== FUNCIÓN PARA CARGAR DATOS INICIALES DESDE FIREBASE (NUEVA) =====
async function cargarDatosIniciales() {
    try {
        showNotification('Cargando datos desde la nube...', 'info');
        
        // Cargar empleados desde Firebase
        const empleadosSnapshot = await db.collection('empleados').get();
        if (!empleadosSnapshot.empty) {
            employees = [];
            empleadosSnapshot.forEach(doc => {
                employees.push({ id: doc.id, ...doc.data() });
            });
        }
        
        // Cargar marcaciones desde Firebase
        const marcacionesSnapshot = await db.collection('marcaciones')
            .orderBy('fechaHora', 'desc')
            .get();
        
        if (!marcacionesSnapshot.empty) {
            marks = [];
            marcacionesSnapshot.forEach(doc => {
                marks.push({ id: doc.id, ...doc.data() });
            });
        }
        
        // Actualizar UI
        loadUsersTable();
        loadAdminTable();
        updateUserStats();
        
        console.log('✅ Datos cargados desde Firebase');
        showNotification('Datos sincronizados', 'success');
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error al conectar con Firebase', 'error');
    }
}

// ===== INICIALIZACIÓN (MODIFICADA) =====
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos desde Firebase
    if (typeof db !== 'undefined') {
        cargarDatosIniciales();
    } else {
        console.warn('Firebase no disponible, usando datos locales');
        loadUsersTable();
        updateUserStats();
    }
    
    console.log('Sistema iniciado - Zona horaria Ecuador GMT-5');
    console.log('Hora actual Ecuador:', getHoraEcuador());
});
