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

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
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
}
