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
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'our-products', component: OurProductsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },
];