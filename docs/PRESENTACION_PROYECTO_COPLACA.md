# Presentacion Proyecto Coplaca Web Cliente

## 1. Portada
- Proyecto: Coplaca Web Cliente
- Tipo: Frontend e-commerce con gestion por roles
- Stack: Angular 21 + TypeScript + RxJS
- Objetivo: digitalizar el flujo completo de compra, gestion y logistica de productos frescos

## 2. Problema que resuelve
- Centraliza en una sola aplicacion los procesos de:
  - registro e inicio de sesion
  - exploracion de catalogo y compra
  - seguimiento de pedidos
  - gestion operativa (admin y logistica)
- Reduce friccion en la compra del cliente y mejora la trazabilidad interna.

## 3. Objetivos funcionales
- Autenticacion por roles.
- Catalogo con busqueda, filtros y ofertas.
- Carrito y checkout.
- Historial de pedidos.
- Perfil editable con direccion geolocalizada.
- Backoffice para administracion y logistica.

## 4. Arquitectura general
### Frontend
- Angular standalone components.
- Router centralizado en `src/app/app.routes.ts`.
- Providers globales en `src/app/app.config.ts`.

### Capa de datos
- Servicio API unificado en `src/app/core/api.service.ts`.
- Modelos DTO en `src/app/core/api.models.ts`.

### Estado local
- Sesion: `AuthStore` (`coplaca_token`, `coplaca_session`).
- Carrito: `CartStore` (`coplaca_cart`).
- Pedidos locales por usuario: `OrderStore` (`coplaca_orders_user_<scope>`).

### Seguridad
- `AuthGuard`: bloqueo por autenticacion y rol.
- `JwtInterceptor`: agrega Bearer token y gestiona 401.

## 5. Estructura del proyecto
```text
src/
  main.ts
  app/
    app.config.ts
    app.routes.ts
    core/
      api.service.ts
      api.models.ts
      auth.store.ts
      cart.store.ts
      order.store.ts
      address-geo.service.ts
    guards/
      auth.guard.ts
    interceptors/
      jwt.interceptor.ts
    features/
      admin/
      client/
      logistics/
    shared/
      components/login
      components/register
      components/profile
```

## 6. Roles y navegacion
### Publico
- `/login`
- `/register`

### Cliente y repartidor
- `/client/our-products`
- `/client/cart`
- `/client/checkout`
- `/client/orders`
- `/client/profile`

### Administrador
- `/admin/users`
- `/admin/stats`
- `/admin/profile`

### Logistica
- `/logistics/dashboard`
- `/logistics/orders`
- `/logistics/products`
- `/logistics/profile`

## 7. Flujo end-to-end (cliente)
1. Usuario se registra o inicia sesion.
2. Sistema guarda sesion/token y redirige segun rol.
3. Usuario navega catalogo, filtra y agrega productos.
4. Carrito persiste cantidades en localStorage.
5. Checkout valida direccion y metodo de pago.
6. Se crea pedido en backend.
7. Historial muestra pedidos remotos + fallback local.

## 8. Geolocalizacion y direccion inteligente
- Durante registro/perfil:
  - se intentan resolver coordenadas por codigo postal o direccion.
  - se calcula almacen mas cercano.
- Beneficio: mejor asignacion operativa para despacho.

## 9. Endpoints principales consumidos
- Auth: `/auth/login`, `/auth/signup`
- Cliente: `/api/v1/products`, `/api/v1/orders/me`, `/api/v1/users/me`
- Pedidos: `POST /api/v1/orders`
- Almacenes: `/api/v1/warehouses`
- Admin: `/api/v1/admin/*`
- Logistica: `/api/v1/orders/warehouse/*`, `/api/v1/offers`, `/api/v1/products/*`

## 10. Responsive y UX
- El modulo cliente esta adaptado a movil:
  - `client-layout`
  - `our-products`
  - `cart`
  - `orders`
  - `checkout`
  - `login` y `register`
- Ajustes clave:
  - navbar con wrap y reflujo en pantallas pequenas
  - tarjetas y grids fluidos
  - modales adaptados a ancho movil
  - botones de accion a ancho completo en mobile

## 11. Manejo de errores y resiliencia
- Interceptor fuerza relogin en 401.
- Mensajes de error orientados al usuario en login/register.
- Fallback de pedidos locales para no perder trazabilidad si falla backend.

## 12. Calidad y pruebas
- Pruebas unitarias con Vitest.
- Comando de ejecucion:
  - `npm run test`
- Verificacion de endpoints backend:
  - `npm run check:endpoints`

## 13. Ejecucion local
1. `npm install`
2. `npm run start`
3. Abrir `http://localhost:4200`

## 14. Guion recomendado para exposicion (15 minutos)
### Bloque 1 (2 min): Contexto
- problema, objetivo y usuarios

### Bloque 2 (4 min): Arquitectura
- capas, stores, guard/interceptor, rutas

