const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');
const agregarCargaClickBtn = document.getElementById('agregar-carga-click');
const tipoCargaPositiva = document.getElementById('positiva');
const tipoCargaNegativa = document.getElementById('negativa');
const cargaValorInput = document.getElementById('carga-valor');
const listaCargas = document.getElementById('lista-cargas');
const mostrarCampoBtn = document.getElementById('mostrar-campo');

let cargas = [];
const constanteCoulomb = 8.9875e9;
let mostrarCampo = false;
let agregandoCarga = false;
let cargaSeleccionada = null;
let offsetX, offsetY;
function dibujarSimulacion() {
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  for (const carga of cargas) {
    dibujarCarga(carga.x, carga.y, carga);
  }
  if (mostrarCampo) {
    ctx.strokeStyle = 'white';
    dibujarCampoElectrico();
    ctx.strokeStyle = 'black'; // Restablecer el color de trazo
  }
}

function calcularCampoElectrico(x, y) {
    let campoX = 0;
    let campoY = 0;
    for (const carga of cargas) {
        const dx = x - carga.x;
        const dy = y - carga.y;
        const distanciaCuadrada = dx * dx + dy * dy;
        if (distanciaCuadrada > 0.0001) {
            const distancia = Math.sqrt(distanciaCuadrada);
            const fuerza = constanteCoulomb * carga.valor / distanciaCuadrada;
            campoX += fuerza * dx / distancia;
            campoY += fuerza * dy / distancia;
        }
    }
    return { x: campoX, y: campoY };
}

function dibujarCampoElectrico() {
  const paso = 20;
  for (let x = 0; x < lienzo.width; x += paso) {
    for (let y = 0; y < lienzo.height; y += paso) {
      const campo = calcularCampoElectrico(x, y);
      let color = 'lightgreen'; // Color por defecto
      let distanciaMinima = Infinity;
      let cargaMasCercana = null;
      for (const carga of cargas) {
        const dx = x - carga.x;
        const dy = y - carga.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          cargaMasCercana = carga;
        }
      }
      if (cargaMasCercana !== null) {
        if (cargaMasCercana.valor > 0) {
          color = 'red'; // Color para cargas positivas
        } else if (cargaMasCercana.valor < 0) {
          color = 'blue'; // Color para cargas negativas
        }
      }
      ctx.strokeStyle = color;
      dibujarFlecha(x, y, campo.x / 1e6, campo.y / 1e6);
    }
  }
}
      
function dibujarCarga(x, y, carga) {
    ctx.beginPath();
    ctx.arc(x, y, Math.abs(carga.valor) * 5 + 5, 0, Math.PI * 2);
    ctx.fillStyle =(carga.valor > 0 ? 'red': 'blue');
    ctx.fill();
    ctx.closePath();
}

function dibujarFlecha(x, y, dx, dy) {
    const cabezaFlechaLongitud = 10;
    const anguloFlecha = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 10, y + dy * 10);
    ctx.stroke();

    const angulo = Math.atan2(dy, dx);
    const x1 = x + dx * 10 - cabezaFlechaLongitud * Math.cos(angulo - anguloFlecha);
    const y1 = y + dy * 10 - cabezaFlechaLongitud * Math.sin(angulo - anguloFlecha);
    const x2 = x + dx * 10 - cabezaFlechaLongitud * Math.cos(angulo + anguloFlecha);
    const y2 = y + dy * 10 - cabezaFlechaLongitud * Math.sin(angulo + anguloFlecha);

    ctx.moveTo(x + dx * 10, y + dy * 10);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x + dx * 10, y + dy * 10);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}



function actualizarListaCargas() {
    listaCargas.innerHTML = '';
    cargas.forEach((carga, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Carga ${index + 1}: q = ${carga.valor.toFixed(2)}, x = ${carga.x.toFixed(2)}, y = ${carga.y.toFixed(2)}`;
        listaCargas.appendChild(listItem);
    });
}

agregarCargaClickBtn.addEventListener('click', () => {
    agregandoCarga = true;
    alert("Haz clic en el lienzo para colocar la nueva carga.");
});

lienzo.addEventListener('click', (event) => {
    if (agregandoCarga) {
        const rect = lienzo.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const valor = parseFloat(cargaValorInput.value) * (tipoCargaPositiva.checked ? 1 : -1);
        cargas.push({ valor, x, y });
        actualizarListaCargas();
        dibujarSimulacion();
        agregandoCarga = false;
    }
});

function iniciarArrastre(event) {
    const mouseX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
    const mouseY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
    const rect = lienzo.getBoundingClientRect();
    const lienzoX = mouseX - rect.left;
    const lienzoY = mouseY - rect.top;

    for (let i = cargas.length - 1; i >= 0; i--) {
        const carga = cargas[i];
        const distancia = Math.sqrt((lienzoX - carga.x) ** 2 + (lienzoY - carga.y) ** 2);
        if (distancia < Math.abs(carga.valor) * 5 + 10) {
            cargaSeleccionada = i;
            offsetX = lienzoX - carga.x;
            offsetY = lienzoY - carga.y;
            lienzo.style.cursor = 'grabbing';
            break;
        }
    }
}

function arrastrar(event) {
    if (cargaSeleccionada !== null) {
        const mouseX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
        const mouseY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
        const rect = lienzo.getBoundingClientRect();
        cargas[cargaSeleccionada].x = mouseX - rect.left - offsetX;
        cargas[cargaSeleccionada].y = mouseY - rect.top - offsetY;
        dibujarSimulacion();
    }
}

function detenerArrastre() {
    cargaSeleccionada = null;
    lienzo.style.cursor = 'default';
}

lienzo.addEventListener('mousedown', iniciarArrastre);
lienzo.addEventListener('mousemove', arrastrar);
lienzo.addEventListener('mouseup', detenerArrastre);
lienzo.addEventListener('mouseout', detenerArrastre);

lienzo.addEventListener('touchstart', iniciarArrastre);
lienzo.addEventListener('touchmove', arrastrar);
lienzo.addEventListener('touchend', detenerArrastre);
lienzo.addEventListener('touchcancel', detenerArrastre);

mostrarCampoBtn.addEventListener('click', () => {
    mostrarCampo = !mostrarCampo;
    dibujarSimulacion();
});

dibujarSimulacion();
actualizarListaCargas();