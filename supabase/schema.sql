-- ==============================================================================
-- 2026 AI 디지털헤리티지 공모전 심사 시스템 (AI Digital Heritage Contest)
-- Supabase PostgreSQL Schema & Security Rules (RLS)
-- ==============================================================================

-- 1. 심사위원 테이블 (judges)
CREATE TABLE IF NOT EXISTS public.judges (
  id TEXT PRIMARY KEY,
  login_id TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  affiliation TEXT,
  title TEXT,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  oath_signed BOOLEAN DEFAULT false,
  assigned_category TEXT DEFAULT 'ALL' CHECK (assigned_category IN ('ALL', 'IMAGE', 'VIDEO')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 심사위원 서약 내역 테이블 (judge_oaths)
CREATE TABLE IF NOT EXISTS public.judge_oaths (
  judge_id TEXT PRIMARY KEY REFERENCES public.judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  signature_data_url TEXT,
  is_agreed BOOLEAN DEFAULT true NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 출품작 테이블 (submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  submission_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('IMAGE', 'VIDEO')),
  submitter_name TEXT NOT NULL,
  participant_category TEXT DEFAULT '일반인' CHECK (participant_category IN ('일반인', '학생(초/중/고)')),
  submitter_affiliation TEXT,
  national_heritage_name TEXT NOT NULL,
  baekje_related TEXT DEFAULT '사용하지 않음' CHECK (baekje_related IN ('사용함', '사용하지 않음')),
  description TEXT,
  ai_tools JSONB DEFAULT '[]'::jsonb,
  post_editing_usage TEXT DEFAULT '사용하지 않음' CHECK (post_editing_usage IN ('사용함', '사용하지 않음')),
  post_editing_details TEXT,
  prompt_summary TEXT,
  full_prompt TEXT,
  process_capture_drive_url TEXT,
  drive_link TEXT NOT NULL,
  preview_image_url TEXT,
  video_duration TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. 심사 평가표 테이블 (evaluations)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_score NUMERIC(5,2) DEFAULT 0 NOT NULL,
  average_score NUMERIC(4,2) DEFAULT 0 NOT NULL,
  comment TEXT DEFAULT '',
  recommend_for_award BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_judge_submission UNIQUE (submission_id, judge_id)
);

-- 5. 출품작 채널 메시지/심사의견 기록 테이블 (channel_messages)
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('JUDGE', 'ADMIN')),
  message TEXT NOT NULL,
  tag TEXT DEFAULT 'NOTE' CHECK (tag IN ('NOTE', 'QUESTION', 'HIGHLIGHT')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. 공모전 기본 설정 및 서약서 텍스트 테이블 (contest_settings)
CREATE TABLE IF NOT EXISTS public.contest_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Supabase Realtime 활성화 (실시간 순위 및 메시지 자동 반영)
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;

-- 8. Row Level Security (RLS) 설정
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_oaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;

-- 공모전 시스템 심사위원/운영위원 읽기/쓰기 정책 허용 (Anon key / Authenticated)
CREATE POLICY "Allow public read for submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update submissions" ON public.submissions FOR ALL USING (true);

CREATE POLICY "Allow public read for evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update evaluations" ON public.evaluations FOR ALL USING (true);

CREATE POLICY "Allow public read for channel_messages" ON public.channel_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert channel_messages" ON public.channel_messages FOR ALL USING (true);

CREATE POLICY "Allow public read for judges" ON public.judges FOR SELECT USING (true);
CREATE POLICY "Allow public update judges" ON public.judges FOR ALL USING (true);

CREATE POLICY "Allow public read for judge_oaths" ON public.judge_oaths FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update judge_oaths" ON public.judge_oaths FOR ALL USING (true);

CREATE POLICY "Allow public read for contest_settings" ON public.contest_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update contest_settings" ON public.contest_settings FOR ALL USING (true);
