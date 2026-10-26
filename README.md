# Enterprise HRMS (Human Resource Management System)

> **Phases 1, 2, 3 & 4 Verified Complete** — A comprehensive, multi-role workforce operations, machine learning, and AI SaaS platform inspired by modern enterprise leaders (Workday, BambooHR, Rippling).

---

## 1. System Architecture

- **Backend**: Python FastAPI 0.162, SQLAlchemy 2.0 ORM, Pydantic v2, Alembic migrations.
- **Frontend**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Database**: PostgreSQL / SQLite (via SQLAlchemy connection string; defaults to persistent `sqlite:///./hrms.db` with 37 enterprise tables).
- **Authentication**: JWT Bearer token authentication with PBKDF2/Bcrypt password hashing and role-based endpoint authorization.
- **File Storage**: Local secure vault with permission-enforced access checks for contracts and documents.
- **Machine Learning & AI Service**: Dedicated Python module (`backend/ml_service`) with scikit-learn attrition prediction pipeline, SHA-256 verified model registry, feature drift detector, and TF-IDF RAG semantic search vector store.

---

## 2. Demonstration User Accounts (Role-Based Access)

For local development and demonstration, user accounts are provisioned with the following roles and naming convention. Passwords follow the demo standard `<FirstName>@123` (hashed with bcrypt):

| Display Name | Email | Role | Department | Access Level |
|--------------|-------|------|------------|--------------|
| **Vishal Sharma** | `admin@enterprisehrms.com` | **Super Admin** | Executive Leadership | Full system governance, all departments, security settings |
| **Vishu Soam** | `vishu.soam@enterprisehrms.com` | **HR Manager** | Human Resources | Full workforce directory, onboarding, policies, documents, leave approvals |
| **Yash Sharma** | `yash.sharma@enterprisehrms.com` | **Department Manager** | Software Engineering | Department-isolated access to Engineering employees & approvals |
| **Vishal Maurya** | `vishal.maurya@enterprisehrms.com` | **Recruiter** | Human Resources | Candidate pipelines, job requisitions, interview scorecards |
| **Vishal Bhardwaj** | `vishal.bhardwaj@enterprisehrms.com` | **Payroll Officer** | Finance & Payroll | Fiscal structures, compensation runs, payslips, full & final settlements |
| **Aman** | `aman@enterprisehrms.com` | **Employee** | Software Engineering | Self-service portal, own attendance, leaves, payslips, goals |
| **Vishnu** | `vishnu@enterprisehrms.com` | **Employee** | Software Engineering | Self-service portal, tasks, attendance check-in/out |
| **Yash Bhardwaj** | `yash.bhardwaj@enterprisehrms.com` | **Employee** | Product Management | Self-service portal, timesheets, course enrollments |
| **Rohini** | `rohini@enterprisehrms.com` | **Employee** | Software Engineering | Self-service portal, onboarding workflows |
| **Rachel Green** | `rachel.green@enterprisehrms.com` | **IT Administrator** | Information Technology | Asset register, hardware provisioning, helpdesk resolution |

> [!NOTE]
> Demo passwords use the convention `<FirstName>@123` for local evaluation only. Passwords are never stored in plaintext and are hashed via bcrypt with salt. In production, password resets are strictly enforced.

---

## 3. Quick Start Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node v24)
- npm or pnpm

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
..\venv\Scripts\activate
# Linux/macOS:
source ../venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Seed realistic demonstration database
python -m app.seed_data

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Completed Modules (Phase 1 & Phase 2)

### Phase 1: Core Foundation
1. **Enterprise Design System & RBAC**:
   - Collapsible sidebar with grouped navigation and role-based portal filtering.
   - Global directory search, notifications, light/dark theme toggle, and 1-click Demo Persona Switcher.
   - Strict department-level access control enforced in backend endpoints.
