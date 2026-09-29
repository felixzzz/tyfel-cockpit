import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getCustomerPortalData,
  updateCateringSlot,
  type MealSlot,
} from '@/lib/catering';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;
    const portalData = await getCustomerPortalData(customerId);
    if (!portalData) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, portalData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;
    const body = await request.json();
    const action = String(body.action || 'skip');
    const delivery_date = String(body.delivery_date);
    const meal_slot = String(body.meal_slot) as MealSlot;

    if (!delivery_date || !meal_slot) {
      return NextResponse.json(
        { success: false, error: 'delivery_date and meal_slot are required' },
        { status: 400 }
      );
    }

    if (action === 'skip') {
      const result = await updateCateringSlot({
        customer_id: customerId,
        delivery_date,
        meal_slot,
        action: 'skip',
        menu_note: 'Self-service skip via Portal (OFF)',
        auto_rollover: true,
      });

      revalidatePath(`/catering/portal/${customerId}`);
      revalidatePath('/catering');

      const portalData = await getCustomerPortalData(customerId);
      return NextResponse.json({
        success: true,
        action: 'skip',
        rolledOverToDate: result.rolledOverToDate,
        portalData,
      });
    }

    if (action === 'swap_slot') {
      await updateCateringSlot({
        customer_id: customerId,
        delivery_date,
        meal_slot,
        action: 'swap_slot',
        menu_note: 'Self-service swapped slot via Portal',
      });

      revalidatePath(`/catering/portal/${customerId}`);
      revalidatePath('/catering');

      const portalData = await getCustomerPortalData(customerId);
      return NextResponse.json({
        success: true,
        action: 'swap_slot',
        portalData,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid portal action: ${action}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
