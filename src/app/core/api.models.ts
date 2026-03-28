// Estructura de direccion usada en registro y perfil de usuario.
export interface AddressDTO {
  id?: number;
  street: string;
  streetNumber: string;
  apartment?: string;
  city: string;
  postalCode: string;
  province: string;
  latitude?: number;
  longitude?: number;
  additionalInfo?: string;
  isDefault?: boolean;
}

// Perfil de usuario autenticado devuelto por backend.
export interface UserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: AddressDTO;
  warehouseId?: number;
  warehouseName?: string;
  roles?: string[];
  enabled: boolean;
}

// Datos de sesion devueltos en login/signup.
export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// Contrato de producto consumido por catalogo/carrito/logistica.
export interface ProductDTO {
  id: number;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  origin?: string;
  nutritionInfo?: string;
  offerReason?: string;
  discountPercentage?: number;
}

// Metadatos de categoria para filtros y formularios administrativos.
export interface ProductCategoryDTO {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

// Linea de detalle dentro de un pedido.
export interface OrderItemDTO {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Agregado de pedido mostrado en cliente y logistica.
export interface OrderDTO {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  subtotal?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
  items: OrderItemDTO[];
}

// Datos de almacen: ubicacion y estado operativo.
export interface WarehouseDTO {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

// Proyeccion simplificada de usuario para tablas administrativas.
export interface AdminUserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  enabled: boolean;
  warehouseName?: string;
}

// DTO de analitica para ranking de productos vendidos.
export interface TopProductStatDTO {
  productId: number;
  productName: string;
  unitsSold: number;
  totalRevenue?: number;
}

// Proyeccion de pedido orientada al flujo logistico.
export interface LogisticsOrderDTO {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  customerName?: string;
  deliveryAgentName?: string;
  createdAt?: string;
  warehouseName?: string;
}

// DTO de repartidor usado en asignaciones de pedidos.
export interface DeliveryWorkerDTO {
  id: number;
  email?: string;
  firstName: string;
  lastName: string;
  warehouseName?: string;
  deliveryStatus?: 'AT_WAREHOUSE' | 'DELIVERING' | 'OFFLINE';
  enabled?: boolean;
}

// Contrato de ofertas/promociones gestionadas por logistica.
export interface SeasonalOfferDTO {
  id: number;
  productId: number;
  discountPercentage: number;
  reason: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

// Item de carrito persistido en almacenamiento local.
export interface CartItem {
  productId: number;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  stockQuantity: number;
  quantityKg: number;
  offerReason?: string;
}
