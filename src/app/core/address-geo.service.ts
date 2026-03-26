import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { WarehouseDTO } from './api.models';
import { environment } from '../../environments/environment';

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

interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

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

interface OpenCageResult {
  formatted?: string;
  geometry?: {
    lat?: number;
    lng?: number;
  };
  components?: OpenCageComponents;
}

interface OpenCageResponse {
  results?: OpenCageResult[];
}

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

interface NominatimItem {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
}

export interface NearestWarehouseResult {
  warehouse: WarehouseDTO;
  distanceKm: number;
}

@Injectable({ providedIn: 'root' })
export class AddressGeoService {
  private readonly photonBaseUrl = 'https://photon.komoot.io/api';
  private readonly openCageBaseUrl = 'https://api.opencagedata.com/geocode/v1/json';
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly canaryBbox = '-18.30,27.50,-13.10,29.60';
  private readonly canaryViewbox = '-18.30,29.60,-13.10,27.50';
  private readonly canaryQuerySuffix = 'Islas Canarias';
  private readonly openCageApiKey =
    environment.openCageApiKey?.trim() ||
    (globalThis.localStorage?.getItem('coplaca_opencage_api_key') ?? '').trim();

  constructor(private readonly apiService: ApiService) {}

  async searchSuggestions(query: string): Promise<AddressSuggestion[]> {
    const normalized = query.trim();
    if (normalized.length < 3) {
      return [];
    }

    const canaryQuery = normalized.toLowerCase().includes('canarias')
      ? normalized
      : `${normalized}, ${this.canaryQuerySuffix}`;
    const isPostalCodeSearch = this.looksLikePostalCodeQuery(normalized);

    try {
      if (!isPostalCodeSearch) {
        const photon = await this.searchWithPhoton(canaryQuery);
        if (photon.length > 0) {
          return photon;
        }
      }

      const openCage = await this.searchWithOpenCage(canaryQuery);
      if (openCage.length > 0) {
        return openCage;
      }

      if (isPostalCodeSearch) {
        return await this.searchWithNominatim(canaryQuery);
      }

      return await this.searchWithNominatim(canaryQuery);
    } catch {
      return [];
    }
  }

  async geocodeFromParts(payload: {
    street: string;
    streetNumber: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<{ latitude: number; longitude: number } | null> {
    const query = [
      `${payload.street} ${payload.streetNumber}`.trim(),
      payload.city,
      payload.province,
      payload.postalCode,
      'Espana',
    ]
      .filter(Boolean)
      .join(', ');

    const suggestions = await this.searchSuggestions(query);
    if (suggestions.length === 0) {
      return null;
    }

    return {
      latitude: suggestions[0].latitude,
      longitude: suggestions[0].longitude,
    };
  }

  async geocodeFromPostalCode(postalCode: string): Promise<AddressSuggestion | null> {
    const normalizedPostalCode = postalCode.replaceAll(/\s+/g, '').trim();
    if (normalizedPostalCode.length < 5) {
      return null;
    }

    const suggestions = await this.searchSuggestions(
      `${normalizedPostalCode}, ${this.canaryQuerySuffix}, Espana`,
    );

    return suggestions[0] ?? null;
  }

  async getNearestWarehouse(
    latitude: number,
    longitude: number,
  ): Promise<NearestWarehouseResult | null> {
    try {
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

      let nearest = candidates[0];
      let shortestDistance = this.calculateDistanceKm(
        latitude,
        longitude,
        nearest.latitude,
        nearest.longitude,
      );

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
        distanceKm: Number(shortestDistance.toFixed(2)),
      };
    } catch {
      return null;
    }
  }

  private parseSuggestion(feature: PhotonFeature): AddressSuggestion | null {
    const coordinates = feature.geometry?.coordinates;
    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = feature.properties ?? {};
    const street =
      address.street ??
      address.neighbourhood ??
      address.name ??
      '';

    const city =
      address.city ??
      address.district ??
      '';

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
    const latitude = Number(result.geometry?.lat);
    const longitude = Number(result.geometry?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = result.components ?? {};
    const street =
      address.road ??
      address.neighbourhood ??
      '';

    const city =
      address.city ??
      address.town ??
      address.village ??
      '';

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
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const address = item.address ?? {};
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

    const payload = (await response.json()) as PhotonResponse;
    return (payload.features ?? [])
      .map((item) => this.parseSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  private async searchWithOpenCage(canaryQuery: string): Promise<AddressSuggestion[]> {
    if (!this.openCageApiKey) {
      return [];
    }

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

    const payload = (await response.json()) as OpenCageResponse;
    return (payload.results ?? [])
      .map((item) => this.parseOpenCageSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  private async searchWithNominatim(canaryQuery: string): Promise<AddressSuggestion[]> {
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

    const payload = (await response.json()) as NominatimItem[];
    return payload
      .map((item) => this.parseNominatimSuggestion(item))
      .filter((value): value is AddressSuggestion => value !== null)
      .filter((value) => value.displayName.length > 0);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

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
