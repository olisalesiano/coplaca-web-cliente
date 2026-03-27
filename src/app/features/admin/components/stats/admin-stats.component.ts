import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/api.service';
import { TopProductStatDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css'],
})
export class AdminStatsComponent implements OnInit {
  topProducts: TopProductStatDTO[] = [];
  loading = false;
  error = '';
  databaseStatus = '';
  databaseMessage = '';
  usersInDatabase = 0;

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.checkDatabaseHealth();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getTopSellingProductsLastMonth().subscribe({
      next: (products) => {
        this.topProducts = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las estadisticas del ultimo mes.';
      },
    });
  }

  checkDatabaseHealth(): void {
    this.apiService.checkAdminHealth().subscribe({
      next: (response: Record<string, unknown>) => {
        this.databaseStatus = String(response['database'] || 'UNKNOWN');
        this.databaseMessage = String(response['message'] || 'Estado desconocido');
        this.usersInDatabase = Number(response['usersInDatabase']) || 0;
      },
      error: () => {
        this.databaseStatus = 'ERROR';
        this.databaseMessage = 'No se puede verificar la conexión a la base de datos.';
      },
    });
  }
}
