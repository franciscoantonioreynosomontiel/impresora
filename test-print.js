const net = require('net');

const HOST = process.argv[2] || '127.0.0.1';
const PORT = 9100;

console.log(`📡 Conectando a la impresora virtual en ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log('✅ Conexión establecida con la impresora.');

  // Construir un ticket con comandos ESC/POS típicos
  const ESC = '\x1B';
  const GS = '\x1D';

  let ticket = '';

  // Inicializar impresora
  ticket += `${ESC}@`;

  // Centrar texto y negrita para encabezado
  ticket += `${ESC}a\x01`; // Centrado
  ticket += `${ESC}E\x01`; // Negrita ON
  ticket += '=== RESTAURANTE MI PEDIDO ===\n';
  ticket += 'ORDEN #1042\n';
  ticket += `${ESC}E\x00`; // Negrita OFF
  ticket += 'Fecha: ' + new Date().toLocaleString() + '\n';
  ticket += '------------------------------------------\n';

  // Alinear a la izquierda para el detalle
  ticket += `${ESC}a\x00`; // Izquierda
  ticket += 'Cant.  Descripcion               Total   \n';
  ticket += '------------------------------------------\n';
  ticket += ' 2x    Hamburguesa Doble Bacon   $180.00 \n';
  ticket += ' 1x    Papas Fritas Medianas     $ 45.00 \n';
  ticket += ' 2x    Refresco Cola 500ml       $ 50.00 \n';
  ticket += '------------------------------------------\n';

  // Alinear a la derecha para totales
  ticket += `${ESC}a\x02`; // Derecha
  ticket += `${ESC}E\x01`; // Negrita ON
  ticket += 'SUBTOTAL: $275.00\n';
  ticket += 'IVA (16%): $ 44.00\n';
  ticket += 'TOTAL: $319.00\n';
  ticket += `${ESC}E\x00`; // Negrita OFF

  // Centrar mensaje de despedida
  ticket += `${ESC}a\x01`; // Centrado
  ticket += '\n¡Gracias por tu compra!\n';
  ticket += 'Visitanos de nuevo\n\n\n';

  // Corte de papel (GS V 0)
  ticket += `${GS}V\x00`;

  client.write(Buffer.from(ticket, 'utf-8'), () => {
    console.log('📤 Ticket enviado exitosamente. Cerrando conexión...');
    client.end();
  });
});

client.on('close', () => {
  console.log('🔌 Conexión cerrada.');
});

client.on('error', (err) => {
  console.error('❌ Error de conexión:', err.message);
});
