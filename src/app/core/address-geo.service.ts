import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { WarehouseDTO } from './api.models';
import { environment } from '../../environments/environment';

// Estructura comun que consume la UI para autocompletado y geocodificacion.
export interface AddressSuggestion {
  displayName: string;
  street: string;
  streetNumber: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

// Campos que puede devolver Photon en cada resultado de direccion.
interface PhotonProperties {
  name?: string;
  street?: string;
  neighbourhood?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  postcode?: string;
  district?: string;
  country?: string;
}

// Envoltorio de un elemento de Photon con propiedades y coordenadas.
interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: {
    coordinates?: [number, number];
  };
}

// Respuesta principal de Photon.
interface PhotonResponse {
  features?: PhotonFeature[];
}

// Componentes de direccion que devuelve OpenCage.
interface OpenCageComponents {
  road?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  house_number?: string;
}

// Resultado individual de OpenCage.
interface OpenCageResult {
  formatted?: string;
  geometry?: {
    lat?: number;
    lng?: number;
  };
  components?: OpenCageComponents;
}

// Respuesta principal de OpenCage.
interface OpenCageResponse {
  results?: OpenCageResult[];
}

// Campos de direccion de Nominatim.
interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  path?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  province?: string;
  postcode?: string;
  house_number?: string;
  country?: string;
}

// Resultado individual de Nominatim.
interface NominatimItem {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
}

// Resultado final para el calculo del almacen mas cercano.
export interface NearestWarehouseResult {
  warehouse: WarehouseDTO;
  distanceKm: number;
}

@Injectable({ providedIn: 'root' })
export class AddressGeoService {
  // URLs base de proveedores de geocodificacion (ordenadas por prioridad de uso).
  private readonly photonBaseUrl = 'https://photon.komoot.io/api';
  private readonly openCageBaseUrl = 'https://api.opencagedata.com/geocode/v1/json';
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';

  // Limites geograficos para acotar busquedas a Canarias y mejorar precision.
  private readonly canaryBbox = '-18.30,27.50,-13.10,29.60';
  private readonly canaryViewbox = '-18.30,29.60,-13.10,27.50';
  private readonly canaryQuerySuffix = 'Islas Canarias';

  // API key de OpenCage: primero entorno, luego localStorage como fallback en runtime.
  private readonly openCageApiKey =
    environment.openCageApiKey?.trim() ||
    (globalThis.localStorage?.getItem('coplaca_opencage_api_key') ?? '').trim();

  constructor(private readonly apiService: ApiService) {}

  // Busca sugerencias de direccion con estrategia de fallback entre proveedores.
  async searchSuggestions(query: string): Promise<AddressSuggestion[]> {
    // Normaliza el texto y evita consultas demasiado cortas.
    const normalized = query.trim();
    if (normalized.length < 3) {
      return [];
    }

    // Fuerza contexto geografico de Canarias para mejorar coincidencias.
    const canaryQuery = normalized.toLowerCase().includes('canarias')
      ? normalized
      : `${normalized}, ${this.canaryQuerySuffix}`;

    // Detecta si la entrada parece codigo postal para ajustar estrategia.
    const isPostalCodeSearch = this.looksLikePostalCodeQuery(normalized);

    try {
      // 1) Photon suele ser rapido y suficiente para texto libre.
      if (!isPostalCodeSearch) {
        const photon = await this.searchWithPhoton(canaryQuery);
        if (photon.length > 0) {
          return photon;
        }
      }

      // 2) OpenCage como respaldo de mayor cobertura.
      const openCage = await this.searchWithOpenCage(canaryQuery);
      if (openCage.length > 0) {
        return openCage;
      }

      // 3) Nominatim como ultimo fallback (y preferido en postal code).
      if (isPostalCodeSearch) {
        return await this.searchWithNominatim(canaryQuery);
      }

      return await this.searchWithNominatim(canaryQuery);
    } catch {
      return [];
    }
  }

