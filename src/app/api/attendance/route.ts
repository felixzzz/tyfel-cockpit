import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getAttendanceCycleReport,
  updateEmployeeAndPayrollAdjustment,
} from '@/lib/attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodKey = searchParams.get('period') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const report = await getAttendanceCycleReport({ periodKey, from, to });
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.employee_name || !body.period_key) {
      return NextResponse.json(
        { success: false, error: 'employee_name and period_key are required' },
        { status: 400 }
      );
    }

    await updateEmployeeAndPayrollAdjustment({
      employee_name: String(body.employee_name),
      period_key: String(body.period_key),
      full_name: body.full_name,
      role: body.role,
      join_date_label: body.join_date_label,
      shift_start_time: body.shift_start_time,
      basic_salary:
        body.basic_salary !== undefined ? Number(body.basic_salary) : undefined,
      daily_rate:
        body.daily_rate !== undefined ? Number(body.daily_rate) : undefined,
      late_penalty_rate:
        body.late_penalty_rate !== undefined
          ? Number(body.late_penalty_rate)
          : undefined,
      no_late_bonus:
        body.no_late_bonus !== undefined
          ? Number(body.no_late_bonus)
          : undefined,
      daily_count_override:
        body.daily_count_override === null ||
        body.daily_count_override === '' ||
        body.daily_count_override === undefined
          ? null
          : Number(body.daily_count_override),
      late_count_override:
        body.late_count_override === null ||
        body.late_count_override === '' ||
        body.late_count_override === undefined
          ? null
          : Number(body.late_count_override),
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
