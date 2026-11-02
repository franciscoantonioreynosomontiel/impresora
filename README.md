# Simulador de Impresora Epson TM-T20III (Ethernet / LAN)

Este proyecto permite simular en tu computadora una impresora de tickets **Epson TM-T20III con conexión Ethernet (LAN)** en el puerto TCP estándar **9100**.

Te permite probar tu aplicación en Flutter para verificar:
1. Conexión por socket TCP vía IP.
2. Estado de conexión/desconexión en tiempo real.
3. Recepción de bytes y renderizado visual del ticket en la consola de Visual Studio Code (decodificando comandos ESC/POS).

---

## 🚀 Inicio Rápido

1. Abre la carpeta en **Visual Studio Code**.
2. Abre la terminal (`Ctrl + ~` o `Terminal -> Nueva Terminal`).
3. Inicia el servidor:
   ```bash
   node server.js
   ```
4. El servidor te mostrará tu IP local y el puerto `9100`.

---

## 📱 Configuración en Flutter

| Entorno de Prueba | Dirección IP a usar en Flutter | Puerto |
| :--- | :--- | :--- |
| **Emulador Android (Android Studio)** | `10.0.2.2` | `9100` |
| **Dispositivo Android Físico (WiFi)** | Tu IP Local (ej. `192.168.1.XX`) | `9100` |
| **Simulador iOS / Desktop** | `127.0.0.1` | `9100` |

---

## 🧪 Prueba local rápida

En otra terminal ejecuta:
```bash
node test-print.js
```
Verás reflejada la conexión y el ticket de prueba inmediatamente en la consola del servidor.

Consulta el archivo `PASOS.txt` para una guía detallada paso a paso.
