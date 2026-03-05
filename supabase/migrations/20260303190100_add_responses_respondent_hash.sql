alter table public.responses
  add column if not exists respondent_hash text;

create unique index if not exists ux_responses_event_hash
  on public.responses(event_id, respondent_hash)
  where respondent_hash is not null;

create index if not exists idx_responses_event_submitted
  on public.responses(event_id, submitted_at desc);
