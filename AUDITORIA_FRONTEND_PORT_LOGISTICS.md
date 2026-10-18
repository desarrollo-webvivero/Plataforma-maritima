# Auditoría Técnica Completa: Frontend de PORT LOGISTICS

Este documento presenta una auditoría técnica exhaustiva del código fuente, arquitectura, diseño, integración y estado de implementación del frontend de **PORT LOGISTICS**, una plataforma integral de gestión logística, portuaria y aduanera marítima.

---

## 1. Resumen Ejecutivo

El frontend de **PORT LOGISTICS** se encuentra desarrollado como una Single Page Application (SPA) utilizando tecnologías modernas de desarrollo web (React 19, Vite, Tailwind CSS y React Router 7). La base del proyecto cuenta con una estructura limpia orientada a componentes modulares, páginas de aterrizaje, paneles de control (dashboard) privados, simulaciones de billeteras virtuales y conexiones iniciales para subastas en tiempo real mediante WebSockets (`@stomp/stompjs` y `sockjs-client`).

A nivel de arquitectura, el proyecto está completamente preparado para interactuar con los microservicios de Spring Boot definidos en el ecosistema (logística en el puerto `8080` y aduanas en el puerto `8082`), aunque actualmente varias vistas dependen de datos simulados (mock data) o se encuentran en fases iniciales de desarrollo.

---

## 2. Tecnologías y Configuración

El análisis del archivo `frontend-maritimo/package.json` revela las siguientes dependencias y herramientas:

* **Framework:** React (`^19.2.8`)
* **Herramienta de construcción:** Vite (`^8.3.0`) con `@vitejs/plugin-react`
* **Enrutamiento:** React Router DOM (`^7.18.4`)
* **Cliente HTTP:** Axios (`^1.20.0`)
* **WebSockets / Tiempo Real:** `@stomp/stompjs` (`^7.4.0`) y `sockjs-client` (`^1.6.1`)
* **Sistema de Estilos:** Tailwind CSS (`^3.4.19`), PostCSS y Autoprefixer
* **Linter:** `oxlint` (`^1.81.0`)
* **Comandos de ejecución:**
  * Desarrollo: `npm run dev` (inicia el servidor local de desarrollo mediante Vite)
  * Producción: `npm run build`
  * Linting: `npm run lint`

### Variables de Entorno y Configuración de API
El archivo `frontend-maritimo/src/services/api.js` configura la instancia predeterminada de Axios apuntando al backend:
* **URL Base de la API:** `http://localhost:8080` (predeterminada, configurable mediante `import.meta.env.VITE_API_URL` si se define).

---

## 3. Estructura Completa del Proyecto

El árbol de directorios real de la aplicación en el directorio `frontend-maritimo` es el siguiente:

```text
frontend-maritimo/
├── Dockerfile.dev
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   └── Layout.jsx
    ├── pages/
    │   ├── Billetera.jsx
    │   ├── Landing.jsx
    │   ├── Login.jsx
    │   └── SubastaEnVivo.jsx
    └── services/
        └── api.js
```

### Propósito de los Directorios y Archivos Principales:
* **`src/`**: Directorio raíz del código fuente de React.
* **`src/components/`**: Contiene componentes estructurales y reutilizables. Actualmente incluye `Layout.jsx` (que define la barra lateral de navegación y el contenedor principal del dashboard).
* **`src/pages/`**: Contiene las vistas principales accesibles mediante rutas:
  * `Landing.jsx`: Página de bienvenida pública con secciones informativas y de capacidad operativa.
  * `Login.jsx`: Pantalla de inicio de sesión de usuarios.
  * `Billetera.jsx`: Módulo simulado de gestión de fondos, saldo y transacciones virtuales.
  * `SubastaEnVivo.jsx`: Módulo de participación en licitaciones y subastas de TEUs.
* **`src/services/`**: Contiene la configuración de conectividad HTTP (`api.js`).
* **`src/assets/`**: Almacena imágenes y recursos estáticos locales.

---

## 4. Inventario de Pantallas y Navegación

