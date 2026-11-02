const net = require('net');
const os = require('os');

const PORT = 9100;
const HOST = '0.0.0.0';

/**
 * Obtener las direcciones IP locales de la computadora para mostrarlas en la consola
 */
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ iface: name, address: iface.address });
      }
    }
  }
  return addresses;
}

/**
 * Procesa bytes de ESC/POS para mostrarlos en consola de forma legible.
 * Remueve comandos comunes binarios (inicialización, corte de papel, códigos de formato)
 * manteniendo los saltos de línea y el texto imprimible.
 */
function parseEscPos(buffer) {
  let text = '';
  let i = 0;

  while (i < buffer.length) {
    const byte = buffer[i];

    // Caracteres imprimibles estándar y caracteres acentuados/latinos
    if (byte === 0x0A) { // Salto de línea (\n)
      text += '\n';
      i++;
    } else if (byte === 0x0D) { // Retorno de carro (\r)
      i++;
    } else if (byte === 0x09) { // Tabulador
      text += '    ';
      i++;
    } else if (byte === 0x1B) { // ESC
      // Comandos ESC comunes:
      // ESC @ (Init - 2 bytes)
      // ESC ! n (Select print mode - 3 bytes)
      // ESC E n (Bold on/off - 3 bytes)
      // ESC a n (Align - 3 bytes)
      // ESC d n (Print and feed - 3 bytes)
      // ESC p ... (Pulse drawer - 5 bytes)
      if (i + 1 < buffer.length) {
        const next = buffer[i + 1];
        if (next === 0x40) { // ESC @
          i += 2;
        } else if (next === 0x21 || next === 0x45 || next === 0x61 || next === 0x64 || next === 0x4D || next === 0x2D) {
          i += 3;
        } else if (next === 0x70) { // ESC p
          i += 5;
        } else {
          i += 2;
        }
      } else {
        i++;
      }
    } else if (byte === 0x1D) { // GS
      // Comandos GS comunes:
      // GS V m (Corte de papel - 3 o 4 bytes)
      // GS ! n (Tamaño de fuente - 3 bytes)
      // GS k (Código de barras - variable)
      // GS ( k (QR code - variable)
      if (i + 1 < buffer.length) {
        const next = buffer[i + 1];
        if (next === 0x56) { // GS V (Cut)
          text += '\n✂️ --- [CORTE DE PAPEL / CUT] ---\n';
          if (i + 2 < buffer.length && (buffer[i + 2] === 65 || buffer[i + 2] === 66)) {
            i += 4;
          } else {
            i += 3;
          }
        } else if (next === 0x21 || next === 0x42 || next === 0x77 || next === 0x68) {
          i += 3;
        } else if (next === 0x28) { // GS ( ...
          // Salta comando complejo GS (
          i += 4;
        } else {
          i += 2;
        }
      } else {
        i++;
      }
    } else if (byte >= 32 && byte <= 126) {
      // Caracter ASCII estándar
      text += String.fromCharCode(byte);
      i++;
    } else if (byte >= 128) {
      // Puede ser UTF-8 multibyte o CP437 / Latin1
      // Intentamos decodificar como UTF-8
      let utf8Len = 1;
      if ((byte & 0xE0) === 0xC0) utf8Len = 2;
      else if ((byte & 0xF0) === 0xE0) utf8Len = 3;
      else if ((byte & 0xF8) === 0xF0) utf8Len = 4;

      if (i + utf8Len <= buffer.length) {
        text += buffer.toString('utf-8', i, i + utf8Len);
        i += utf8Len;
      } else {
        text += buffer.toString('latin1', i, i + 1);
        i++;
      }
    } else {
      // Otros caracteres de control no imprimibles (NUL, DLE, etc.)
      i++;
    }
  }

  return text;
}

const server = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log('\n==================================================');
  console.log(`🟢 [NUEVA CONEXIÓN] Cliente conectado desde: ${clientAddress}`);
  console.log(`⏰ Hora: ${new Date().toLocaleTimeString()}`);
  console.log('==================================================\n');

  let totalBytes = 0;
  const receivedChunks = [];

  socket.on('data', (chunk) => {
    totalBytes += chunk.length;
    receivedChunks.push(chunk);
    console.log(`📦 Recibido paquete de ${chunk.length} bytes desde ${clientAddress}...`);
  });

  socket.on('end', () => {
    console.log(`\n📄 [TICKET RECIBIDO COMPLETO] Total de bytes: ${totalBytes}`);
    console.log('-------------------- INICIO DEL TICKET --------------------');

    const fullBuffer = Buffer.concat(receivedChunks);
    const parsedText = parseEscPos(fullBuffer);

    if (parsedText.trim().length > 0) {
      console.log(parsedText);
    } else {
      // Si por alguna razón de formato no hay texto imprimible, mostrar representación hex/texto crudo
      console.log('(Datos binarios / texto plano):');
      console.log(fullBuffer.toString('utf-8'));
    }

    console.log('--------------------- FIN DEL TICKET ----------------------\n');
  });

  socket.on('close', () => {
    console.log(`🔴 [DESCONEXIÓN] Cliente desconectado: ${clientAddress}\n`);
  });

  socket.on('error', (err) => {
    console.error(`⚠️ [ERROR EN SOCKET] (${clientAddress}):`, err.message);
  });
});

server.listen(PORT, HOST, () => {
  console.log('===========================================================');
  console.log('🖨️   SIMULADOR DE IMPRESORA EPSON TM-T20III (ETHERNET/LAN)  ');
  console.log('===========================================================');
  console.log(`🚀 Servidor escuchando en el puerto TCP: ${PORT}`);
  console.log('\n📡 Direcciones IP detectadas en tu computadora:');

  const addresses = getLocalIpAddresses();
  if (addresses.length === 0) {
    console.log('   (No se detectaron interfaces externas, usa 127.0.0.1)');
  } else {
    addresses.forEach(addr => {
      console.log(`   👉 Interfaz [${addr.iface}]: ${addr.address}`);
    });
  }

  console.log('\n💡 Instrucciones para tu app de Flutter:');
  console.log('   - Si pruebas en celular real conectado a tu misma red WiFi:');
  console.log(`     Usa una de las IP de arriba (ejemplo: ${addresses[0] ? addresses[0].address : '192.168.1.X'}) y puerto ${PORT}.`);
  console.log('   - Si pruebas en el Emulador de Android oficial:');
  console.log(`     Usa la IP especial 10.0.2.2 y puerto ${PORT}.`);
  console.log('   - Si pruebas en emulador iOS o app de escritorio/web:');
  console.log(`     Usa la IP 127.0.0.1 o localhost y puerto ${PORT}.`);
  console.log('\n⏳ Esperando conexión desde tu aplicación Flutter...');
  console.log('===========================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso. Cierra cualquier proceso que use el puerto 9100 e intenta de nuevo.`);
  } else {
    console.error('❌ Error en el servidor:', err.message);
  }
});
