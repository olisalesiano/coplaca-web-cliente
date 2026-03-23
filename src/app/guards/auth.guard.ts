import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthStore } from '../core/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authStore: AuthStore, private router: Router) {}

  canActivate(): boolean {
    if (this.authStore.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