| Nombre de Pantalla | Ruta | Archivo | Propósito | Estado de Implementación |
|---|---|---|---|---|
| **Landing Page** | `/` | `src/pages/Landing.jsx` | Presentación comercial, banner institucional y capacidad operativa (Portacontenedores, Graneleros, Tanqueros). | Completa (Estática) |
| **Inicio de Sesión** | `/login` | `src/pages/Login.jsx` | Formulario de autenticación para acceso de usuarios y roles. | Parcial / Simulada |
| **Panel Principal** | `/dashboard` | `src/App.jsx` (Inline) | Pantalla de bienvenida general al ingresar al sistema logístico. | Parcial (Estructural) |
| **Billetera Virtual** | `/dashboard/billetera` | `src/pages/Billetera.jsx` | Consulta de saldos, recargas y listado de transacciones recientes. | Funcional (Con datos locales / simulados) |
| **Subasta en Vivo** | `/dashboard/subastas` | `src/pages/SubastaEnVivo.jsx` | Interfaz de pujas en tiempo real para asignación de espacios. | Parcial / Estructurada con WebSocket |

### Flujo de Navegación:
1. El usuario ingresa a la raíz (`/`) visualizando la **Landing Page**.
2. Al hacer clic en "Iniciar Sesión" o "Acceder al Portal", es redirigido a `/login`.
3. Tras autenticarse, accede a la sección privada bajo el prefijo `/dashboard` la cual está envuelta por el componente `Layout.jsx`, exponiendo un menú lateral para navegar entre el panel de control, la billetera y las subastas en vivo.

---

## 5. Diseño y Apariencia Visual

* **Paleta de Colores:** Basada en tonos corporativos e industriales acordes al sector marítimo:
  * Azules oscuros y primarios (`slate-900`, `blue-900`, `blue-600`) para barras de navegación, encabezados y botones principales.
  * Grises claros (`gray-50`, `gray-100`, `gray-600`, `gray-800`) para fondos de pantalla y tipografías secundarias.
  * Acentos en naranja y verde/teal para destacar tarjetas informativas y estados operativos.
* **Tipografía:** Tipografía sans-serif limpia proporcionada por defecto mediante Tailwind CSS.
* **Componentes Visuales:** Empleo extensivo de tarjetas con bordes superiores coloreados, sombras suaves (`shadow-lg`, `shadow-xl`), botones con transiciones (`hover:scale-105`), tablas y cuadrículas responsivas (`grid-cols-1 md:grid-cols-3`).
* **Diseño Adaptable (Responsive):** Estructurado con clases flexibles de Tailwind que se adaptan correctamente a pantallas de computadoras de escritorio y dispositivos móviles.

---

## 6. Autenticación y Roles

* **Formulario de Acceso (`Login.jsx`):** Cuenta con campos visuales para usuario/correo y contraseña, acompañados de botones de acción.
* **Manejo de Sesión:** Actualmente no implementa validación real contra un token JWT de Spring Security en el backend. La navegación permite el acceso directo a las rutas protegidas del dashboard por motivos de prueba y desarrollo.
* **Control de Permisos por Rol:** Estructuralmente contemplado en los requerimientos del proyecto, pero en el código actual del frontend no existe un validador o guardián de rutas (Route Guard) basado en roles específicos (Exportador, Aduana, Naviera, Administrador).

---

## 7. Integración con el Backend REST

* **Configuración del Cliente (`src/services/api.js`):**
  ```javascript
  import axios from 'axios';

  const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  export default api;
  ```
* **Estado de Integración:** La instancia de Axios está lista para realizar peticiones REST hacia el microservicio de logística (`port-logistics-backend`), pero las vistas actuales (`Billetera.jsx`, `SubastaEnVivo.jsx`) operan predominantemente con estados locales (`useState`) y datos simulados para permitir pruebas visuales independientes del estado de los contenedores Docker del backend.

---

## 8. WebSockets y Eventos en Tiempo Real

* **Librerías Instaladas:** `@stomp/stompjs` y `sockjs-client`.
* **Estado de Implementación:** Aunque las dependencias de WebSockets están instaladas y la vista `SubastaEnVivo.jsx` está diseñada para interactuar con eventos en vivo, la conexión activa con el broker STOMP del backend (esperada en rutas como `/topic/subasta`) se encuentra pendiente de habilitación definitiva o sujeta a la ejecución simultánea del microservicio de aduanas/logística.

