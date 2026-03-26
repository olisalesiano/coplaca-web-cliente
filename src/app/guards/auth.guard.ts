import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AppRole, AuthStore } from '../core/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authStore: AuthStore,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRoles = route.data['roles'] as AppRole[] | undefined;
    if (!expectedRoles || expectedRoles.length === 0 || this.authStore.hasAnyRole(expectedRoles)) {
      return true;
    }

    this.router.navigate([this.authStore.getDefaultRouteForCurrentRole()]);
    return false;
  }
}
