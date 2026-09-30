import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getCateringCrmDashboard,
  updateCateringSlot,
  createOrExtendCateringPackage,
  upsertCateringCustomer,
  updatePackagePaymentStatus,
  getCateringExecutiveSummary,
  type MealSlot,
  type CateringProgramCategory,
} from '@/lib/catering';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const date = searchParams.get('date') || undefined;

    const [data, executive_summary] = await Promise.all([
      getCateringCrmDashboard({ month, date }),
      getCateringExecutiveSummary(),
    ]);
    return NextResponse.json({ success: true, data, executive_summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body.type || body.action_type || 'update_slot');
    const month = body.month ? String(body.month) : undefined;
    const date = body.date ? String(body.date) : undefined;

    if (type === 'update_slot') {
      if (!body.customer_id || !body.delivery_date || !body.meal_slot) {
        return NextResponse.json(
          {
            success: false,
            error: 'customer_id, delivery_date, and meal_slot are required',
          },
          { status: 400 }
        );
      }

      const result = await updateCateringSlot({
        customer_id: String(body.customer_id),
        delivery_date: String(body.delivery_date),
        meal_slot: String(body.meal_slot) as MealSlot,
        action: body.slot_action || 'schedule',
        menu_note: body.menu_note ? String(body.menu_note) : '',
        auto_rollover:
          body.auto_rollover !== undefined ? Boolean(body.auto_rollover) : true,
      });

      revalidatePath('/catering');
      revalidatePath('/brands/herbox');

      const data = await getCateringCrmDashboard({
        month: month || String(body.delivery_date).slice(0, 7),
        date: date || String(body.delivery_date),
      });

      return NextResponse.json({
        success: true,
        rolledOverToDate: result.rolledOverToDate,
        data,
      });
    }

    if (type === 'extend_package') {
      if (!body.customer_id || !body.package_name || !body.start_date) {
        return NextResponse.json(
          {
            success: false,
            error: 'customer_id, package_name, and start_date are required',
          },
          { status: 400 }
        );
      }

      const result = await createOrExtendCateringPackage({
        customer_id: String(body.customer_id),
        package_name: String(body.package_name),
        total_boxes: Number(body.total_boxes) || 5,
        start_date: String(body.start_date),
        price_per_box: body.price_per_box
          ? Number(body.price_per_box)
          : undefined,
        default_days: body.default_days ? String(body.default_days) : undefined,
        meal_slot_mode: body.meal_slot_mode || undefined,
        auto_generate_schedule:
          body.auto_generate_schedule !== undefined
            ? Boolean(body.auto_generate_schedule)
            : true,
        sheet_note: body.sheet_note ? String(body.sheet_note) : undefined,
      });

      revalidatePath('/catering');
      revalidatePath('/brands/herbox');

      const data = await getCateringCrmDashboard({
        month: month || String(body.start_date).slice(0, 7),
        date,
      });

      return NextResponse.json({
        success: true,
        package_id: result.package_id,
        generated_slots: result.generated_slots,
        last_date: result.last_date,
        data,
      });
    }

    if (type === 'upsert_customer') {
      if (!body.customer_name || !body.category) {
        return NextResponse.json(
          {
            success: false,
            error: 'customer_name and category are required',
          },
          { status: 400 }
        );
      }

      const result = await upsertCateringCustomer({
        customer_id: body.customer_id ? String(body.customer_id) : undefined,
        customer_name: String(body.customer_name),
        category: String(body.category) as CateringProgramCategory,
        phone: body.phone ? String(body.phone) : '',
        delivery_address: body.delivery_address
          ? String(body.delivery_address)
          : '',
        dietary_notes: body.dietary_notes ? String(body.dietary_notes) : '',
        default_days: body.default_days
          ? String(body.default_days)
          : 'MON,TUE,WED,THU,FRI',
        default_slot: body.default_slot || 'FLEX',
        status: body.status || 'active',
        initial_package_boxes: body.initial_package_boxes
          ? Number(body.initial_package_boxes)
          : undefined,
        initial_start_date: body.initial_start_date
          ? String(body.initial_start_date)
          : undefined,
      });

      revalidatePath('/catering');
      revalidatePath('/brands/herbox');

      const data = await getCateringCrmDashboard({ month, date });
      return NextResponse.json({
        success: true,
        customer_id: result.customer_id,
        data,
      });
    }

    if (type === 'update_payment_status') {
      if (!body.package_id || !body.payment_status) {
        return NextResponse.json(
          {
            success: false,
            error: 'package_id and payment_status are required',
          },
          { status: 400 }
        );
      }

      await updatePackagePaymentStatus({
        package_id: String(body.package_id),
        payment_status: body.payment_status === 'paid' ? 'paid' : 'pending',
      });

      revalidatePath('/catering');
      revalidatePath('/brands/herbox');

      const data = await getCateringCrmDashboard({ month, date });
      return NextResponse.json({
        success: true,
        data,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action type: ${type}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
