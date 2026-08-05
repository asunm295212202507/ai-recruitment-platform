# Enterprise AI Recruitment Platform (SaaS Product Deliverable)

A production-grade, multi-tenant Enterprise AI Recruitment Platform designed for real-world enterprise hiring operations. The system incorporates explainable AI pipelines, structured candidate matching, candidate alignment ranking leaderboards, predictive metrics (salary bounds, retention risk, interview performance grades), immutable audit logs (NYC Local Law 144 compliant), and Role-Based Access Control (RBAC).

---

## 🏛️ System Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │        Enterprise Web Frontend (SPA)         │
                        │ Multi-Role Workspace: Recruiter, HM, Auditor │
                        └──────────────────────┬───────────────────────┘
                                               │ HTTP / REST API (JWT)
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │            FastAPI REST API Layer            │
                        │    (JWT Auth, RBAC & Multi-Tenant Rules)     │
                        └──────┬───────────────┬───────────────┬───────┘
                               │               │               │
            ┌──────────────────┴─┐    ┌────────┴─────────┐    ┌┴─────────────────┐
            │ Explainable AI     │    │ Predictive       │    │ Audit & Governance│
            │ Matching Engine    │    │ Analytics Engine │    │ Logging Service  │
            └──────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                       │                       │                       │
                       └───────────────────────┼───────────────────────┘
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │       PostgreSQL 15 Production Engine        │
                        │  (JSONB Explainability, Append-Only Logs)    │
                        └──────────────────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

1. **Resume Parsing & Information Extraction**: Ingests resume documents (PDF, DOCX, TXT), extracting normalized candidate skills, experience, and classifications.
2. **Explainable Candidate Matching & Ranking**: SHAP-style feature attribution calculations showing why a candidate scored a specific percentage, with matching vs missing skill gap breakdowns.
3. **AI Predictive Analytics Engine**:
   - **Candidate Success Probability**: Predicts quarterly objective achievement metrics.
   - **Retention Risk Assessment**: Categorizes turnover risk (Low/Med/High).
   - **Interview Grade Expectation**: Predicts candidate performance (A, B+, B-).
   - **Salary Range Recommendation**: Formulates market-rate base ranges based on regional indices.
4. **Audit, Compliance & Governance**:
   - Immutable append-only audit trail logging for all actions (`candidate:screen`, `score:override`).
   - Human-in-the-loop score override workflows requiring written justification.
   - Automated model fairness and disparate impact audits (NYC Local Law 144 compliant).
5. **Role-Based Access Control (RBAC)**: Supports Super Admin, Org Admin, Lead Recruiter, Hiring Manager, Panelist, Candidate, and Compliance Auditor roles.

---

## 🗄️ PostgreSQL Database Schema (`database/schema.sql`)

- **Tenancy & RBAC**: `organizations`, `users`, `roles`, `permissions`, `user_role_assignments`.
- **Hiring Lifecycle**: `jobs`, `job_requirements`, `candidates`, `candidate_documents`, `candidate_profiles`, `applications`, `interview_rounds`.
- **AI & Governance**: `application_scores` (with JSONB explainability), `prediction_outputs`, `skill_gap_reports`, `audit_logs` (append-only), `score_override_logs`, `model_registry`, `fairness_audit_results`.

---

## 📡 REST API Specifications (`/api/v1`)

| Endpoint | Method | Role Allowed | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/jobs/` | `GET`, `POST` | Recruiter, Admin | Manage job requisitions and requirements |
| `/api/v1/jobs/ai-generate-description` | `POST` | Recruiter, Admin | AI Assistant for job description composition |
| `/api/v1/candidates/` | `GET` | Recruiter, HM | View candidate profiles & classifications |
| `/api/v1/candidates/parse-resume` | `POST` | Recruiter | Ingest & parse candidate documents |
| `/api/v1/matching/evaluate` | `POST` | Recruiter, HM | Compute explainable score & predictive metrics |
| `/api/v1/matching/rankings/{job_id}` | `GET` | Recruiter, HM | Candidate alignment ranking leaderboard |
| `/api/v1/audit/logs` | `GET` | Auditor, Admin | Inspect immutable audit logs |
| `/api/v1/audit/score-override` | `POST` | Recruiter, Admin | Record human-in-the-loop score override |
| `/api/v1/audit/fairness-audit` | `GET` | Auditor, Admin | Run disparate impact & bias audit scan |
| `/api/v1/analytics/summary` | `GET` | Recruiter, Admin | Pipeline conversion funnel metrics |

---

## 🛠️ Quickstart & Deployment Instructions

### 1. Run using Docker Compose (Recommended)

```bash
# Build and launch PostgreSQL, Redis, and FastAPI Backend containers
docker-compose up --build -d

# Open API Interactive Documentation in Browser
# http://localhost:8000/docs
```

### 2. Frontend Web Application Access
Open `index.html` directly in your browser or serve via static server:
- Open `file:///C:/Users/magis/.gemini/antigravity/scratch/ai-recruitment-platform/index.html`
- Use the **Active Role** dropdown in the top header bar to switch between *Lead Recruiter*, *Hiring Manager*, *Compliance Reviewer*, and *Org Admin* viewports.
