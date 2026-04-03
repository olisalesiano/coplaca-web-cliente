import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/api.service';
import { UserDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css'],
})
// Vista de perfil admin centrada en identidad y datos de cuenta.
export class AdminProfileComponent implements OnInit {
  loading = false;
  error = '';

  user: UserDTO | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // Inicializa perfil y metricas del dashboard administrativo.
  ngOnInit(): void {
    this.loadProfileData();
  }

  get rolesLabel(): string {
    if (!this.user?.roles?.length) {
      return 'Sin roles';
    }

    return this.user.roles.join(', ');
  }

  // Carga usuario autenticado para mostrar perfil de administrador.
  private loadProfileData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el perfil de administrador.';
      },
    });
  }
}
