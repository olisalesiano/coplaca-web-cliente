import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth.store';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  constructor(
    private readonly router: Router,
    private readonly authStore: AuthStore,
  ) {}

  goToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  goToStats(): void {
    this.router.navigate(['/admin/stats']);
  }

  logout(): void {
    this.authStore.clear();
    this.router.navigate(['/login']);
  }
}