  // Resuelve coordenadas a partir de campos de direccion estructurados.
  async geocodeFromParts(payload: {
    street: string;
    streetNumber: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<{ latitude: number; longitude: number } | null> {
    // Construye una consulta compacta desde campos estructurados de direccion.
    const query = [
      `${payload.street} ${payload.streetNumber}`.trim(),
      payload.city,
      payload.province,
      payload.postalCode,
      'Espana',
    ]
      .filter(Boolean)
      .join(', ');

    // Reutiliza el motor de sugerencias y toma el primer candidato valido.
    const suggestions = await this.searchSuggestions(query);
    if (suggestions.length === 0) {
      return null;
    }

    return {
      latitude: suggestions[0].latitude,
      longitude: suggestions[0].longitude,
    };
  }

  // Resuelve direccion aproximada desde codigo postal.
  async geocodeFromPostalCode(postalCode: string): Promise<AddressSuggestion | null> {
    // Limpia espacios y valida longitud minima esperada de codigo postal.
    const normalizedPostalCode = postalCode.replaceAll(/\s+/g, '').trim();
    if (normalizedPostalCode.length < 5) {
      return null;
    }

    const suggestions = await this.searchSuggestions(
      `${normalizedPostalCode}, ${this.canaryQuerySuffix}, Espana`,
    );

    return suggestions[0] ?? null;
  }

  // Calcula el almacen activo mas cercano usando distancia geodesica.
  async getNearestWarehouse(
    latitude: number,
    longitude: number,
  ): Promise<NearestWarehouseResult | null> {
    try {
      // Obtiene almacenes y descarta inactivos o sin coordenadas utilizables.
      const warehouses = await firstValueFrom(this.apiService.getWarehouses());
      const candidates = warehouses.filter(
        (warehouse) =>
          warehouse.isActive !== false &&
          Number.isFinite(warehouse.latitude) &&
          Number.isFinite(warehouse.longitude),
      );

      if (candidates.length === 0) {
        return null;
      }

      // Inicializa con el primer candidato y calcula la distancia base.
      let nearest = candidates[0];
      let shortestDistance = this.calculateDistanceKm(
        latitude,
        longitude,
        nearest.latitude,
        nearest.longitude,
      );

      // Recorre el resto y conserva el almacen con menor distancia.
      for (const warehouse of candidates.slice(1)) {
        const distance = this.calculateDistanceKm(
          latitude,
          longitude,
          warehouse.latitude,
          warehouse.longitude,
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = warehouse;
        }
      }

      return {
        warehouse: nearest,
        // Redondea para mostrar una distancia legible en UI.
        distanceKm: Number(shortestDistance.toFixed(2)),
      };
    } catch {
      return null;
    }
  }

  private parseSuggestion(feature: PhotonFeature): AddressSuggestion | null {
    // Convierte coordenadas a numeros y descarta resultados incompletos.
    const coordinates = feature.geometry?.coordinates;
    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = feature.properties ?? {};
    // Prioriza calle, luego barrio y por ultimo nombre generico del punto.
    const street =
      address.street ??
      address.neighbourhood ??
      address.name ??
      '';

    // Intenta derivar la ciudad con campos alternativos.
    const city =
      address.city ??
      address.district ??
      '';

    // Construye una etiqueta amigable para mostrar en el autocompletado.
    const displayName = [
      `${street} ${address.housenumber ?? ''}`.trim(),
      city,
      address.state,
      address.postcode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      displayName,
      street: street.trim(),
      streetNumber: (address.housenumber ?? '').trim(),
      city: city.trim(),
      province: (address.state ?? '').trim(),
      postalCode: (address.postcode ?? '').trim(),
      latitude,
      longitude,
    };
  }

  private parseOpenCageSuggestion(result: OpenCageResult): AddressSuggestion | null {
    // Normaliza lat/lng y valida que sean finitas.
    const latitude = Number(result.geometry?.lat);
    const longitude = Number(result.geometry?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = result.components ?? {};
    // Define calle y ciudad con fallback por jerarquia de campos.
    const street =
      address.road ??
      address.neighbourhood ??
      '';

    const city =
      address.city ??
      address.town ??
      address.village ??
      '';

    // Usa formatted si viene completo; si no, arma el texto manualmente.
    const displayName = result.formatted?.trim() || [
      `${street} ${address.house_number ?? ''}`.trim(),
      city,
      address.state,
      address.postcode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      displayName,
      street: street.trim(),
      streetNumber: (address.house_number ?? '').trim(),
      city: city.trim(),
      province: (address.state ?? '').trim(),
      postalCode: (address.postcode ?? '').trim(),
      latitude,
      longitude,
    };
  }

  private parseNominatimSuggestion(item: NominatimItem): AddressSuggestion | null {
    // Nominatim devuelve lat/lon como string; se convierten y validan.
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = item.address ?? {};
    // Nominatim maneja varias claves para via/ciudad segun zona.
    const street =
      address.road ??
      address.pedestrian ??
      address.path ??
      address.neighbourhood ??
      '';

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.county ??
      '';

    // Si no hay display_name, se construye uno consistente con otros proveedores.
    const displayName = item.display_name?.trim() || [
      `${street} ${address.house_number ?? ''}`.trim(),
      city,
      address.state ?? address.province,
      address.postcode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      displayName,
      street: street.trim(),
      streetNumber: (address.house_number ?? '').trim(),
      city: city.trim(),
      province: (address.state ?? address.province ?? '').trim(),
      postalCode: (address.postcode ?? '').trim(),
      latitude,
      longitude,
    };
  }

  private async searchWithPhoton(canaryQuery: string): Promise<AddressSuggestion[]> {
    // Parametros afinados para busqueda corta y localizada en Canarias.
    const params = new URLSearchParams({
      q: canaryQuery,
      lang: 'es',
      bbox: this.canaryBbox,
      limit: '5',
    });

    const response = await fetch(`${this.photonBaseUrl}?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    // Convierte, limpia nulos y descarta sugerencias sin texto visible.
    const payload = (await response.json()) as PhotonResponse;
    return (payload.features ?? [])
      .map((item) => this.parseSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  private async searchWithOpenCage(canaryQuery: string): Promise<AddressSuggestion[]> {
    // Sin API key, se omite este proveedor.
    if (!this.openCageApiKey) {
      return [];
    }

    // Restringe pais y limites para maximizar relevancia local.
    const params = new URLSearchParams({
      q: canaryQuery,
      key: this.openCageApiKey,
      language: 'es',
      countrycode: 'es',
      bounds: this.canaryBbox,
      no_annotations: '1',
      limit: '5',
    });

    const response = await fetch(`${this.openCageBaseUrl}?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    // Convierte resultados al contrato comun de la aplicacion.
    const payload = (await response.json()) as OpenCageResponse;
    return (payload.results ?? [])
      .map((item) => this.parseOpenCageSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  private async searchWithNominatim(canaryQuery: string): Promise<AddressSuggestion[]> {
    // Configura respuesta detallada y acotada al territorio objetivo.
    const params = new URLSearchParams({
      q: canaryQuery,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'es',
      bounded: '1',
      viewbox: this.canaryViewbox,
      limit: '5',
    });

    const response = await fetch(`${this.nominatimBaseUrl}?${params.toString()}`, {
      headers: {
        'Accept-Language': 'es',
      },
    });

    if (!response.ok) {
      return [];
    }

    // Mapea resultados de Nominatim al formato unificado.
    const payload = (await response.json()) as NominatimItem[];
    return payload
      .map((item) => this.parseNominatimSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  // Conversion auxiliar de grados a radianes para la formula Haversine.
  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Detecta consultas cuyo primer bloque es un codigo postal espanol (5 digitos).
  private looksLikePostalCodeQuery(query: string): boolean {
    const firstSegment = query.split(',')[0]?.trim() ?? '';
    return /^\d{5}$/.test(firstSegment.replaceAll(/\s+/g, ''));
  }

  private calculateDistanceKm(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): number {
    // Distancia geodesica aproximada usando Haversine sobre esfera terrestre.
    const earthRadiusKm = 6371;
    const deltaLat = this.toRadians(destinationLat - originLat);
    const deltaLng = this.toRadians(destinationLng - originLng);
    const lat1 = this.toRadians(originLat);
    const lat2 = this.toRadians(destinationLat);

    const sinLat = Math.sin(deltaLat / 2);
    const sinLng = Math.sin(deltaLng / 2);

    const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return earthRadiusKm * c;
  }
}
