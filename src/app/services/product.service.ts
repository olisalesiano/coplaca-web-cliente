import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
// Servicio HTTP para consulta de catalogo y busquedas de productos.
export class ProductService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/api/v1/products`;

  constructor(private readonly http: HttpClient) {}

  // Obtiene productos paginados.
  getAllProducts(page = 0, size = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.apiUrl, { params });
  }

  // Lista productos filtrados por categoria.
  getProductsByCategory(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`);
  }

  // Busca productos por texto libre.
  searchProducts(keyword: string): Observable<any> {
    const params = new HttpParams().set('query', keyword);
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  // Obtiene ficha de detalle de un producto.
  getProductDetails(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${productId}`);
  }

  // Lista productos en promocion.
  getProductsOnSale(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/on-sale`);
  }
}
