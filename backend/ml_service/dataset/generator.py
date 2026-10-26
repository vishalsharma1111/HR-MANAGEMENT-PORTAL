import os
import random
import csv
from typing import Tuple, List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DEPARTMENTS = [
    "Software Engineering",
    "Finance & Payroll",
    "Human Resources",
    "Sales & Marketing",
    "Product Management"
]

ROLES_BY_DEPT = {
    "Software Engineering": ["Software Engineer", "Senior Software Engineer", "Tech Lead", "Engineering Director"],
    "Finance & Payroll": ["Payroll Specialist", "Financial Analyst", "Finance Director"],
    "Human Resources": ["HR Specialist", "Recruiter", "HR Manager", "VP of HR"],
    "Sales & Marketing": ["Sales Representative", "Marketing Lead", "Account Executive"],
    "Product Management": ["Product Manager", "UX Designer", "Director of Product"]
}

def generate_attrition_dataset(n_samples: int = 1470, random_seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generate synthetic workforce dataset modeled on the IBM HR Analytics schema.
    Applies realistic probabilistic correlation between workplace strain, compensation,
    overtime, distance, and voluntary attrition.
    """
    rng = random.Random(random_seed)
    records = []

    for i in range(n_samples):
        dept = rng.choice(DEPARTMENTS)
        role = rng.choice(ROLES_BY_DEPT[dept])

        # Career tenure
        age = rng.randint(22, 60)
        max_work_years = max(0, age - 21)
        total_working_years = rng.randint(min(1, max_work_years), max_work_years) if max_work_years > 0 else 0
        years_at_company = rng.randint(0, min(total_working_years, 20))
        years_in_current_role = rng.randint(0, min(years_at_company, 10))
        years_since_last_promotion = rng.randint(0, min(years_in_current_role, 8))
        years_with_curr_manager = rng.randint(0, min(years_in_current_role, 8))

        # Commute & education
        distance_from_home = rng.randint(1, 35)
        education_level = rng.choices([1, 2, 3, 4, 5], weights=[0.1, 0.2, 0.45, 0.2, 0.05])[0]

        # Survey satisfaction (1 to 4)
        job_satisfaction = rng.choices([1, 2, 3, 4], weights=[0.15, 0.25, 0.35, 0.25])[0]
        environment_satisfaction = rng.choices([1, 2, 3, 4], weights=[0.15, 0.25, 0.35, 0.25])[0]
        work_life_balance = rng.choices([1, 2, 3, 4], weights=[0.1, 0.25, 0.45, 0.2])[0]
        performance_rating = rng.choices([3, 4], weights=[0.85, 0.15])[0]

        # Operational attributes
        overtime = rng.choices(["Yes", "No"], weights=[0.28, 0.72])[0]
        num_companies_worked = rng.randint(0, min(8, total_working_years // 2 + 1))
        stock_option_level = rng.choices([0, 1, 2, 3], weights=[0.4, 0.4, 0.15, 0.05])[0]
        training_times_last_year = rng.randint(0, 6)

        # Base compensation scales with role level and tenure
        base_by_tier = {
            "Director": 16000.0,
            "VP": 18000.0,
            "Manager": 11000.0,
            "Lead": 9500.0,
            "Senior": 8000.0
        }
        tier_base = 5000.0
        for title_key, amt in base_by_tier.items():
            if title_key in role:
                tier_base = amt
                break

        monthly_income = round(tier_base + (total_working_years * 250.0) + rng.uniform(-1000.0, 1500.0), 2)
        monthly_income = max(2500.0, monthly_income)

        # Probabilistic attrition model based on well-established empirical factors:
        # Base log-odds (-2.2 gives roughly ~16% base positive rate)
        logit = -2.4

        if overtime == "Yes":
            logit += 1.15
        if job_satisfaction == 1:
            logit += 0.85
        elif job_satisfaction == 4:
            logit -= 0.65

        if work_life_balance == 1:
            logit += 0.75
        elif work_life_balance == 4:
            logit -= 0.45

        if environment_satisfaction == 1:
            logit += 0.50

        if distance_from_home > 20:
            logit += 0.45

        if monthly_income < 4000.0:
            logit += 0.60
        elif monthly_income > 12000.0:
            logit -= 0.70

        if years_since_last_promotion >= 5:
            logit += 0.40

        if stock_option_level == 0:
            logit += 0.35
        elif stock_option_level >= 2:
            logit -= 0.45

        # Sigmoid probability
        prob = 1.0 / (1.0 + (2.718281828459045 ** (-logit)))
        attrition = 1 if rng.random() < prob else 0

        records.append({
            "age": age,
            "department": dept,
            "job_role": role,
            "monthly_income": monthly_income,
            "distance_from_home": distance_from_home,
            "education_level": education_level,
            "environment_satisfaction": environment_satisfaction,
            "job_satisfaction": job_satisfaction,
            "work_life_balance": work_life_balance,
            "performance_rating": performance_rating,
            "overtime": overtime,
            "total_working_years": total_working_years,
            "years_at_company": years_at_company,
            "years_in_current_role": years_in_current_role,
            "years_since_last_promotion": years_since_last_promotion,
            "years_with_curr_manager": years_with_curr_manager,
            "num_companies_worked": num_companies_worked,
            "stock_option_level": stock_option_level,
            "training_times_last_year": training_times_last_year,
            "attrition": attrition
        })

    return records

def save_splits(train_ratio: float = 0.8, random_seed: int = 42) -> Tuple[str, str]:
    """Generates dataset and writes stratified train and test CSV files."""
    records = generate_attrition_dataset(1470, random_seed)

    # Stratified split on attrition label
    positives = [r for r in records if r["attrition"] == 1]
    negatives = [r for r in records if r["attrition"] == 0]

    rng = random.Random(random_seed)
    rng.shuffle(positives)
    rng.shuffle(negatives)

    train_pos_len = int(len(positives) * train_ratio)
    train_neg_len = int(len(negatives) * train_ratio)

    train_records = positives[:train_pos_len] + negatives[:train_neg_len]
    test_records = positives[train_pos_len:] + negatives[train_neg_len:]

    rng.shuffle(train_records)
    rng.shuffle(test_records)

    fieldnames = list(records[0].keys())

    train_path = os.path.join(DATA_DIR, "hr_attrition_train.csv")
    test_path = os.path.join(DATA_DIR, "hr_attrition_test.csv")

    with open(train_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(train_records)

    with open(test_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(test_records)

    print(f"Generated {len(train_records)} train records -> {train_path}")
    print(f"Generated {len(test_records)} test records -> {test_path}")
    return train_path, test_path

if __name__ == "__main__":
    save_splits()
