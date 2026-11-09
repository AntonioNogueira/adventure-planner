import { describe, expect, it } from 'vitest';
import { categoryId, shopLabel, categoryLabel, setTravelContext } from '../places';
import { classify, shopTags, utilityTags, toItem } from '../overpass';
import { mergeSuggestions } from '../suggestions';

describe('place categories', () => {
  it('keeps old saved names working and reads new ones', () => {
    expect(['Accommodations', 'Stay', 'Camp spot'].map(categoryId)).toEqual(['stay', 'stay', 'stay']);
    expect(['Restaurants/Cafes', 'Food', 'Supermarket'].map(categoryId)).toEqual(['food', 'food', 'food']);
    expect(['Bike/Moto Shops', 'Shops & repairs', 'Mechanics'].map(categoryId)).toEqual(['shop', 'shop', 'shop']);
    expect(['Utilities', 'Water point', 'Fuel station'].map(categoryId)).toEqual(['water', 'water', 'water']);
    expect(['Points of Interest', 'Points of interest'].map(categoryId)).toEqual(['sights', 'sights']);
  });
  it('names the shops for the kind of trip', () => {
    expect(shopLabel('BICYCLING')).toBe('Bike shops');
    expect(shopLabel('WALKING')).toBe('Sport shops');
    expect(shopLabel('DRIVING', 'motorcycle_2up')).toBe('Moto shops');
    expect(shopLabel('DRIVING', 'campervan')).toBe('Mechanics');
    setTravelContext('WALKING');
    expect(categoryLabel('shop')).toBe('Sport shops');
    expect(categoryLabel('stay')).toBe('Stay');
  });
  it('looks for the right shops and utilities', () => {
    expect(shopTags('DRIVING', '4x4')).toContain('car_repair');
    expect(shopTags('DRIVING', 'motorcycle')).toEqual(['motorcycle', 'motorcycle_repair']);
    expect(utilityTags('BICYCLING')).toContain('drinking_water');
    expect(utilityTags('DRIVING')).toContain('fuel');
  });
  it('files groceries under food and water points under utilities (named by what they are)', () => {
    expect(classify({ shop: 'supermarket', name: 'Pingo Doce' })).toBe('food');
    expect(classify({ shop: 'bicycle', name: 'Bike Lab' })).toBe('shop');
    expect(classify({ amenity: 'drinking_water' })).toBe('water');
    expect(toItem({ type: 'node', id: 1, lat: 38, lon: -8, tags: { amenity: 'drinking_water' } }, 'water')?.name).toBe('Drinking water');
  });
  it('keeps places you marked and bookings when suggestions refresh, under old or new names', () => {
    const cats = [{ category: 'Accommodations', items: [{ name: 'Old hotel', source: 'places' as const }, { name: 'Camp by the river', source: 'mine' as const, lat: 38, lng: -8 }] }];
    const fresh = [{ category: 'Stay', items: [{ name: 'New hotel', source: 'places' as const }] }];
    expect(mergeSuggestions(cats, fresh)).toEqual([{ category: 'Stay', items: [cats[0].items[1], fresh[0].items[0]] }]);
  });
});
