-- =============================================================================
-- Enterprise AI Recruitment Platform - PostgreSQL Production Schema
-- Engine: PostgreSQL 14+ (Supports JSONB, UUID, & pgvector extensions)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- Optional: CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. TENANCY & ROLE-BASED ACCESS CONTROL (RBAC)
-- -----------------------------------------------------------------------------

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'super_admin', 'org_admin', 'recruiter', 'hiring_manager', 'panelist', 'candidate', 'auditor'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'job:create', 'candidate:view_pii', 'score:override', 'audit:read'
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role_id, organization_id)
);

-- -----------------------------------------------------------------------------
-- 2. CANDIDATE MANAGEMENT & DOCUMENT PARSING
-- -----------------------------------------------------------------------------

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    current_title VARCHAR(150),
    years_experience NUMERIC(4, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, email)
);

CREATE TABLE candidate_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'resume', 'cover_letter', 'portfolio'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    raw_text TEXT,
    parsed_json JSONB,
    parsing_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'parsed', 'failed'
    parsed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    primary_classification VARCHAR(150),
    recommended_roles JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    education_history JSONB DEFAULT '[]'::jsonb,
    work_history JSONB DEFAULT '[]'::jsonb,
    normalized_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. JOB REQUISITIONS & HIRING PIPELINE
-- -----------------------------------------------------------------------------

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hiring_manager_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'draft', 'active', 'paused', 'closed'
    description TEXT NOT NULL,
    min_salary NUMERIC(12, 2),
    max_salary NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    weight NUMERIC(3, 2) NOT NULL DEFAULT 1.0, -- e.g., 1.0 = standard, 2.0 = critical
    min_proficiency NUMERIC(3, 2) DEFAULT 0.7,
    is_required BOOLEAN DEFAULT true
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'applied', -- 'applied', 'screened', 'interviewing', 'offered', 'hired', 'rejected'
    overall_match_score NUMERIC(5, 2),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, candidate_id)
);

CREATE TABLE interview_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    panelist_id UUID REFERENCES users(id),
    round_name VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    feedback_notes TEXT,
    rating NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. EXPLAINABLE AI SCORING & PREDICTION MODELS
-- -----------------------------------------------------------------------------

CREATE TABLE model_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'semantic_matcher', 'retention_predictor', 'salary_estimator'
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES model_registry(id) ON DELETE CASCADE,
    version_tag VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    metrics JSONB NOT NULL, -- e.g., accuracy, f1, bias_metrics
    is_active BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE application_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    model_version_id UUID REFERENCES model_versions(id),
    overall_score NUMERIC(5, 2) NOT NULL,
    explainability_payload JSONB NOT NULL, -- SHAP feature contributions, skill weights
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prediction_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    predicted_interview_grade VARCHAR(10), -- 'A', 'B+', etc.
    success_probability NUMERIC(4, 3),
    retention_risk_category VARCHAR(50), -- 'Low', 'Medium', 'High'
    predicted_min_salary NUMERIC(12, 2),
    predicted_max_salary NUMERIC(12, 2),
    explanation_payload JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skill_gap_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_critical_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    training_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. AUDIT, COMPLIANCE & DECISION GOVERNANCE (APPEND-ONLY)
-- -----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'user:login', 'score:view', 'candidate:screen', 'score:override'
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE score_override_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    overridden_by_id UUID NOT NULL REFERENCES users(id),
    original_score NUMERIC(5, 2) NOT NULL,
    new_score NUMERIC(5, 2) NOT NULL,
    justification_reason TEXT NOT NULL,
    overridden_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fairness_audit_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model_version_id UUID REFERENCES model_versions(id),
    disparate_impact_ratio NUMERIC(4, 3),
    demographic_parity_score NUMERIC(4, 3),
    audit_summary TEXT,
    passed_compliance BOOLEAN DEFAULT true,
    audited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_candidates_org ON candidates(organization_id, email);
CREATE INDEX idx_jobs_org_status ON jobs(organization_id, status);
CREATE INDEX idx_applications_job ON applications(job_id, current_stage);
CREATE INDEX idx_audit_org_actor ON audit_logs(organization_id, actor_id, created_at);
CREATE INDEX idx_scores_app ON application_scores(application_id);
