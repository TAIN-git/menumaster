# 📋 Documento de Especificación Funcional y Técnica — MenuMaster

## 1. Introducción y Propósito
**MenuMaster** es una plataforma web Full Stack integral orientada a la digitalización y gestión operativa de establecimientos gastronómicos (restaurantes, bares, cafeterías). 

El sistema optimiza la comunicación y sincronización de tres áreas críticas del negocio:
1. **Salón (Mozos / Meseros):** Visualización del estado de mesas y comanda digital inmediata.
2. **Cocina:** Panel de preparación en tiempo real (KDS - Kitchen Display System) ordenado cronológicamente.
3. **Administración / Caja:** Gestión de la carta gastronómica, control de apertura/cierre de caja diaria, auditoría de usuarios y estadísticas de venta.

---

## 2. Requerimientos del Sistema

### 2.1 Requerimientos Funcionales (RF)
* **RF-01 (Autenticación y Roles):** Inicio de sesión con JWT y control de acceso basado en 3 roles (`ADMIN`, `WAITER`, `KITCHEN`).
* **RF-02 (Gestión de Carta):** CRUD de categorías y platos con precio, descripción, estado de disponibilidad e imagen.
* **RF-03 (Gestión de Salón y Mesas):** CRUD de mesas con capacidad y control automático de estados (`AVAILABLE`, `OCCUPIED`, `RESERVED`).
* **RF-04 (Caja Diaria):** Apertura de caja con fondo inicial y cierre con cálculo automático de ventas del día.
* **RF-05 (Comanda y Pedidos):** Creación de pedidos asociados a mesa y mozo, congelamiento de precios históricos por ítem e incorporación de notas personalizadas por plato.
* **RF-06 (Monitor de Cocina):** Listado dinámico de ítems pendientes y botón de cambio de estado a "Listo para servir".
* **RF-07 (Cobro y Facturación):** Cierre de pedidos con validación de platos entregados y acumulación de ventas en la caja abierta.
* **RF-08 (Métricas y Reportes):** Dashboard con recaudación del día, volumen de órdenes y ranking de platos más vendidos.

### 2.2 Requerimientos No Funcionales (RNF)
* **RNF-01 (Arquitectura Desacoplada):** Frontend (SPA React) y Backend (REST API Express) completamente independientes.
* **RNF-02 (Persistencia Relacional en la Nube):** PostgreSQL alojado en Neon con cifrado SSL.
* **RNF-03 (Seguridad):** Hashing de contraseñas con bcrypt (salt rounds 10), tokens JWT expirables y cero credenciales en código duro.
* **RNF-04 (Responsividad y Usabilidad):** Interfaz adaptativa (móviles, tablets de mozo y monitores de cocina) basada en Material UI.
* **RNF-05 (Confiabilidad y Transacciones):** Manejo de transacciones ACID en Sequelize para operaciones críticas (creación de comanda y cierre de caja).

---

## 3. Modelo de Dominio y Entidades

### 3.1 Diagrama Entidad-Relación (DER)
```
+-------------+         +----------------+         +-------------------+
|    USERS    | 1     N |     ORDERS     | 1     N |    ORDER_ITEMS    |
+-------------+<--------+----------------+<--------+-------------------+
| id (PK)     |         | id (PK)        |         | id (PK)           |
| name        |         | table_id (FK)  |         | order_id (FK)     |
| email (UK)  |         | waiter_id (FK) |         | dish_id (FK)      |
| password    |         | cash_reg_id(FK)|         | quantity          |
| role        |         | status         |         | unit_price        |
| active      |         | total          |         | subtotal          |
+-------------+         | notes          |         | status            |
                        +----------------+         | notes             |
                                | N                +-------------------+
                                |                           | N
                                | 1                         | 1
                        +----------------+         +-------------------+
                        |     TABLES     |         |      DISHES       |
                        +----------------+         +-------------------+
                        | id (PK)        |         | id (PK)           |
                        | number (UK)    |         | category_id (FK)  |
                        | capacity       |         | name              |
                        | status         |         | price             |
                        +----------------+         | available         |
                                                   +-------------------+
                                                            | N
                                                            | 1
                                                   +-------------------+
                                                   |    CATEGORIES     |
                                                   +-------------------+
                                                   | id (PK)           |
                                                   | name (UK)         |
                                                   | display_order     |
                                                   +-------------------+
```

### 3.2 Definición de Atributos Clave
1. **Users:** `ADMIN` (acceso total), `WAITER` (salón y pedidos propios), `KITCHEN` (monitor de preparación).
2. **Tables:** `AVAILABLE` (libre para ocupar), `OCCUPIED` (pedido abierto activo), `RESERVED` (bloqueada).
3. **Orders:** `OPEN`, `IN_PROGRESS`, `READY`, `DELIVERED`, `CLOSED`, `CANCELLED`.
4. **OrderItems:** `PENDING`, `PREPARING`, `READY`, `DELIVERED`.
5. **CashRegisters:** `OPEN`, `CLOSED` (1 registro por fecha única).

