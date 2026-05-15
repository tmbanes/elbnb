import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { UnitAccomodationsDisplayService } from '@/services/unit_accommodation/index';
import { withResolvedAccommodationImages } from '@/lib/actions/housing-actions';


const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

// GET — fetch accommodation/unit tiles (filtered by user role)
export const GET = withRole([...ALL_ROLES], async (req, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'accommodations';
    const accommodationId = searchParams.get('accommodationId');

    let result;
    if (user.role === null) {
      return NextResponse.json({ error: 'User role is required' }, { status: 400 });
    }
    switch (type) {
      case 'accommodations':
        result = await UnitAccomodationsDisplayService.listAccomodations(user.role || undefined);
        break;
      case 'units':
        result = await UnitAccomodationsDisplayService.listUnits('');
        break;
      case 'units-by-accommodation':
        if (!accommodationId) {
          return NextResponse.json(
            { error: 'accommodationId is required for units-by-accommodation' },
            { status: 400 }
          );
        }
        result = await UnitAccomodationsDisplayService.listUnitsForAccomodation(accommodationId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: accommodations, units, or units-by-accommodation' },
          { status: 400 }
        );
    }

    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error || 'No data found' }, { status: 400 });
    }

    let data = result.data;
    if (type === 'accommodations' && Array.isArray(data)) {
      data = await withResolvedAccommodationImages(data);
    }

    if (type !== 'accommodations' && Array.isArray(data)) {
      data = data.map((unit: any) => ({
        ...unit,
        vacant_slots: unit.max_occupancy - unit.current_occupancy,
      }));
    }


    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});
