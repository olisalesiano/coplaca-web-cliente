# Guia de uso por perfil de usuario

## Acceso general

La aplicacion COPLACA separa el acceso por roles y cada usuario ve un conjunto distinto de pantallas.

- `login`: acceso al sistema.
- `register`: registro de nuevos usuarios.
- `client`: area para cliente final y repartidor asociado al flujo de compra.
- `logistics`: area operativa de logistica.
- `admin`: area de administracion.

Si el usuario no tiene permisos para una ruta, el sistema lo redirige al acceso correspondiente.

## 1. Usuario cliente

Ruta principal: `/client`

Pantallas disponibles:

- `Tienda / Our products`: `/client/our-products`
- `Carrito`: `/client/cart`
- `Checkout`: `/client/checkout`
- `Mis pedidos`: `/client/orders`
- `Perfil`: `/client/profile`

Uso recomendado:

1. Entrar a la tienda y buscar productos por nombre, categoria o filtros.
2. Revisar si un producto aparece como `Agotado` antes de intentar agregarlo.
3. Abrir el producto y elegir la cantidad en kilos disponible.
4. Pasar al carrito para revisar el pedido.
5. Confirmar la compra desde `Checkout`.
6. Consultar `Mis pedidos` para seguir el estado de las compras.

Puntos importantes:

- Si un producto se queda sin stock, la pantalla lo identifica visualmente como `Agotado`.
- El sistema evita agregar al carrito productos sin disponibilidad.
- El historial de pedidos muestra los pedidos entregados.

## 2. Usuario de logistica

Ruta principal: `/logistics`

Pantallas disponibles:

- `Dashboard`: `/logistics/dashboard`
- `Pedidos`: `/logistics/orders`
- `Productos`: `/logistics/products`
- `Perfil`: `/logistics/profile`

Uso recomendado:

1. Entrar al `Dashboard` para revisar el estado general de la operacion.
2. Abrir `Pedidos` para seguir la gestion operativa de entregas.
3. Ir a `Productos` para controlar stock, precio y ofertas.
4. Revisar el `Perfil` para confirmar los datos de la cuenta.

En `Productos` se puede:

- Ver el stock actual de cada producto.
- Actualizar cantidades de inventario.
- Cambiar el precio unitario.
- Crear o editar ofertas/promociones.
- Identificar productos con stock bajo o `Agotado`.

Puntos importantes:

- Cuando un producto llega a stock cero, queda marcado como `Agotado`.
- La vista muestra un aviso visible para detectar rapidamente los productos sin disponibilidad.
- Si un producto vuelve a tener stock, desaparece la marca de agotado tras la actualizacion del catalogo.

## 3. Usuario administrador

Ruta principal: `/admin`

Pantallas disponibles:

- `Usuarios`: `/admin/users`
- `Estadisticas`: `/admin/stats`
- `Perfil`: `/admin/profile`

Uso recomendado:

1. Entrar en `Usuarios` para buscar cuentas por rol o estado.
2. Editar datos basicos de un usuario cuando sea necesario.
3. Activar, desactivar o eliminar cuentas segun la operativa.
4. Revisar `Estadisticas` para ver indicadores generales del negocio.
5. Consultar `Perfil` para validar la informacion de la cuenta administrativa.

En `Usuarios` se puede:

- Filtrar por rol.
- Filtrar por estado activo o deshabilitado.
- Editar nombre, apellido, email, telefono, rol y estado.
- Eliminar cuentas cuando el sistema lo permita.

En `Estadisticas` se puede:

- Ver el ranking de productos mas vendidos.
- Consultar volumen de pedidos por dia, semana y mes.
- Revisar usuarios activos, deshabilitados y por rol.
- Ver el estado de la base de datos y metrica general del catalogo.

## 4. Resumen rapido por perfil

- Cliente: compra productos, gestiona carrito y consulta pedidos.
- Logistica: controla stock, precios, ofertas y seguimiento operativo.
- Administrador: gestiona usuarios, estadisticas y supervision general.

## 5. Recomendaciones de uso

- Mantener la sesion activa solo en el perfil correspondiente.
- Revisar el aviso de `Agotado` antes de operar con productos sin stock.
- Recargar la pantalla si se sospecha que hubo cambios recientes en inventario.
- Usar el perfil correcto segun el rol asignado por el sistema.