---

## 4. Reglas de Negocio Estrictas

1. **Precondición de Apertura de Caja:** No se permite emitir ni crear ninguna orden si no existe una caja diaria abierta para la fecha actual (`status = 'OPEN'`).
2. **Ocupación Automática de Mesas:** Al generar el primer pedido para una mesa disponible, la mesa pasa de forma inmediata e irreversible a estado `OCCUPIED`.
3. **Liberación de Mesas:** Una mesa solo vuelve a estado `AVAILABLE` cuando todos los pedidos asociados han sido cerrados (`CLOSED`) o cancelados (`CANCELLED`).
4. **Congelamiento Histórico de Precios:** El valor unitario (`unit_price`) del ítem del pedido se copia del precio vigente del plato al momento de la comanda. Modificaciones posteriores en la carta no alteran pedidos existentes.
5. **Condición de Cobro (Cierre de Pedido):** Una comanda solo puede finalizarse y cobrarse (`CLOSED`) si **todos** sus ítems asociados poseen el estado `DELIVERED`.
6. **Integridad de Caja:** La recaudación total (`total_sales`) de la caja diaria se incrementa de forma automática con el monto total del pedido en el instante exacto de su cierre.
7. **Bloqueo de Cierre de Caja:** No es posible cerrar la caja si persisten mesas u órdenes en estado abierto o en preparación en el salón.
8. **Disponibilidad de Platos:** Los platos con `available = false` quedan excluidos automáticamente del catálogo disponible para los mozos.

---

## 5. Casos Borde y Manejo de Errores

| Caso Borde | Comportamiento del Sistema | Código HTTP |
|------------|----------------------------|-------------|
| Mozo intenta crear pedido sin caja abierta | Bloqueo con alerta clara: *"La caja del día no está abierta"* | 400 Bad Request |
| Intento de cerrar pedido con platos pendientes de servir | Rechazo: *"Todos los ítems deben estar entregados para cerrar"* | 400 Bad Request |
| Administrador intenta cerrar caja con órdenes activas | Bloqueo: *"No se puede cerrar la caja con órdenes pendientes"* | 400 Bad Request |
| Desactivación de plato que está en un pedido en curso | Se mantiene el ítem en la comanda con su precio congelado | 200 OK |
| Intento de duplicar número de mesa o email de usuario | Validación única en BD y Sequelize interceptada con mensaje descriptivo | 400 Bad Request |
| Token JWT expirado o manipulado | Redirección inmediata a pantalla de Login | 401 Unauthorized |

---

## 6. Endpoints de la API REST

### Autenticación & Usuarios
* `POST /api/auth/login` — Autenticación con credenciales y entrega de Bearer Token.
* `GET /api/auth/me` — Validación de sesión y perfil del usuario actual.
* `GET /api/users` — Listado de colaboradores (Admin).
* `POST /api/users` — Registro de nuevo colaborador (Admin).
* `PUT /api/users/:id` — Actualización de rol o datos (Admin).
* `DELETE /api/users/:id` — Baja lógica del usuario (Admin).

### Menú (Categorías & Platos)
* `GET /api/categories` — Listado de categorías activas.
* `POST /api/categories` — Alta de categoría (Admin).
* `GET /api/dishes` — Listado general con filtro por categoría.
* `GET /api/dishes/available` — Carta activa para toma de comanda.
* `POST /api/dishes` — Alta de nuevo plato con precio y categoría (Admin).
* `PUT /api/dishes/:id` — Edición de datos o toggle de disponibilidad.

### Salón & Mesas
* `GET /api/tables` — Mapa de estado de todas las mesas.
* `POST /api/tables` — Creación de mesa con número y capacidad.
* `PUT /api/tables/:id` — Actualización de mesa.

### Pedidos & Comandas
* `GET /api/orders` — Listado de órdenes con filtros por estado, mesa y mozo.
* `GET /api/orders/:id` — Detalle completo con ítems y platos asociados.
* `POST /api/orders` — Apertura de comanda para una mesa.
* `POST /api/orders/:id/items` — Incorporación de platos y notas a la orden.
* `PUT /api/orders/:id/items/:itemId` — Cambio de estado de ítem (Cocina / Mozo).
* `DELETE /api/orders/:id/items/:itemId` — Eliminación de ítem no despachado.
* `POST /api/orders/:id/close` — Cobro y finalización de la orden.
* `POST /api/orders/:id/cancel` — Cancelación de orden.

### Cocina & Caja
* `GET /api/kitchen/queue` — Cola FIFO de platos pendientes en cocina.
* `PUT /api/kitchen/items/:itemId/ready` — Notificación de plato listo.
* `GET /api/cash-register/today` — Estado de caja del día actual.
* `POST /api/cash-register/open` — Apertura con fondo inicial.
* `POST /api/cash-register/close` — Balance y cierre de caja.
* `GET /api/stats/dashboard` — Métricas generales y KPIs diarios.
* `GET /api/stats/top-dishes` — Ranking de platos más consumidos.
