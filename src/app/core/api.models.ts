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

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

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

export interface OrderItemDTO {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

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

export interface WarehouseDTO {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

export interface AdminUserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  enabled: boolean;
  warehouseName?: string;
}

export interface TopProductStatDTO {
  productId: number;
  productName: string;
  unitsSold: number;
  totalRevenue?: number;
}

export interface LogisticsOrderDTO {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  customerName?: string;
  createdAt?: string;
  warehouseName?: string;
}

export interface DeliveryWorkerDTO {
  id: number;
  email?: string;
  firstName: string;
  lastName: string;
  warehouseName?: string;
  deliveryStatus?: 'AT_WAREHOUSE' | 'DELIVERING' | 'OFFLINE';
  enabled?: boolean;
}

export interface SeasonalOfferDTO {
  id: number;
  productId: number;
  discountPercentage: number;
  reason: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface CartItem {
  productId: number;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  stockQuantity: number;
  quantityKg: number;
  offerReason?: string;
}
