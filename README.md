# ASTRIA · HRP Health Monitor

Prototipo educativo de NASA Space Apps Challenge para el registro de salud a bordo y el envío diferido de reportes simulados.

## Ejecutar en VS Code

Requiere Node.js 20.3 o posterior. Abre dos terminales en la raíz del proyecto.

**Terminal 1 · Backend**

```sh
npm --prefix backend start
```

**Terminal 2 · Frontend**

```sh
npm install
npm run dev
```

Abre la dirección que muestra Vite. Vite reenvía las solicitudes de `/api` al backend local en el puerto 4000. Para compilar el frontend, ejecuta `npm run build`.

## Dónde está cada cosa

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `src/App.jsx` | Estado de la sesión y coordinación de los paneles |
| `src/components/` | Barra de misión, captura, mapa corporal, gráficas, triaje y guía |
| `src/data/` y `src/utils/` | Escenarios, referencias simuladas, fechas y cálculos de la interfaz |
| `src/services/api.js` | Comunicación del frontend con la API |
| `backend/server.js` y `backend/routes/` | Inicio del servidor y rutas HTTP |
| `backend/controllers/` y `backend/services/` | Recepción de reportes y evaluación simulada |
| `backend/utils/fileDb.js` | Almacenamiento de reportes en `backend/data/db.json` |

Para probar la cola, simula un corte, registra un reporte y restablece el enlace. El reporte pasa a **Recibido en servidor** cuando la API confirma que lo guardó. Usa datos e imágenes ficticios.
