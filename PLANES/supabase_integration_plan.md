# Supabase Integration Plan – Insightful Feedback

Migrate the application from mock data to a real production environment using Supabase (PostgreSQL + Auth).

## User Review Required

> [!IMPORTANT]
> This plan proposes a relational schema that mimics your current TypeScript types but adds production-grade constraints and PostgREST compatibility.

> [!WARNING]
> Switching to Supabase will require updating all data-fetching logic in the frontend to use the Supabase client instead of local mock files.

## Proposed Changes

### Database Schema (Supabase/PostgreSQL)

I recommend the following table structure to handle multiple roles, dynamic surveys, and scalable responses.

#### Enums
- `app_role`: `estudiante`, `profesor`, `admin`, `coordinador`, `director`
- `question_type`: `likert`, `open`, `multiple_choice`
- `question_category`: `pedagogia`, `contenido`, `evaluacion`, `comunicacion`, `general`
- `event_frequency`: `per_class`, `weekly`, `biweekly`, `monthly`, `manual`
- `event_status`: `scheduled`, `active`, `expired`, `cancelled`

#### Tables

| Table | Description |
| :--- | :--- |
| **profiles** | Stores user identity, extending Supabase `auth.users`. Includes `active_role` and `department_id`. |
| **user_roles** | Intersection table for users who have multiple roles (e.g., a Professor who is also an Admin). |
| **departments** | University departments/faculties. |
| **courses** | Academic courses, linked to a Professor and a Department. |
| **questions** | The Question Bank. Supports types, categories, and custom options (JSONB). |
| **survey_configs** | Defines a survey template for a course. Links to fixed questions and a pool of random questions. |
| **survey_fixed_questions** | Join table for specific questions that *always* appear in a survey. |
| **survey_random_questions** | Join table for the pool of questions from which `random_count` are picked. |
| **class_events** | Actual instances of a class session where a QR is generated and responses are collected. |
| **responses** | Student answers. Stored as JSONB for flexibility across different question formats. |

### SQL Schema (SQL Editor)

```sql
-- Enums
CREATE TYPE app_role AS ENUM ('estudiante', 'profesor', 'admin', 'coordinador', 'director');
CREATE TYPE question_type AS ENUM ('likert', 'open', 'multiple_choice');
CREATE TYPE question_category AS ENUM ('pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general');
CREATE TYPE event_frequency AS ENUM ('per_class', 'weekly', 'biweekly', 'monthly', 'manual');
CREATE TYPE event_status AS ENUM ('scheduled', 'active', 'expired', 'cancelled');

-- Tables
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  coordinator_id UUID -- fk to profiles later
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  active_role app_role DEFAULT 'estudiante',
  department_id UUID REFERENCES departments(id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id)
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  professor_id UUID REFERENCES professors(id),
  semester TEXT NOT NULL
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type question_type NOT NULL,
  category question_category NOT NULL,
  options JSONB, -- For multiple choice
  likert_scale INT DEFAULT 5,
  required BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  name TEXT NOT NULL,
  random_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE survey_fixed_questions (
  survey_config_id UUID REFERENCES survey_configs(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  PRIMARY KEY (survey_config_id, question_id)
);

CREATE TABLE survey_random_questions (
  survey_config_id UUID REFERENCES survey_configs(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  PRIMARY KEY (survey_config_id, question_id)
);

CREATE TABLE class_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  survey_config_id UUID REFERENCES survey_configs(id),
  qr_code TEXT UNIQUE NOT NULL,
  status event_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES class_events(id),
  student_id UUID REFERENCES profiles(id),
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Implementation Strategy

1.  **Supabase Project Setup**: Create the project and run the SQL migration (schema defined below).
2.  **Auth Integration**: Replace the current `AuthContext` with `supabase.auth`.
3.  **Data Layer Abstraction**:
    *   Create a `lib/supabase.ts` client.
    *   Create service hooks (e.g., `useQuestions`, `useSurveys`) that fetch from Supabase.
4.  **RLS (Row Level Security)**:
    *   `estudiante` can only read active events and insert their own responses.
    *   `profesor` can see analytics for their own courses.
    *   `admin` has full access.

## Verification Plan

### Manual Verification
1.  **Schema Validation**: Run the SQL script in Supabase SQL Editor and verify all tables and relationships appear correctly.
2.  **Auth Flow**: Test registration and login, ensuring the `profiles` table is automatically populated via a Trigger.
3.  **Survey Flow**: Create a `survey_config`, generate a `class_event`, and submit a response as a student.