---

## 9. Estado de la Aplicación y Datos

* **Gestión de Estado:** Manejo interno mediante los ganchos nativos de React (`useState`, `useEffect`) a nivel de cada componente de página (`Billetera.jsx`, `SubastaEnVivo.jsx`). No se utiliza Redux ni Zustand en esta etapa.
* **Persistencia Local:** No se registra el uso extensivo de `localStorage` o `sessionStorage` para sesiones de usuario activas en los archivos analizados.
* **Datos Simulados:** Varios componentes utilizan arreglos de prueba estáticos para renderizar tablas y listados de transacciones o pujas.

---

## 10. Calidad del Código y Problemas Detectados

1. **Rutas Protegidas Simuladas:** El componente `Layout.jsx` y las rutas en `App.jsx` no validan la autenticación real del usuario mediante interceptores o tokens JWT guardados.
2. **Manejo de Errores HTTP:** Los componentes que consumen servicios aún no implementan bloques `try-catch` robustos ni notificaciones visuales (Toasts) ante caídas de conexión con el backend en el puerto `8080` u `8082`.
3. **Falta de Guards de Navegación:** Cualquier usuario puede acceder a la URL `/dashboard/*` directamente sin pasar por el formulario de inicio de sesión.

---

## 11. Matriz de Requisitos

| Módulo | Requisito | Estado actual | Evidencia en el código | Pendiente |
|---|---|---|---|---|
| Página de inicio | Presentación institucional y capacidad operativa | Completa | `src/pages/Landing.jsx` | Ninguno |
| Inicio de sesión | Formulario de acceso de usuarios | Parcial | `src/pages/Login.jsx` | Conexión real con Endpoint de Autenticación |
| Control de roles | Restricción por tipo de usuario | No implementado | Ausente en `App.jsx` / `Layout.jsx` | Creación de Guards y validación de roles |
| Subastas en tiempo real | Interfaz de pujas en vivo vía WebSocket | Parcial | `src/pages/SubastaEnVivo.jsx` | Enlace definitivo con STOMP/SockJS |
| Billetera virtual | Consulta de saldos y transacciones | Completa (Mock) | `src/pages/Billetera.jsx` | Integración REST con microservicio financiero |
| Gestión de Buques/Contenedores | CRUD y visualización de carga | No implementado | No existen páginas dedicadas | Desarrollo de vistas de logística |
| Panel de Aduanas | Semáforo de inspecciones y alertas rojas | No implementado | No existen páginas dedicadas | Desarrollo de vistas de aduanas (`8082`) |
| Diseño responsivo | Adaptabilidad multidispositivo | Completa | Clases Tailwind en `Landing.jsx` y `Layout.jsx` | Ninguno |

---

## 12. Plan de Integración Recomendado

1. **Consolidar la Autenticación:** Implementar el almacenamiento del token JWT en `localStorage` tras consumir el endpoint de login del backend.
2. **Proteger Rutas:** Desarrollar un componente de ruta privada (`PrivateRoute`) para evitar el acceso no autorizado al dashboard.
3. **Conectar Servicios REST:** Reemplazar los datos estáticos de `Billetera.jsx` y pantallas logísticas por llamadas reales utilizando la instancia configurada en `src/services/api.js`.
4. **Habilitar WebSockets:** Configurar la conexión STOMP en `SubastaEnVivo.jsx` apuntando al endpoint de notificaciones del backend.
5. **Completar Módulos Faltantes:** Implementar las vistas de gestión de buques, contenedores, muelles y aduanas.

---

## 13. Lista de Archivos Clave para Revisión

1. `frontend-maritimo/src/App.jsx` (Configuración de rutas y estructura principal de navegación).
2. `frontend-maritimo/src/pages/Landing.jsx` (Página de inicio y secciones informativas).
3. `frontend-maritimo/src/pages/Login.jsx` (Formulario de acceso de usuarios).
4. `frontend-maritimo/src/services/api.js` (Configuración centralizada de Axios).
5. `frontend-maritimo/src/pages/SubastaEnVivo.jsx` (Implementación de subastas y tiempo real).
