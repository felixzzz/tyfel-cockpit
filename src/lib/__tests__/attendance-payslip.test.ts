import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeAttendanceSchemaAndSeed,
  getAttendanceCycleReport,
  updateEmployeeAndPayrollAdjustment,
  MASTER_EMPLOYEES,
} from '../attendance';

describe('Attendance Payslip & Half-Day Logic', () => {
  beforeAll(async () => {
    await initializeAttendanceSchemaAndSeed();
  });

  it('verifies MASTER_EMPLOYEES configures Budi with half-day properties', () => {
    const budi = MASTER_EMPLOYEES.find((e) => e.employee_name === 'Budi');
    expect(budi).toBeDefined();
    expect(budi?.has_half_day).toBe(true);
    expect(budi?.half_day_rate).toBe(42500);
    expect(budi?.daily_rate).toBe(85000);
  });

  it('excludes employees with 0 attendance logs from payslips list', async () => {
    // In the October cycle (2026-09-16 to 2026-10-15 or 2026-10-16 to 2026-11-15):
    // Only Aji, Agus, Budi, Fauzi, Icin worked. Former employees (Dewi, Hanifa, Emanuel, Elisah)
    // have 0 attendance records and must be excluded from the payslip list.
    const octReport = await getAttendanceCycleReport({
      periodKey: '2026-09-16_to_2026-10-15',
    });

    const payslipNames = octReport.payslips.map((p) => p.employee.employee_name);
    
    // Check that every employee in payslips has at least 1 raw log
    for (const payslip of octReport.payslips) {
      expect(payslip.raw_logs_count).toBeGreaterThan(0);
    }

    expect(payslipNames).toEqual(
      expect.arrayContaining(['Agus', 'Aji', 'Budi', 'Fauzi', 'Icin'])
    );
    expect(payslipNames).not.toContain('Dewi');
    expect(payslipNames).not.toContain('Hanifa');
    expect(payslipNames).not.toContain('Emanuel');
    expect(payslipNames).not.toContain('Elisah');
  });

  it('computes half-day shifts for Budi and includes them in grand total and net pay', async () => {
    const periodKey = '2026-08-16_to_2026-09-15';
    const report = await getAttendanceCycleReport({ periodKey });

    const budiPayslip = report.payslips.find(
      (p) => p.employee.employee_name === 'Budi'
    );

    if (budiPayslip) {
      expect(budiPayslip.has_half_day).toBe(true);
      expect(budiPayslip.effective_half_day_rate).toBe(42500);
      expect(budiPayslip.half_day_unit).toBe(42500);

      // Verify that total shifts = daily_qty + half_day_qty
      expect(budiPayslip.daily_qty + budiPayslip.half_day_qty).toBe(
        budiPayslip.raw_logs_count
      );

      // Verify half_day_total calculation
      expect(budiPayslip.half_day_total).toBe(
        budiPayslip.half_day_qty * budiPayslip.half_day_unit
      );

      // Verify grand total formula
      const expectedGrandTotal =
        budiPayslip.basic_total +
        budiPayslip.daily_total +
        budiPayslip.half_day_total +
        budiPayslip.late_total +
        budiPayslip.bonus_tidak_telat_total +
        budiPayslip.custom_total;

      expect(budiPayslip.grand_total).toBe(expectedGrandTotal);
      expect(budiPayslip.net_take_home_pay).toBe(
        expectedGrandTotal + budiPayslip.kasbon_total
      );
    }
  });

  it('allows overriding half-day count and rate in payroll period adjustments', async () => {
    const periodKey = '2026-08-16_to_2026-09-15';

    // Apply an override for Budi
    await updateEmployeeAndPayrollAdjustment({
      employee_name: 'Budi',
      period_key: periodKey,
      half_day_count_override: 8,
      half_day_rate_override: 50000,
    });

    const report = await getAttendanceCycleReport({ periodKey });
    const budi = report.payslips.find(
      (p) => p.employee.employee_name === 'Budi'
    );

    expect(budi).toBeDefined();
    expect(budi?.half_day_qty).toBe(8);
    expect(budi?.half_day_unit).toBe(50000);
    expect(budi?.half_day_total).toBe(400000);
    expect(budi?.half_day_is_overridden).toBe(true);
    expect(budi?.half_day_rate_is_overridden).toBe(true);

    // Reset override back to null
    await updateEmployeeAndPayrollAdjustment({
      employee_name: 'Budi',
      period_key: periodKey,
      half_day_count_override: null,
      half_day_rate_override: null,
    });

    const reportReset = await getAttendanceCycleReport({ periodKey });
    const budiReset = reportReset.payslips.find(
      (p) => p.employee.employee_name === 'Budi'
    );
    expect(budiReset?.half_day_is_overridden).toBe(false);
    expect(budiReset?.half_day_rate_is_overridden).toBe(false);
    expect(budiReset?.half_day_unit).toBe(42500);
  });
});