### Bloque 3 (5 min): Demo funcional
- login -> catalogo -> carrito -> checkout -> pedidos -> perfil
- mostrar vista admin/logistica brevemente

### Bloque 4 (2 min): Seguridad y robustez
- JWT, control de roles, fallback local

### Bloque 5 (2 min): Cierre
- impacto, lecciones aprendidas, roadmap

## 15. Roadmap propuesto
- Integrar pruebas end-to-end (Playwright/Cypress).
- Mejorar observabilidad (logs front + trazas).
- Internacionalizacion y accesibilidad avanzada.
- Dashboard de metricas de negocio en tiempo real.

## 16. Mensaje de cierre sugerido
"Coplaca Web Cliente unifica compra, operacion y logistica en una sola experiencia, con arquitectura modular, seguridad por roles y una interfaz responsive preparada para uso real en escritorio y movil."

## 17. Profundizacion tecnica: arquitectura Angular
### 17.1 Bootstrap standalone
- La aplicacion utiliza `bootstrapApplication` en lugar de `NgModule` raiz.
- Ventajas:
  - menor friccion para dividir por componentes standalone
  - registro directo de providers globales
  - menor complejidad de arranque

Ejemplo:

```ts
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

### 17.2 Inyeccion de dependencias global
- En `app.config.ts` se registran:
  - router
  - http client
  - interceptor JWT
  - listeners de errores globales

Ejemplo:

```ts
provideHttpClient(withInterceptorsFromDi()),
{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
```

## 18. Profundizacion tecnica: enrutado y seguridad
### 18.1 Modelo de rutas por dominio
- Publico: autenticacion (`/login`, `/register`).
- Cliente: compra y perfil (`/client/*`).
- Administracion: gestion interna (`/admin/*`).
- Logistica: operativa de almacen (`/logistics/*`).

### 18.2 Control de acceso por rol
- Cada area protegida declara `data.roles`.
- `AuthGuard`:
  - bloquea si no hay sesion
  - bloquea si rol no coincide
  - redirige al home correspondiente por rol

Ejemplo:

```ts
if (!this.authStore.isLoggedIn()) {
  this.router.navigate(['/login']);
  return false;
}
```

## 19. Profundizacion tecnica: capa de datos
### 19.1 ApiService como facade
- Toda la comunicacion HTTP pasa por `ApiService`.
- Beneficios:
  - unificacion de endpoints
  - tipado fuerte con DTOs
  - transformacion de respuestas heterogeneas

Ejemplo de normalizacion:

```ts
private unwrapListResponse<T>(response: T[] | ApiSuccessResponse<T[]>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  return [];
}
```

### 19.2 Estrategia de cabeceras autenticadas
- Los endpoints protegidos agregan `Authorization: Bearer <token>`.
- Se centraliza en un helper privado para evitar duplicacion.

```ts
private authHeaders(): HttpHeaders {
  const token = this.authStore.getToken();
  return new HttpHeaders({ Authorization: `Bearer ${token}` });
}
```

## 20. Profundizacion tecnica: persistencia local
### 20.1 AuthStore
- Persiste sesion/token.
- Interpreta roles backend a roles de aplicacion.
- Determina ruta por defecto por rol.

### 20.2 CartStore
- Mantiene estado del carrito en `localStorage`.
- Acumula kilos cuando se repite el producto.

### 20.3 OrderStore
- Guarda pedidos por usuario usando clave scope.
- Fusiona pedidos API + offline para resiliencia.

Ejemplo de merge:

```ts
const merged = [...ordersFromApi];
for (const localOrder of local) {
  const alreadyPresent = merged.some((remoteOrder) =>
    remoteOrder.id === localOrder.id || remoteOrder.orderNumber === localOrder.orderNumber
  );
  if (!alreadyPresent) merged.push(localOrder);
}
```

## 21. Profundizacion tecnica: geolocalizacion y logistica
### 21.1 Resolucion de direccion con fallback
- Proveedores usados:
  1. Photon
  2. OpenCage
  3. Nominatim

- Motivo:
  - mejorar disponibilidad cuando un proveedor falla
  - aumentar precision en Canarias

### 21.2 Almacen mas cercano
- Se calcula distancia geodesica entre cliente y almacenes activos.
- Resultado:
  - nombre de almacen
  - distancia en km para UI y operacion

## 22. Profundizacion tecnica: modulos funcionales
### 22.1 Cliente
- `our-products`: filtros dinamicos, tarjetas de producto, ofertas.
- `cart`: metodos de pago y validaciones.
- `checkout`: confirmacion y validaciones locales.
- `orders`: historial y detalle de pedidos.
- `profile`: datos personales, direccion y saldo.

### 22.2 Admin
- `users`: CRUD operativo y ajuste de rol/estado.
- `stats`: top ventas y salud de backend.
- `profile`: KPIs de plataforma.

### 22.3 Logistica
- `dashboard`: estado del almacen y repartidores.
- `orders`: asignacion de pedidos a reparto.
- `products`: gestion de stock/precios/ofertas.
- `profile`: resumen de rendimiento del almacen.

## 23. Ejemplos de escenarios de demo (tecnico-funcional)
### Escenario A: login con rol cliente
1. Iniciar sesion con usuario cliente.
2. Ver redireccion automatica a `/client/our-products`.
3. Explicar el `AuthStore.getDefaultRouteForCurrentRole()`.

### Escenario B: pedido con fallback offline
1. Agregar productos al carrito.
2. Simular error backend al crear pedido.
3. Mostrar que `OrderStore.prependOrder()` conserva el pedido local.
4. Entrar en pedidos y evidenciar merge local/remoto.

### Escenario C: operacion logistica
1. Iniciar sesion con rol logistica.
2. Ir a `/logistics/orders`.
3. Asignar pedido a repartidor.
4. Mostrar validaciones de estado y mensajes operativos.

## 24. Matriz de decisiones tecnicas
| Decision | Alternativa | Motivo elegido |
|---|---|---|
| Standalone Components | NgModules clasicos | Menor complejidad y mejor modularidad |
| Stores en localStorage | NgRx global | Menor overhead para alcance actual |
| Interceptor JWT global | Token manual por request | Seguridad transversal centralizada |
| Fallback offline de pedidos | Solo backend | Resiliencia y continuidad UX |
| Geocoding con fallback | Un proveedor unico | Mayor disponibilidad y precision |

## 25. Rendimiento y mantenibilidad
### 25.1 Practicas aplicadas
- `trackBy` en listas para reducir renders innecesarios.
- Separacion por dominios (`features/admin`, `features/client`, `features/logistics`).
- DTOs tipados para disminuir errores de integracion.

### 25.2 Oportunidades de mejora
- cache por consulta de productos/categorias.
- virtualizacion en listados extensos.
- monitorizacion de tiempos de respuesta por endpoint.

## 26. Riesgos y mitigaciones
| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Caida de API | Alto | Fallback local en pedidos y mensajes claros |
| Token expirado | Medio | Interceptor 401 + redireccion controlada |
| Inconsistencia de roles backend | Medio | Normalizacion de roles en AuthStore |
| Geocoding incompleto | Medio | Cascada Photon/OpenCage/Nominatim |

## 27. Plan de pruebas para la exposicion
### 27.1 Smoke test previo
1. `npm install`
2. `npm run start`
3. `npm run test`
4. `npm run check:endpoints`

### 27.2 Checklist de demo en vivo
1. Login correcto e incorrecto.
2. Registro con validaciones de contrasena.
3. Filtros de catalogo + alta al carrito.
4. Checkout y confirmacion de pedido.
5. Vista de pedidos.
6. Perfil con edicion y saldo.
7. Vista admin y logistica.

## 28. Guion ampliado para exposicion (25-30 minutos)
### Tramo 1 (4 min): Introduccion de negocio
- contexto, problema, objetivos y alcance

### Tramo 2 (6 min): Arquitectura tecnica
- flujo frontend, router, guard, interceptor, stores

### Tramo 3 (10 min): Demo completa
- cliente: login -> catalogo -> carrito -> checkout -> pedidos -> perfil
- admin/logistica: navegacion y operativa principal

### Tramo 4 (5 min): Decisiones tecnicas y calidad
- por que standalone, por que stores locales, como se maneja resiliencia

### Tramo 5 (3 min): Cierre y roadmap
- mejoras futuras, riesgos, valor entregado

## 29. Anexo de snippets listos para explicar en diapositiva
### 29.1 Redireccion por rol
```ts
switch (role) {
  case 'admin': return '/admin/users';
  case 'logistics': return '/logistics/orders';
  case 'customer':
  case 'delivery': return '/client/our-products';
  default: return '/login';
}
```

### 29.2 Interceptor de seguridad
```ts
if (token) {
  request = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}
```

### 29.3 Fallback de pedidos
```ts
this.apiService.createOrder(items).subscribe({
  next: (createdOrder) => this.orderStore.prependOrder(createdOrder),
  error: () => this.orderStore.prependOrder(this.buildLocalOrderFromCart()),
});
```

### 29.4 Geocoding por codigo postal
```ts
const resolved = await this.addressGeoService.geocodeFromPostalCode(postalCode);
if (resolved) {
  this.coordinates = { latitude: resolved.latitude, longitude: resolved.longitude };
}
```

## 30. Conclusiones tecnicas
- El proyecto cumple una arquitectura modular clara por dominio.
- Implementa seguridad transversal con guard + interceptor.
- Tiene resiliencia funcional gracias a persistencia local y merge de pedidos.
- La experiencia responsive permite usar el sistema en escritorio y movil.
- La base tecnica es escalable para futuras integraciones y pruebas e2e.
