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
