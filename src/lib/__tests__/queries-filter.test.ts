import { describe, it, expect } from 'vitest';
import { buildDateAndBranchFilterClause } from '../queries';

describe('SQL Date & Branch Filter Sanitization', () => {
  it('allows safe branch names and normalizes to lowercase', () => {
    const clause = buildDateAndBranchFilterClause({ branch: 'Greenville' });
    expect(clause).toContain("LOWER(branch) = 'greenville'");
  });

  it('strips dangerous injection characters from branch input', () => {
    const maliciousBranch = "Greenville'; DROP TABLE fact_orders; --";
    const clause = buildDateAndBranchFilterClause({ branch: maliciousBranch });
    // Quotes, semicolons, and comment dashes must be completely stripped
    expect(clause).not.toContain("';");
    expect(clause).not.toContain('DROP TABLE');
    expect(clause).toContain("LOWER(branch) = 'greenville drop table fact_orders'");
  });

  it('validates strictly formatted ISO dates and ignores invalid/malformed dates', () => {
    const safeDates = buildDateAndBranchFilterClause({ from: '2026-10-01', to: '2026-10-07' });
    expect(safeDates).toContain("CAST(created_at AS DATE) >= '2026-10-01'");
    expect(safeDates).toContain("CAST(created_at AS DATE) <= '2026-10-07'");

    const maliciousFrom = buildDateAndBranchFilterClause({
      from: "2026-10-01' OR 1=1; --",
      to: '2026-10-07',
    });
    // Malicious 'from' should fail DATE_REGEX and be ignored, while valid 'to' is preserved
    expect(maliciousFrom).not.toContain("OR 1=1");
    expect(maliciousFrom).toContain("CAST(created_at AS DATE) <= '2026-10-07'");
  });

  it('supports standard range keywords', () => {
    const todayClause = buildDateAndBranchFilterClause({ range: 'today' });
    expect(todayClause).toContain('COALESCE(MAX(created_at)');

    const weekClause = buildDateAndBranchFilterClause({ range: '7d' });
    expect(weekClause).toContain("INTERVAL '6 days'");
  });
});
