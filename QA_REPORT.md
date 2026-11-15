# 🧪 Informe de Pruebas y Aseguramiento de Calidad (QA) — MenuMaster

## 1. Resumen Ejecutivo
* **Proyecto:** MenuMaster — Sistema de Gestión Gastronómica Full Stack
* **Fecha de Ejecución:** Noviembre 2026
* **Ambiente de Pruebas:** Local + Staging Cloud (Neon PostgreSQL + Node.js API + React Client)
* **Resultado Global:** 100% Casos Críticos Aprobados (PASS)

---

## 2. Alcance y Estrategia de Pruebas
Se ejecutaron pruebas integrales sobre los tres pilares del sistema:
1. **Seguridad y Control de Acceso (Auth & RBAC):** Verificación de tokens JWT, protección de rutas y permisos por rol (`ADMIN`, `WAITER`, `KITCHEN`).
2. **Validación de Reglas de Negocio:** Coherencia de estados de mesas, congelamiento de precios históricos, dependencia de caja abierta y condiciones de cierre de pedidos.
3. **Integración End-to-End (E2E):** Flujo completo desde la apertura de caja, toma de comanda por mozo, preparación en cocina, entrega a mesa, hasta el cobro y cierre de caja.

---

## 3. Matriz de Casos de Prueba y Resultados

### Módulo 1: Autenticación y Autorización (RBAC)
| ID | Caso de Prueba | Criterio de Aceptación | Resultado | Estado |
|---|---|---|---|:---:|
| CP-01 | Login con credenciales válidas | Devuelve HTTP 200, JWT token y objeto de usuario con su rol. Redirige según rol. | Token generado con éxito, redirección correcta. | **PASS** |
| CP-02 | Login con contraseña errónea | Devuelve HTTP 401 con mensaje descriptivo "Credenciales inválidas". | Respuesta 401, mensaje claro en UI. | **PASS** |
| CP-03 | Acceso a rutas protegidas sin token | Interceptor deniega acceso y redirige a `/login`. | Solicitudes API rechazadas con 401. | **PASS** |
| CP-04 | Intento de Mozo de acceder a `/users` | Sistema impide el acceso y muestra vista restringida o redirige a su panel. | Redirigido a `/floor`. | **PASS** |
| CP-05 | Intento de Cocina de cobrar pedidos | Endpoint `/api/orders/:id/close` denegado por middleware de rol. | Devuelve HTTP 403 Forbidden. | **PASS** |

---

### Módulo 2: Ciclo de Caja y Reglas de Apertura
| ID | Caso de Prueba | Criterio de Aceptación | Resultado | Estado |
|---|---|---|---|:---:|
| CP-06 | Crear comanda sin caja abierta | La API debe rechazar con HTTP 400 y mensaje "La caja del día no está abierta". | Pedido bloqueado, advertencia visible para el mozo. | **PASS** |
| CP-07 | Apertura de caja del día | Crea registro con monto inicial, estado `OPEN` y usuario responsable. | Caja iniciada correctamente con $10.000. | **PASS** |
| CP-08 | Reintentar abrir caja ya abierta | Bloqueo por restricción de fecha única (`date UK`). | Rechazo controlado con mensaje informativo. | **PASS** |
| CP-09 | Cierre de caja con pedidos activos | Sistema impide el balance hasta que todas las mesas hayan concluido sus cobros. | Bloqueo exitoso: "No se puede cerrar con pedidos abiertos". | **PASS** |
| CP-10 | Cierre exitoso de caja | Calcula `closingAmount = openingAmount + totalSales`. | Suma matemática exacta de ventas acumuladas. | **PASS** |

---

### Módulo 3: Flujo de Comandas y Salón (Mozo & Salón)
| ID | Caso de Prueba | Criterio de Aceptación | Resultado | Estado |
|---|---|---|---|:---:|
| CP-11 | Ocupación automática de mesa | Al abrir pedido en mesa disponible, su estado pasa automáticamente a `OCCUPIED`. | Mesa #3 pasa de `AVAILABLE` a `OCCUPIED` instantáneamente. | **PASS** |
| CP-12 | Congelamiento de precios | Si el precio de la "Pizza Muzzarella" cambia en la carta, los pedidos anteriores mantienen su precio unitario. | Precio en `order_items` preservado inalterable. | **PASS** |
| CP-13 | Incorporación de notas especiales | Ítems creados con observaciones particulares ("sin sal", "punto medio"). | Las observaciones viajan y se muestran en comanda de cocina. | **PASS** |
| CP-14 | Cálculo de totales | El total de la orden se recalcula automáticamente sumando `quantity * unitPrice`. | Subtotales y total calculados con precisión decimal. | **PASS** |

---

### Módulo 4: Monitor de Cocina (KDS)
| ID | Caso de Prueba | Criterio de Aceptación | Resultado | Estado |
|---|---|---|---|:---:|
| CP-15 | Visualización en tiempo real | Platos pedidos aparecen en cola de cocina ordenados por antigüedad (FIFO). | Orden de llegada respetado con tiempo transcurrido visible. | **PASS** |
| CP-16 | Notificación de plato listo | Cocinero presiona "¡LISTO PARA SERVIR!"; el estado del ítem pasa a `READY`. | Estado actualizado; mozo recibe aviso para servir. | **PASS** |
| CP-17 | Actualización global de comanda | Cuando el último ítem de un pedido pasa a `READY`, la orden general pasa a `READY`. | Orden transiciona automáticamente a estado listo. | **PASS** |

---

### Módulo 5: Entrega, Cobro y Liberación de Mesas
| ID | Caso de Prueba | Criterio de Aceptación | Resultado | Estado |
|---|---|---|---|:---:|
| CP-18 | Entrega de plato a la mesa | Mozo marca ítem como `DELIVERED`. | Ítem pasa a estado entregado. | **PASS** |
| CP-19 | Bloqueo de cobro prematuro | Botón "Cerrar y Cobrar" deshabilitado mientras existan platos pendientes o en cocina. | Imposible cobrar con ítems no entregados. | **PASS** |
| CP-20 | Cierre de orden y balance de caja | Al cerrar pedido, el total se suma al `totalSales` de la caja abierta y la mesa vuelve a `AVAILABLE`. | Venta sumada a caja y mesa liberada para nuevo cliente. | **PASS** |

---

## 4. Pruebas de Rendimiento y Resiliencia
* **Transacciones de Base de Datos:** Se probaron inserciones masivas de ítems bajo transacción Sequelize; ante un fallo de validación se produjo rollback completo sin inconsistencias.
* **CORS & Seguridad Web:** Headers `Access-Control-Allow-Origin` configurados para admitir únicamente el dominio de frontend autorizado.
* **Persistencia Segura (.env):** Inspección de código certifica cero variables de entorno, claves secretas o passwords en archivos públicos o en Git.

---

## 5. Conclusión
El sistema **MenuMaster** satisface el 100% de los criterios funcionales, de negocio y técnicos estipulados en la consigna del Proyecto Final Integrador.
