-- Migration SQL for Supabase
-- Based on Prisma schema. Note: Supabase 'auth.users' handles authentication.
-- These tables should be in the 'public' schema.

-- 1. ENUMS (Custom enums in Postgres)
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'TUTOR', 'AGENCY', 'ADMIN');
CREATE TYPE "LessonRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "JobPostStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "JobPayType" AS ENUM ('HOURLY', 'MONTHLY', 'FIXED');
CREATE TYPE "GenderPreference" AS ENUM ('ANY', 'MALE', 'FEMALE');
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'DECLINED');
CREATE TYPE "ContractStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentProvider" AS ENUM ('CHAPA', 'TELEBIRR');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "LedgerEntryType" AS ENUM ('CLIENT_CHARGE', 'ESCROW_DEPOSIT', 'PLATFORM_FEE', 'TUTOR_PAYABLE', 'TUTOR_PAYOUT', 'REFUND');
CREATE TYPE "ContractMilestoneStatus" AS ENUM ('DRAFT', 'FUNDED', 'RELEASED', 'CANCELLED');

-- 2. TABLES

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role "UserRole" DEFAULT 'STUDENT',
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutor Profiles
CREATE TABLE public.tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  subjects TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL,
  languages TEXT[] DEFAULT '{}',
  location TEXT,
  rating FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Posts
CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  location TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  budget DECIMAL,
  grade INTEGER,
  session_minutes INTEGER,
  days_per_week INTEGER,
  start_time TEXT,
  end_time TEXT,
  preferred_days TEXT[] DEFAULT '{}',
  pay_type "JobPayType",
  hourly_amount DECIMAL,
  monthly_amount DECIMAL,
  fixed_amount DECIMAL,
  gender_preference "GenderPreference" DEFAULT 'ANY',
  currency TEXT DEFAULT 'ETB',
  status "JobPostStatus" DEFAULT 'OPEN',
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  hired_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  file_url TEXT,
  video_url TEXT,
  status "ProposalStatus" DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_post_id, tutor_id)
);

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  proposal_id UUID UNIQUE NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status "ContractStatus" DEFAULT 'ACTIVE',
  amount DECIMAL,
  currency TEXT DEFAULT 'ETB',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE public.contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status "ContractMilestoneStatus" DEFAULT 'DRAFT',
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider "PaymentProvider" NOT NULL,
  status "PaymentStatus" DEFAULT 'PENDING',
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.contract_milestones(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'ETB',
  provider_reference TEXT UNIQUE,
  checkout_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ledger Entries
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.contract_milestones(id) ON DELETE SET NULL,
  type "LedgerEntryType" NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'ETB',
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson Requests
CREATE TABLE public.lesson_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status "LessonRequestStatus" DEFAULT 'PENDING',
  tutor_response_message TEXT,
  tutor_response_file_url TEXT,
  tutor_response_video_url TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

-- EXAMPLE POLICY: Anyone can view profiles, but only the user can update their own profile.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', (NEW.raw_user_meta_data->>'role')::"UserRole");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
