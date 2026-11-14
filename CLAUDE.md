1. **ASTRIA (HRP Health Monitor):** Prototipo de monitoreo médico autónomo *Offline-First* para astronautas en misiones de larga duración.
2. **Stack Técnico:** React 19 (Vite), Tailwind CSS v4, Recharts (gráficos) y Lucide-React (íconos). Persistencia de estado local (`localStorage`).
3. **Despliegue Local:** `npm install --legacy-peer-deps` y luego `npm run dev`.
4. **Convenciones:** Simplicidad ante todo. Uso de colores tipo semáforo (Verde, Amarillo, Rojo) para evaluaciones visuales instantáneas basadas en umbrales de la NASA (HRP, HERA, Fluid Shifts).
5. Las reglas de producto viven en `.specify/memory/constitution.md` y el estado del producto en `specs/README.md`.