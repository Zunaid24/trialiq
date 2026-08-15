alter table public.test_run_jobs drop constraint if exists test_run_jobs_status_check;

alter table public.test_run_jobs
  add constraint test_run_jobs_status_check
  check (status in ('QUEUED','RUNNING','CANCEL_REQUESTED','COMPLETED','FAILED','CANCELLED'));

create index if not exists idx_test_run_jobs_active_status_requested
  on public.test_run_jobs(status, requested_at)
  where status in ('QUEUED','RUNNING','CANCEL_REQUESTED');
