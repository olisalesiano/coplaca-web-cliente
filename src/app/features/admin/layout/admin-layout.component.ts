import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    private readonly authStore: AuthStore,
  ) {}

  get adminDisplayName(): string {
    const session = this.authStore.getSession();
    if (!session) {
      return 'Administrador';
    }

    const fullName = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim();
    return fullName.length > 0 ? fullName : session.email;
  }

  logout(): void {
    this.authStore.clear();
    window.location.href = '/login';
  }
}