2. **Core HR Management**:
   - Searchable, filterable, and paginated employee directory.
   - Detailed profiles, auto-generated unique IDs (`EMP-XXXX`), lifecycle audit events (`JOINED`, `PROMOTION`, `TRANSFER`, `STATUS_CHANGE`).
   - Interactive hierarchical Organization Chart graph.
3. **Workforce Workflows & Assets**:
   - Onboarding checklists with live completion progress bar.
   - Offboarding exit checklists triggered upon termination/resignation.
   - Asset tracking register (laptops, monitors, security tokens, return tracking).
   - Document Vault with Company Policy Library and secure uploads.
   - Tamper-evident Audit Trail compliance ledger.

### Phase 2: Complete HR Operations
1. **Attendance & Workforce Management**:
   - Daily punch station (Clock In / Clock Out) with duplicate punch rejection and shift state validation.
   - Configurable shifts (Standard Day, Morning, Evening) with grace period and overtime calculations.
   - Attendance punch correction requests with manager approval workflow.
   - Statutory holiday calendar (2026) and weekly billable project timesheets.
2. **Leave Management & Policy Engine**:
   - Configurable leave types (Paid/Privilege, Casual, Sick/Medical, Maternity) with carry-forward rules.
   - Real-time balance allocation, transactional overlap checks, and multi-tier approval workflow.
   - **Interlocking Workflow**: Approved leaves deduct balances and automatically synchronize to Attendance as `ON_LEAVE`.
3. **Payroll & Compensation Engine**:
   - Salary structures (Basic, HRA, Allowances, PF, ESI, Professional Tax, TDS) with decimal-safe calculations.
   - Monthly payroll run processing with automated Loss of Pay (LOP) proration from unauthorized attendance absences.
   - Approved expense reimbursements automatically added to monthly payroll.
   - Formal, printable payslip statement view and Full & Final (F&F) separation settlements.
4. **Recruitment & Applicant Tracking (ATS)**:
   - Job requisitions with headcount quotas, experience requirements, and salary bands.
   - 6-Stage candidate pipeline Kanban (Applied -> Screening -> Interview -> Offer -> Hired -> Rejected).
   - Interview scheduling with scorecard ratings and calendar links.
   - **Interlocking Workflow**: 1-click candidate-to-employee onboarding handover converting hired candidates to full employee profiles with default onboarding checklists.
5. **Performance & Learning Hub**:
   - Active review cycles (mid-year/annual) and 360 appraisal submissions.
   - Goals & OKRs tracker with weightages and real-time interactive progress sliders.
   - Corporate learning course catalog with 1-click enrollment and completion certificates.
   - Peer Kudos recognition wall with badges (Team Player, Innovator, Customer Hero).
6. **Expenses, Helpdesk & Employee Self-Service (ESS)**:
   - Expense reimbursement claims with receipt metadata and manager approval routing.
   - IT & HR Helpdesk ticketing system with priority categorization and agent assignment.
   - Employment verification and salary certificate letter requests.
7. **BI Reports & Analytics**:
   - Real derived workforce reports: Headcount & Attrition, Attendance & Absenteeism, Leave Utilization, Monthly Payroll Trends, and Recruitment Funnel.
   - Department filters and Recharts visual analytics.
   - Live streaming CSV exports for Employee Directory, Attendance Log, and Payroll Ledger.

### Phase 3: Machine Learning & AI Integration
1. **Workforce Attrition Prediction Model**:
   - Supervised classification experiment using synthetic IBM HR Analytics schema (1,470 samples).
   - Zero-rule majority class baseline established at **86.44%**.
   - Selected Champion: `LogisticRegression(class_weight='balanced')` delivering **ROC-AUC: 0.6227**, **CV ROC-AUC: 0.6601**, and **Recall: 52.5%** on positive class (vs Random Forest ROC-AUC 0.5998).
   - Feature attribution engine identifying top turnover drivers (overtime strain, commute, low satisfaction).
   - Strict human-review decision support disclaimer attached to all model outputs.
