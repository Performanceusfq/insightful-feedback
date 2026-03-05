create schema if not exists app_private;

create table if not exists app_private.respondent_hash_keys (
  key_id smallint primary key,
  pepper text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint respondent_hash_keys_pepper_not_blank_chk
    check (length(trim(pepper)) > 0)
);

create unique index if not exists ux_respondent_hash_keys_single_active
  on app_private.respondent_hash_keys (is_active)
  where is_active;

insert into app_private.respondent_hash_keys (key_id, pepper, is_active)
values (1, encode(extensions.gen_random_bytes(32), 'hex'), true)
on conflict (key_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from app_private.respondent_hash_keys
    where is_active
  ) then
    update app_private.respondent_hash_keys
    set is_active = true
    where key_id = (
      select key_id
      from app_private.respondent_hash_keys
      order by key_id asc
      limit 1
    );
  end if;
end;
$$;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

revoke all on all tables in schema app_private from public;
revoke all on all tables in schema app_private from anon;
revoke all on all tables in schema app_private from authenticated;
