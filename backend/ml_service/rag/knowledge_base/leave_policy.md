# Enterprise Leave and Time-Off Policy

## 1. Overview and Purpose
This policy sets forth the standard leave entitlements, eligibility rules, application timelines, accrual methods, and manager approval guidelines for all regular full-time and part-time enterprise employees.

## 2. Leave Categories and Annual Quotas
The enterprise provides the following standard leave categories annually:
- **Earned / Paid Leave (PL)**: 20 days per calendar year. Accrues pro-rata monthly at 1.66 days per completed month of active service.
- **Casual Leave (CL)**: 12 days per calendar year. Intended for urgent, unexpected personal affairs.
- **Sick / Medical Leave (SL)**: 10 days per calendar year. Designated for personal illness, medical appointments, or recovery.
- **Maternity Leave (ML)**: 180 consecutive calendar days of paid maternity leave for eligible birthing parents.
- **Paternity / Parental Leave (PL-Parental)**: 15 consecutive calendar days of paid parental leave upon birth or adoption.
- **Bereavement Leave**: Up to 5 consecutive paid business days for immediate family members.

## 3. Carry-Forward and Lapsing Rules
- **Earned Leave Carry-Forward**: A maximum of 10 unused Earned Leave days may be carried forward into the subsequent calendar year. Any accumulated balance exceeding 10 days at midnight on December 31 lapses automatically.
- **Casual Leave**: Non-cumulative; does not carry forward and lapses at year-end.
- **Sick Leave**: Up to 5 days can be carried forward; maximum accumulated ceiling is 30 days across all tenure years.
- **Leave Encashment**: Eligible solely upon formal separation (resignation, retirement) as part of the Full and Final (F&F) settlement, capped at a maximum of 30 accrued days calculated at base salary.

## 4. Application and Approval Workflows
- **Planned Absences**: Applications for Earned Leave exceeding 3 consecutive days must be submitted through the HRMS Self-Service portal at least 7 calendar days in advance.
- **Urgent / Sick Absences**: For unexpected illness or emergency, employees must submit a leave request or inform their reporting manager by 10:00 AM on the day of absence. Medical absences exceeding 3 consecutive business days require a signed physician's certificate to be uploaded to the HRMS Document Vault.
- **Approval Hierarchy**:
  1. Department / Reporting Manager: First-line operational approval.
  2. HR Operations: Compliance verification and balance reservation check.
- **Overlap Prevention**: The HRMS enforces strict date overlap validation. Concurrent leave requests across overlapping dates are rejected with HTTP 400 Bad Request.

## 5. Loss of Pay (LOP) and Attendance Synchronization
- Once approved, the HRMS automatically updates the employee's attendance record for the applied dates to status `ON_LEAVE`.
- Unapproved absences or leaves taken in excess of available balances are classified as `ABSENT` with Loss of Pay (LOP). Each LOP day triggers a pro-rated daily wage deduction in the monthly payroll processing.
