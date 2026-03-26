// src/app/features/client/client.module.ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Importa los componentes standalone
import { CartComponent } from './components/cart/cart.component';
import { OrdersComponent } from './components/orders/orders.component';
import { OurProductsComponent } from './components/our-products/our-products.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ClientLayoutComponent } from './layout/client-layout.component';

// Importa componentes compartidos
import { ProfileComponent } from '../../shared/components/profile/profile.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ClientLayoutComponent,
        children: [
          { path: '', redirectTo: 'our-products', pathMatch: 'full' },
          { path: 'our-products', component: OurProductsComponent },
          { path: 'profile', component: ProfileComponent },
          { path: 'cart', component: CartComponent },
          { path: 'orders', component: OrdersComponent },
          { path: 'checkout', component: CheckoutComponent },
        ],
      },
    ]),
    // Importa los componentes standalone aquí para que estén disponibles
    CartComponent,
    OrdersComponent,
    OurProductsComponent,
    CheckoutComponent,
    ClientLayoutComponent,
  ],
})
export class ClientModule {}