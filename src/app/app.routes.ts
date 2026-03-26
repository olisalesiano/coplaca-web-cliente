import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { RegisterComponent } from './shared/components/register/register.component';
import { OurProductsComponent } from './features/client/components/our-products/our-products.component';
import { ProfileComponent } from './shared/components/profile/profile.component';
import { CartComponent } from './features/client/components/cart/cart.component';
import { OrdersComponent } from './features/client/components/orders/orders.component';
import { CheckoutComponent } from './features/client/components/checkout/checkout.component';
import { ClientLayoutComponent } from './features/client/layout/client-layout.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // CLIENTE (todo dentro del layout)
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard], // protege todo el módulo
    children: [
      { path: '', redirectTo: 'our-products', pathMatch: 'full' },
      { path: 'our-products', component: OurProductsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'cart', component: CartComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'checkout', component: CheckoutComponent },
    ],
  },

  // ADMIN
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [],
  },

  // LOGÍSTICA
  {
    path: 'logistics',
    canActivate: [AuthGuard],
    children: [],
  },

  // fallback
  { path: '**', redirectTo: 'login' },
];