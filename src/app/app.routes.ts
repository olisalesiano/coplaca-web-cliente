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
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { AdminUsersComponent } from './features/admin/components/users/admin-users.component';
import { AdminStatsComponent } from './features/admin/components/stats/admin-stats.component';
import { AdminProfileComponent } from './features/admin/components/profile/admin-profile.component';
import { LogisticsLayoutComponent } from './features/logistics/layout/logistics-layout.component';
import { LogisticsDashboardComponent } from './features/logistics/components/dashboard/logistics-dashboard.component';
import { LogisticsOrdersComponent } from './features/logistics/components/orders/logistics-orders.component';
import { LogisticsProductsComponent } from './features/logistics/components/products/logistics-products.component';
import { LogisticsProfileComponent } from './features/logistics/components/profile/logistics-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // CLIENTE
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['customer', 'delivery'] },
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
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsersComponent },
      { path: 'stats', component: AdminStatsComponent },
      { path: 'profile', component: AdminProfileComponent },
    ],
  },

  // LOGÍSTICA
  {
    path: 'logistics',
    component: LogisticsLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['logistics'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: LogisticsDashboardComponent },
      { path: 'orders', component: LogisticsOrdersComponent },
      { path: 'products', component: LogisticsProductsComponent },
      { path: 'profile', component: LogisticsProfileComponent },
    ],
  },

  // fallback
  { path: '**', redirectTo: 'login' },
];