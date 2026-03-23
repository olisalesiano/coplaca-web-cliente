import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(page = 0, size = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.apiUrl, { params });
  }

  getProductsByCategory(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`);
  }

  searchProducts(keyword: string): Observable<any> {
    let params = new HttpParams().set('keyword', keyword);
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  getProductDetails(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${productId}`);
  }

  getProductsOnSale(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/on-sale`);
  }
}
