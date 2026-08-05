-- =============================================================================
-- Enterprise AI Recruitment Platform - Initial Database Seed Data
-- =============================================================================

-- 1. Default Roles
INSERT INTO roles (id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'super_admin', 'Super Admin', 'Full system platform administration'),
('00000000-0000-0000-0000-000000000002', 'org_admin', 'Organization Admin', 'Enterprise tenant administrator'),
('00000000-0000-0000-0000-000000000003', 'recruiter', 'Lead Recruiter', 'Manages candidate pipelines and job requisitions'),
('00000000-0000-0000-0000-000000000004', 'hiring_manager', 'Hiring Manager', 'Reviews candidates, sets job specifications, and approves offers'),
('00000000-0000-0000-0000-000000000005', 'panelist', 'Interview Panelist', 'Conducts candidate interviews and submits evaluations'),
('00000000-0000-0000-0000-000000000006', 'candidate', 'Candidate', 'Applicant portal access'),
('00000000-0000-0000-0000-000000000007', 'auditor', 'Compliance Auditor', 'Inspects AI decision audit logs and fairness metrics');

-- 2. Default Permissions
INSERT INTO permissions (code, module, description) VALUES
('job:create', 'jobs', 'Create new job requisitions'),
('job:publish', 'jobs', 'Publish jobs to external boards'),
('candidate:view', 'candidates', 'View candidate profile data'),
('candidate:view_pii', 'candidates', 'View unmasked candidate PII'),
('score:override', 'ai_scoring', 'Override AI calculated candidate match scores'),
('audit:read', 'governance', 'Read immutable system audit logs');

-- 3. Default Enterprise Tenant & User
INSERT INTO organizations (id, name, domain, subscription_plan) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Enterprise Corp', 'acme-corp.com', 'enterprise');

INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@acme-corp.com', '$2b$12$KIXv9c7G9M28vJkL8xU.me4xGkH3V6/9s3cZ5z.V5n1A2B3C4D5E6', 'Sarah', 'Jenkins');

INSERT INTO user_role_assignments (user_id, role_id, organization_id) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111');

-- 4. Default AI Model Version
INSERT INTO model_registry (id, model_name, model_type, status) VALUES
('33333333-3333-3333-3333-333333333333', 'TalentAI Explainable Matcher', 'semantic_matcher', 'active');

INSERT INTO model_versions (id, model_id, version_tag, parameters, metrics, is_active) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'v3.5.2-prod', 
 '{"embedding_dim": 768, "similarity_metric": "cosine", "weight_skill_overlap": 0.45, "weight_experience": 0.35, "weight_education": 0.20}'::jsonb,
 '{"accuracy": 0.94, "f1_score": 0.92, "disparate_impact_ratio": 0.98}'::jsonb, 
 true);
