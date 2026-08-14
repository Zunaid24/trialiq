create table if not exists public.test_run_jobs (
  id uuid primary key default gen_random_uuid(),
  suite text not null check (suite in ('ai','ui','role','scenario','competitor')),
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','COMPLETED','FAILED')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  runner_id text,
  run_id uuid,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.test_run_jobs(id) on delete set null,
  run_key text not null unique,
  suite text not null,
  suite_key text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_ms integer not null default 0,
  status text not null check (status in ('PASS','FAIL')),
  total integer not null default 0,
  passed integer not null default 0,
  failed integer not null default 0,
  skipped integer not null default 0,
  flaky integer not null default 0,
  worker_count integer,
  browser text,
  base_url text,
  git_commit text,
  suite_version text,
  command text,
  raw_console_output text,
  raw_playwright_result jsonb,
  raw_suite_result jsonb,
  ai_review jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.test_runs(id) on delete cascade,
  test_number integer not null,
  test_id text,
  test_name text not null,
  test_file text,
  status text not null check (status in ('PASS','FAIL','SKIP','FLAKY')),
  duration_ms integer not null default 0,
  error_message text,
  error_stack text,
  locator text,
  expected text,
  received text,
  call_log text,
  stdout text,
  stderr text,
  evidence jsonb not null default '{}'::jsonb,
  raw_result jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, test_number)
);

create table if not exists public.test_ai_reviews (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.test_runs(id) on delete cascade,
  test_result_id uuid references public.test_results(id) on delete cascade,
  test_number integer not null,
  score integer,
  verdict text,
  root_cause_layer text check (root_cause_layer in ('AI_OUTPUT','UI','FLOW','TEST','INFRASTRUCTURE','NONE')),
  root_cause_confidence integer,
  is_product_defect boolean,
  strengths jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  review_notes text,
  raw_review jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, test_number)
);

create index if not exists idx_test_run_jobs_status_requested on public.test_run_jobs(status, requested_at);
create index if not exists idx_test_runs_suite_started on public.test_runs(suite_key, started_at desc);
create index if not exists idx_test_results_run_number on public.test_results(run_id, test_number);
create index if not exists idx_test_ai_reviews_run_number on public.test_ai_reviews(run_id, test_number);

alter table public.test_run_jobs enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_results enable row level security;
alter table public.test_ai_reviews enable row level security;

revoke all on public.test_run_jobs from anon, authenticated;
revoke all on public.test_runs from anon, authenticated;
revoke all on public.test_results from anon, authenticated;
revoke all on public.test_ai_reviews from anon, authenticated;

-- The deployed /test.html dashboard uses the public Supabase key. It may
-- queue jobs and read quality-run results, while the local runner keeps the
-- service-role key for privileged claims/writes. No public UPDATE/DELETE is
-- granted on any quality-run table.
grant select, insert on public.test_run_jobs to anon, authenticated;
grant select on public.test_runs to anon, authenticated;
grant select on public.test_results to anon, authenticated;
grant select on public.test_ai_reviews to anon, authenticated;

drop policy if exists "public can read test run jobs" on public.test_run_jobs;
drop policy if exists "public can queue test run jobs" on public.test_run_jobs;
drop policy if exists "public can read test runs" on public.test_runs;
drop policy if exists "public can read test results" on public.test_results;
drop policy if exists "public can read test ai reviews" on public.test_ai_reviews;

create policy "public can read test run jobs"
on public.test_run_jobs
for select
to anon, authenticated
using (true);

create policy "public can queue test run jobs"
on public.test_run_jobs
for insert
to anon, authenticated
with check (
  suite in ('ai', 'ui')
  and status = 'QUEUED'
);

create policy "public can read test runs"
on public.test_runs
for select
to anon, authenticated
using (true);

create policy "public can read test results"
on public.test_results
for select
to anon, authenticated
using (true);

create policy "public can read test ai reviews"
on public.test_ai_reviews
for select
to anon, authenticated
using (true);

create or replace function public.claim_test_run_job(p_runner_id text)
returns public.test_run_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.test_run_jobs;
begin
  update public.test_run_jobs
  set status = 'QUEUED', started_at = null, runner_id = null, error = 'Recovered stale local runner job.'
  where status = 'RUNNING'
    and started_at < now() - interval '30 minutes';

  update public.test_run_jobs
  set status = 'RUNNING', started_at = now(), runner_id = p_runner_id, error = null
  where id = (
    select id
    from public.test_run_jobs
    where status = 'QUEUED'
    order by requested_at asc
    for update skip locked
    limit 1
  )
  returning * into claimed;

  return claimed;
end;
$$;

revoke all on function public.claim_test_run_job(text) from public, anon, authenticated;
grant execute on function public.claim_test_run_job(text) to service_role;
