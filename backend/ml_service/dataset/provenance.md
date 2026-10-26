# Employee Attrition Analytics — Dataset Provenance & Governance

## 1. Provenance and Overview
- **Dataset Identification**: Enterprise Workforce Attrition Analytics Dataset (`HR-ATTRITION-BENCHMARK-v1`)
- **Origin & Schema Basis**: Synthesized based on the standard IBM HR Analytics Employee Attrition & Performance Benchmark schema, enriched with enterprise operational signals.
- **License**: Internal Corporate Analytics Research & Educational Benchmark (Permissive Enterprise Usage).
- **Date of Generation**: 2026-10-26
- **Sample Size**: 1,470 employee records (1,176 training / 294 holdout evaluation).

## 2. Target Label & Class Distribution
- **Target Variable**: `attrition`
  - `0` / `No`: Active employee remaining at enterprise.
  - `1` / `Yes`: Employee departed enterprise (voluntary separation).
- **Class Imbalance**:
  - Negative class (`0`): ~83.9%
  - Positive class (`1`): ~16.1%
- **Majority-Class Baseline Accuracy**: 83.9% (Trivial zero-rule prediction). A valid model must demonstrate strong precision, recall, and ROC-AUC rather than relying on raw accuracy.

## 3. Features & Data Types

| Feature | Type | Range / Values | Description |
|:---|:---:|:---:|:---|
| `age` | Integer | 18 – 65 | Employee age in years |
| `department` | Categorical | `Software Engineering`, `Finance & Payroll`, `Human Resources`, `Sales & Marketing`, `Product Management` | Organizational business unit |
| `job_role` | Categorical | `Software Engineer`, `Director`, `Manager`, `Specialist`, `Executive`, `Sales Representative` | Operational role tier |
| `monthly_income` | Float | $2,000 – $22,000 | Monthly gross base earnings in USD |
| `distance_from_home` | Integer | 1 – 35 | Commute distance in miles |
| `education_level` | Integer | 1 – 5 | 1: High School, 2: Associate, 3: Bachelor, 4: Master, 5: Doctorate |
| `environment_satisfaction` | Integer | 1 – 4 | Survey score (1: Low to 4: Very High) |
| `job_satisfaction` | Integer | 1 – 4 | Survey score (1: Low to 4: Very High) |
| `work_life_balance` | Integer | 1 – 4 | Survey score (1: Bad to 4: Best) |
| `performance_rating` | Integer | 1 – 4 | Most recent review cycle rating |
| `overtime` | Categorical | `Yes`, `No` | Active overtime status |
| `total_working_years` | Integer | 0 – 40 | Total professional career tenure |
| `years_at_company` | Integer | 0 – 35 | Tenure with current enterprise |
| `years_in_current_role` | Integer | 0 – 20 | Tenure in current position |
| `years_since_last_promotion` | Integer | 0 – 15 | Lapsed years since last grade promotion |
| `years_with_curr_manager` | Integer | 0 – 18 | Tenure under current reporting supervisor |
| `num_companies_worked` | Integer | 0 – 10 | Prior distinct employers |
| `stock_option_level` | Integer | 0 – 3 | Equity grant vesting tranche |
| `training_times_last_year` | Integer | 0 – 6 | Professional development courses completed |

## 4. Privacy, PII Exclusion, and Risk Assessment
- **PII Exclusion**: Direct personal identifiers including Employee Names, National ID / SSN, Personal Email, Street Address, and Banking Details are strictly excluded from training data.
- **Data Leakage Prevention**:
  - Features directly derived from exit events (e.g., severance payments, exit survey comments, post-separation insurance transitions) are omitted.
  - Preprocessing scalers (StandardScaler) and categorical encoders (OneHotEncoder) are fitted strictly on training data splits and applied downstream to holdout sets.
- **Bias & Fair Lending / Employment Ethics**:
  - Attrition risk scoring is **strictly decision-support analytics**.
  - Predictions are accompanied by human-review mandates and feature attribution explanations.
  - Automated termination, rating reduction, or promotion denial based on algorithmic outputs is strictly prohibited by enterprise policy.

## 5. Known Limitations
- The model exhibits sensitivity to high overtime and compensation variance.
- Survey variables (`job_satisfaction`, `work_life_balance`) represent self-reported sentiment at discrete points in time and may fluctuate rapidly.
