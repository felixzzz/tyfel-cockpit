import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getAttendanceCycleReport,
  updateEmployeeAndPayrollAdjustment,
  updatePayrollPaymentStatus,
} from '@/lib/attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodKey = searchParams.get('period') || undefined;

    const report = await getAttendanceCycleReport({ periodKey });
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'set_payment_status') {
      if (!body.period_key) {
        return NextResponse.json(
          { success: false, error: 'period_key is required' },
          { status: 400 }
        );
      }

      await updatePayrollPaymentStatus({
        period_key: String(body.period_key),
        employee_name: body.employee_name
          ? String(body.employee_name)
          : undefined,
        employee_names: Array.isArray(body.employee_names)
          ? body.employee_names.map(String)
          : undefined,
        is_paid: Boolean(body.is_paid),
        payment_note: body.payment_note ? String(body.payment_note) : '',
      });

      revalidatePath('/attendance');
      revalidatePath('/');

      const report = await getAttendanceCycleReport({
        periodKey: String(body.period_key),
      });

      return NextResponse.json({ success: true, report });
    }

    if (!body.employee_name || !body.period_key) {
      return NextResponse.json(
        { success: false, error: 'employee_name and period_key are required' },
        { status: 400 }
      );
    }

    const parseOptionalNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    };

    await updateEmployeeAndPayrollAdjustment({
      employee_name: String(body.employee_name),
      period_key: String(body.period_key),
      reset_period: Boolean(body.reset_period || body.type === 'reset_period'),
      update_master_defaults: Boolean(body.update_master_defaults),
      full_name: body.full_name,
      role: body.role,
      join_date_label: body.join_date_label,
      shift_start_override:
        body.shift_start_override !== undefined
          ? String(body.shift_start_override)
          : null,
      basic_salary_override: parseOptionalNum(body.basic_salary_override),
      daily_rate_override: parseOptionalNum(body.daily_rate_override),
      late_penalty_override: parseOptionalNum(body.late_penalty_override),
      no_late_bonus_override: parseOptionalNum(body.no_late_bonus_override),
      daily_count_override: parseOptionalNum(body.daily_count_override),
      late_count_override: parseOptionalNum(body.late_count_override),
      bonus_qty_override: parseOptionalNum(body.bonus_qty_override),
      custom_desc: body.custom_desc ?? '',
      custom_qty: body.custom_qty !== undefined ? Number(body.custom_qty) : 0,
      custom_unit_value:
        body.custom_unit_value !== undefined
          ? Number(body.custom_unit_value)
          : 0,
      kasbon_qty: body.kasbon_qty !== undefined ? Number(body.kasbon_qty) : 0,
      kasbon_unit_value:
        body.kasbon_unit_value !== undefined
          ? Number(body.kasbon_unit_value)
          : 0,
      notes: body.notes ?? '',
      is_paid: typeof body.is_paid === 'boolean' ? body.is_paid : undefined,
    });

    revalidatePath('/attendance');
    revalidatePath('/');

    const report = await getAttendanceCycleReport({
      periodKey: String(body.period_key),
    });

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