2. **Versioned Model Registry & MLOps Governance**:
   - Versioned artifact storage in `backend/ml_service/registry/models/{version}/`.
   - Immutable metadata with SHA-256 checksums, holdout evaluation metrics, and approval states (`APPROVED`, `CANDIDATE`, `ARCHIVED`).
   - Verified artifact loading in clean, isolated Python processes.
3. **Operational Monitoring & Baseline Drift**:
   - Real-time tracking of API availability, inference volume, latency histograms, and error rates.
   - Feature distribution comparison comparing live telemetry against baseline training distributions across 17 features.
   - Distinguishes input drift from ground-truth performance degradation.
4. **Controlled Retraining & Rollback Workflows**:
   - Authorized retraining endpoint (`POST /api/ml/retrain`) for Super Admin and HR Manager.
   - Evaluation against champion model, promotion to production (`POST /api/ml/models/{version}/promote`), and 1-click rollback (`POST /api/ml/models/{version}/rollback`).
5. **AI HR Assistant with Retrieval-Augmented Generation (RAG)**:
   - Ingests and chunks 5 approved corporate handbooks: Leave Policy, Attendance Policy, Code of Conduct, Benefits Handbook, Onboarding Guide (21 total chunks).
   - TF-IDF + Cosine similarity vector index providing fast, zero-dependency, local semantic retrieval.
   - Grounded generation with explicit source citations (e.g. `[leave_policy.md (§ 2. Leave Categories and Annual Quotas)]`).
   - Private Employee Record Routing: Queries for personal leave balances, latest payslip net pay, or daily attendance call live DB tables directly—never asking an LLM to invent records.
   - Security Protection: Intercepts prompt injection attacks and blocks unauthorized cross-employee compensation inquiries.

---

## 5. Verification & Testing

### Automated Backend Test Suite
```bash
cd backend
pytest -v
```
**Results: 49 / 49 Tests Passed (100% Pass Rate in 5.50s)**
- 5 Auth & RBAC tests (`test_auth.py`)
- 6 Employee Core & Isolation tests (`test_employees.py`)
- 3 Lifecycle & Asset tests (`test_lifecycle_and_assets.py`)
- 10 Phase 2 Operations & Connected Workflows tests (`test_phase2_operations.py`)
- 12 Phase 3 Machine Learning, AI RAG, Drift & Security tests (`test_phase3_ml_ai.py`)
- 12 Phase 4 & Public Website Security, Registration & Contact tests (`test_phase4_security_audit.py`)

### Frontend Strict Compilation
```bash
cd frontend
npm run build
```
**Results: 2,547 modules compiled with 0 TypeScript or bundling errors in 3.38s.**

---

## 6. Production Deployment

### Option A: Docker Compose (Full Stack Orchestration)
The project includes production container specifications for Backend, Frontend, and PostgreSQL 16:
```bash
# 1. Copy and configure environment variables
cp .env.production.example .env

# 2. Build and launch all services in detached mode
docker-compose up -d --build

# 3. Verify container health status
docker-compose ps
```

### Option B: Local Production Server Execution
```bash
# Backend (Port 8000)
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000

# Frontend (Port 5173 / Port 80)
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 7. Project Roadmap & Delivery Status

- **Phase 1 (Verified Complete)**: Enterprise Foundation, Multi-role Portals, Core HR, Workflows, Documents, Assets, Audit Trail.
- **Phase 2 (Verified Complete)**: Attendance & Time, Leave Engine, Payroll & Payslips, Recruitment & ATS, Performance & OKRs, Expenses & Helpdesk, BI Reports & CSV Exports.
- **Phase 3 (Verified Complete)**: Workforce Attrition Prediction Model, Versioned Model Registry with SHA-256, Operational Drift Monitoring, Controlled Retraining & Rollback, AI HR Assistant with Grounded RAG, and Interactive UI Pages.
- **Phase 4 (Verified Complete)**: Full System QA & Security Audit, 47/47 passing tests, enumeration-safe password recovery, containerized deployment (`Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.env.production.example`), live healthy status verified.
