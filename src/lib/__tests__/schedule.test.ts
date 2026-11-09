import { describe, expect, it } from 'vitest';
import { addDays, buildSchedule, staysByStop, bookingWarnings, bookingCosts } from '../schedule';
import { InterestCategory } from '../../types';

describe('addDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('buildSchedule', () => {
  it('inserts rest days after their stop and dates every day', () => {
    const days = buildSchedule(3, [0, 1], '2026-11-10');
    expect(days.map(d => `${d.kind}:${d.date}`)).toEqual([
      'ride:2026-11-10', 'ride:2026-11-11', 'rest:2026-11-12', 'ride:2026-11-13',
    ]);
    expect(days[2].stopIndex).toBe(1);
  });

  it('works without a start date', () => {
    expect(buildSchedule(2, [], undefined).every(d => d.date === undefined)).toBe(true);
  });
});

describe('staysByStop', () => {
  it('gives each stop its arrival night and departure morning', () => {
    const stays = staysByStop(buildSchedule(3, [0, 1], '2026-11-10'), 2);
    expect(stays.get('start')).toEqual({ checkIn: '2026-11-09', checkOut: '2026-11-10' });
    expect(stays.get('stop-0')).toEqual({ checkIn: '2026-11-10', checkOut: '2026-11-11' });
    expect(stays.get('stop-1')).toEqual({ checkIn: '2026-11-11', checkOut: '2026-11-13' });
    expect(stays.get('end')).toEqual({ checkIn: '2026-11-13', checkOut: '2026-11-14' });
  });
});

const hotel = (checkInDate: string, price?: number): InterestCategory[] => [{
  category: 'Stay',
  items: [{ name: 'Hotel Test', source: 'reservation', reservation: { fileName: 'b.pdf', fileType: 'application/pdf', checkInDate, price, currency: 'eur' } }],
}];

describe('bookingWarnings', () => {
  const stays = staysByStop(buildSchedule(3, [0, 1], '2026-11-10'), 2);
  it('accepts a booking on any night of the stay', () => {
    expect(bookingWarnings([{ key: 'stop-1', label: 'Huelva', interests: hotel('2026-11-12') }], stays)).toEqual([]);
  });
  it('flags a booking for another night', () => {
    const warnings = bookingWarnings([{ key: 'stop-0', label: 'Matalascañas', interests: hotel('2026-11-12') }], stays);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ key: 'stop-0', categoryIndex: 0, itemIndex: 0 });
    expect(warnings[0].message).toContain('Hotel Test');
  });
});

describe('bookingCosts', () => {
  it('totals bookings per currency', () => {
    expect(bookingCosts([hotel('2026-11-12', 64), hotel('2026-11-13', 18.5)])).toEqual({ EUR: 82.5 });
    expect(bookingCosts([hotel('2026-11-12')])).toEqual({});
  });
});
