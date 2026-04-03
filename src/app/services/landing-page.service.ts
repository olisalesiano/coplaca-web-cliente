import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
// Servicio de contenido para la landing publica.
export class LandingPageService {
  private readonly apiUrl = `${environment.apiUrl}/landing`;

  constructor(private readonly http: HttpClient) {}

  // Obtiene contenido general de la landing.
  getLandingPage(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Recupera bloque de productos estacionales destacados.
  getSeasonalProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seasonal`);
  }

  // Recupera recomendaciones para portada.
  getRecommendations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recommendations`);
  }
}
