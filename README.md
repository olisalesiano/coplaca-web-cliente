# Coplaca Web Cliente

Cliente web de Coplaca construido con Angular 21, orientado a flujo e-commerce:
autenticacion, catalogo de productos, carrito, pedidos y perfil de usuario.

## 1. Tecnologias y stack

- Angular 21 (standalone components)
- TypeScript 5.9
- RxJS 7.8
- Angular Material (uso principal de iconos)
- Vitest para pruebas unitarias

## 2. Como ejecutar el proyecto

### Requisitos

- Node.js 20+ recomendado
- npm 10+

### Instalacion

```bash
npm install
```

### Modo desarrollo

```bash
npm run start
```

Abre en navegador: `http://localhost:4200`

### Build de produccion

```bash
npm run build
```

Salida de compilacion: carpeta `dist/`

### Tests

```bash
npm run test
```

## 3. Configuracion de entorno

Los entornos estan en:

- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (produccion)

Variables clave:

- `apiUrl`: URL base del backend

Ademas, la URL de API puede resolverse en runtime mediante:

1. `window.__COPLACA_API_URL__`
2. `localStorage['coplaca_api_url']`
3. `environment.apiUrl`

La logica esta en `src/app/core/api-base-url.ts`.

## 4. Estructura del proyecto (explicada)

```text
src/
	main.ts                    # Bootstrap de la aplicacion
	app/
		app.config.ts            # Providers globales (router/http/interceptor)
		app.routes.ts            # Definicion de rutas
		core/                    # Capa base: API, modelos, stores, geolocalizacion
		services/                # Servicios alternos (legacy/compatibilidad)
		guards/                  # Guard de autenticacion
		interceptors/            # Interceptor JWT
		components/              # Vistas y componentes funcionales
	environments/              # Configuracion por entorno
```

## 5. Arquitectura por capas

### 5.1 Capa de presentacion (`components/`)

Componentes principales:

- `login`: inicio de sesion
- `register`: registro con direccion geolocalizada
- `our-products`: listado, filtros, ofertas y alta al carrito
- `cart`: gestion de carrito y confirmacion de compra
- `orders`: listado de pedidos y detalle
- `profile`: edicion de perfil, domicilio y saldo
- `dlg/dialog`: modal reutilizable para confirmar cantidad de productos

### 5.2 Capa de dominio/datos (`core/`)

- `api.models.ts`: contratos TypeScript (DTOs de usuario, producto, pedido, etc.)
- `api.service.ts`: cliente HTTP principal hacia backend
- `auth.store.ts`: persistencia de sesion/token en `localStorage`
- `cart.store.ts`: persistencia del carrito en `localStorage`
- `order.store.ts`: persistencia de pedidos por usuario y merge con API
- `address-geo.service.ts`: autocompletado/geocodificacion de direccion y almacenes cercanos

### 5.3 Infraestructura transversal

- `jwt.interceptor.ts`: agrega `Authorization: Bearer <token>` y gestiona 401
- `auth.guard.ts`: protege rutas privadas si no hay sesion activa

## 6. Flujo funcional de la aplicacion

### 6.1 Autenticacion

1. Usuario inicia sesion en `login`.
2. `ApiService.login()` devuelve `LoginResponse` con token.
3. `AuthStore.setSession()` guarda token y datos de sesion.
4. Navegacion a `our-products`.

Si una llamada devuelve 401, el interceptor limpia sesion y redirige a `login`.

### 6.2 Registro con direccion inteligente

1. Usuario completa datos en `register`.
2. Se buscan sugerencias con Photon/OpenCage/Nominatim (fallback en cascada).
3. Se calcula almacen mas cercano usando coordenadas de `warehouses`.
4. Se envia `signup` con direccion + lat/lng.

### 6.3 Catalogo y carrito

1. `our-products` carga productos desde API.
2. Se aplican filtros por texto/categoria/stock/ofertas/frescura.
3. Usuario elige kilos y agrega al carrito.
4. `CartStore` persiste items en `localStorage`.

### 6.4 Pedido

1. `cart` permite ajustar cantidades y seleccionar metodo de pago.
2. Se intenta crear pedido en backend.
3. Si falla la API, se crea pedido local de respaldo (modo offline).
4. `orders` mezcla pedidos remotos + locales para no perder historial.

### 6.5 Perfil

1. `profile` carga datos del usuario autenticado.
2. Permite editar datos personales y domicilio.
3. Recalcula coordenadas y almacen cercano por codigo postal/direccion.
4. Permite baja de cuenta y gestion de saldo local (sessionStorage).

## 7. Rutas de la app

Definidas en `src/app/app.routes.ts`:

- `/login` publica
- `/register` publica
- `/our-products` publica (catalogo visible desde el inicio)
- `/profile` protegida por `AuthGuard`
- `/cart` protegida por `AuthGuard`
- `/orders` protegida por `AuthGuard`
- `/` redirige a `/our-products`

## 8. Endpoints consumidos (resumen)

Desde `ApiService`:

- `POST /auth/login`
- `POST /auth/signup`
- `GET /api/v1/products`
- `GET /api/v1/products/search`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `DELETE /api/v1/users/me`
- `GET /api/v1/orders/me`
- `POST /orders`
- `GET /api/v1/warehouses`

Nota: existe una carpeta `src/app/services` con servicios adicionales (`auth.service`, `product.service`, `order.service`, `user.service`). La capa principal actualmente usada por los componentes es `src/app/core/api.service.ts`.

## 9. Persistencia local (estado cliente)

En `localStorage`:

- `coplaca_token`
- `coplaca_session`
- `coplaca_cart`
- `coplaca_orders_user_<scope>`
- `coplaca_api_url` (opcional, override de API)

En `sessionStorage` (estado UI/flujo local):

- `saldo`
- datos temporales de direccion en checkout legacy

## 10. Secciones importantes del codigo

- Bootstrap: `src/main.ts`
- Inyeccion global y providers: `src/app/app.config.ts`
- Seguridad de rutas: `src/app/guards/auth.guard.ts`
- Seguridad HTTP: `src/app/interceptors/jwt.interceptor.ts`
- Cliente API principal: `src/app/core/api.service.ts`
- Geolocalizacion y almacenes: `src/app/core/address-geo.service.ts`
- Logica de pedidos offline/merge: `src/app/core/order.store.ts`

## 11. Scripts disponibles

En `package.json`:

- `npm run start`: levanta servidor dev en puerto 4200 y abre navegador
- `npm run dev`: alias de `start`
- `npm run build`: build de produccion
- `npm run watch`: build development en modo watch
- `npm run test`: pruebas unitarias


