# 🍽️ MenuMaster — Sistema Integral de Gestión Gastronómica

[![Deploy on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://menumaster-api-rdta.onrender.com)
[![Deploy on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://menumaster-green.vercel.app)
[![Database Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?logo=postgresql&logoColor=white)](https://neon.tech)

**MenuMaster** es una aplicación web Full Stack interactiva de ciclo completo diseñada para digitalizar la operativa diaria de restaurantes y bares. Sincroniza en tiempo real la toma de pedidos en el salón (mozos), la preparación de platos en cocina (KDS) y la administración comercial (caja diaria, auditoría de usuarios y métricas de ventas).

---

## 🌐 Enlaces de la Aplicación en Producción

* **Frontend (App Web):** [https://menumaster-green.vercel.app](https://menumaster-green.vercel.app) *(Desplegado en Vercel)*
* **Backend (API REST):** [https://menumaster-api-rdta.onrender.com/api](https://menumaster-api-rdta.onrender.com/api) *(Desplegado en Render)*
* **Health Check API:** [https://menumaster-api-rdta.onrender.com/](https://menumaster-api-rdta.onrender.com/)

> **Nota para evaluación:** Las credenciales de demostración iniciales creadas por el seeder son:
> * **Email:** `admin@menumaster.com`
> * **Contraseña:** `Admin123!`
> * **Rol:** Administrador (`ADMIN`)

---

## 🏛️ Arquitectura y Tecnologías

El proyecto implementa una arquitectura desacoplada por capas con separación estricta de responsabilidades:

```
┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│     CLIENTE (SPA)      │  HTTP   │     SERVIDOR (API)     │  SQL    │     BASE DE DATOS      │
│   React 18 + Vite      ├────────►│   Node.js + Express    ├────────►│    PostgreSQL Cloud    │
│  Material UI + Router  │  JSON   │    Sequelize ORM       │  SSL    │         (Neon)         │
└────────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

### Frontend
* **Core:** React 18 con Vite (compilación ultrarrápida y bundles optimizados).
* **UI & Estilos:** Material UI (MUI v5) y Emotion con paleta temática gastronómica.
* **Navegación:** React Router v6 con rutas protegidas por roles (`ADMIN`, `WAITER`, `KITCHEN`).
* **Gráficos & Métricas:** Recharts para tableros analíticos.
* **Cliente HTTP:** Axios con interceptores automáticos de autenticación JWT.

### Backend
* **Core:** Node.js con Express framework.
* **ORM:** Sequelize con dialecto PostgreSQL (`pg` + `pg-hstore`).
* **Seguridad & Auth:** JWT (`jsonwebtoken`) + Hashing seguro con `bcryptjs` (salt 10).
* **Validación:** `express-validator` con sanitización de inputs y validación de reglas de negocio.
* **CORS & Headers:** Control de origen configurado por variables de entorno.

### Base de Datos
* **PostgreSQL en la nube (Neon):** Persistencia relacional ACID, conexión segura mediante TLS/SSL obligatorio.

---

## 💼 Reglas de Negocio Implementadas

1. **Dependencia de Caja Diaria:** Ningún mozo puede emitir pedidos si la caja del día no fue abierta previamente por un administrador.
2. **Ocupación Automática de Mesas:** Al crear una orden en una mesa disponible (`AVAILABLE`), la mesa pasa automáticamente a estado `OCCUPIED`.
3. **Liberación Automática:** Al cobrar o cancelar todos los pedidos de una mesa, esta vuelve automáticamente a estado libre (`AVAILABLE`).
4. **Congelamiento de Precios:** El precio unitario de cada plato en la comanda se congela al momento del pedido, preservando el valor histórico aun si la carta cambia de precio posteriormente.
5. **Cierre y Cobro Restringido:** Solo se permite cobrar y cerrar un pedido cuando el 100% de sus platos han sido marcados como entregados (`DELIVERED`).
6. **Balance Automático de Caja:** Al cerrar un pedido, su total se suma automáticamente a la recaudación acumulada (`total_sales`) de la caja activa.
7. **Bloqueo de Cierre de Caja:** La caja no puede cerrarse si aún existen pedidos abiertos o en preparación en el salón.

---

## 📁 Estructura del Repositorio

```
menumaster/
├── backend/                  # Servidor API REST
│   ├── src/
│   │   ├── config/           # Configuración de base de datos y Sequelize
│   │   ├── controllers/      # Controladores de lógica de negocio
│   │   ├── middleware/       # Middlewares de Auth (JWT/Roles) y ErrorHandler
│   │   ├── models/           # Modelos Sequelize (User, Table, Dish, Order, etc.)
│   │   ├── routes/           # Definición de rutas y validaciones
│   │   ├── seeders/          # Carga de datos iniciales
│   │   └── index.js          # Punto de entrada de la API
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── .gitignore
│   └── package.json
│
├── frontend/                 # Aplicación Web React
│   ├── src/
│   │   ├── components/       # Layout, Barra de navegación, Modales reutilizables
│   │   ├── context/          # AuthContext (Sesión y permisos de usuario)
│   │   ├── pages/            # Vistas (Dashboard, Salón, Nuevo Pedido, Cocina, etc.)
│   │   ├── services/         # Servicios de conexión con la API (Axios)
│   │   ├── theme.js          # Configuración del tema Material UI
│   │   ├── App.jsx           # Ruteo principal y protección de accesos
│   │   └── main.jsx          # Render inicial
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── spec.md                   # Documento de especificación funcional y técnica
├── QA_REPORT.md              # Informe de pruebas y casos ejecutados
├── .gitignore                # Reglas globales de exclusión Git
└── README.md                 # Documentación principal
```

---

## ⚙️ Instalación y Ejecución en Entorno Local

### Prerrequisitos
* Node.js v18 o superior instalado.
* Instancia local o remota de PostgreSQL (ej: base gratuita en [neon.tech](https://neon.tech)).
* Git.

### 1. Clonar el repositorio
```bash
git clone https://github.com/TAIN-git/menumaster.git
cd menumaster
```

### 2. Configurar y levantar el Backend
```bash
cd backend
npm install

# Crear archivo de variables de entorno a partir del ejemplo
cp .env.example .env
```

Editar `.env` con tus datos:
```env
PORT=3001
DATABASE_URL=postgresql://tu_usuario:tu_password@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

Poblar la base de datos con datos de prueba iniciales:
```bash
npm run seed
```

Iniciar el servidor de desarrollo:
```bash
npm run dev
# El servidor iniciará en http://localhost:3001
```

### 3. Configurar y levantar el Frontend
En una nueva terminal:
```bash
cd frontend
npm install

# Configurar variable de entorno
cp .env.example .env
```

El archivo `.env` del frontend debe apuntar a la API local:
```env
VITE_API_URL=http://localhost:3001/api
```

Iniciar el cliente de desarrollo:
```bash
npm run dev
# La aplicación abrirá en http://localhost:5173
```

---

## 🔒 Seguridad y Buenas Prácticas
* **Cero Credenciales en Código:** No existen contraseñas, URLs de conexión ni tokens en el código fuente. Todo se administra mediante variables de entorno seguras (`.env`), las cuales están estrictamente ignoradas en `.gitignore`.
* **Cifrado en Tránsito y Reposo:** Contraseñas hasheadas con salt rounds en BD y conexión SSL forzada con el cluster de PostgreSQL en Neon.
* **Control de Sesiones:** Tokens JWT con tiempo de caducidad y verificación de estado activo del usuario en cada petición sensible.

---

## 👥 Roles y Usuarios para Pruebas

| Rol | Email | Contraseña | Capacidades |
|---|---|---|---|
| **ADMIN** | `admin@menumaster.com` | `Admin123!` | Control total: Carta, Mesas, Usuarios, Caja, Dashboard y Pedidos |
| **WAITER** | Crear desde panel de Admin | - | Salón en vivo, Toma de pedidos, Mis pedidos, Entrega a mesa |
| **KITCHEN** | Crear desde panel de Admin | - | Monitor KDS en tiempo real, Notificación de platos listos |

---

## 📄 Documentación Adicional del Proyecto
* [Plano Funcional y Especificación Técnica (spec.md)](./spec.md)
* [Informe de Pruebas y Aseguramiento de Calidad (QA_REPORT.md)](./QA_REPORT.md)
