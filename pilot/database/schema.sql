-- Cloud staging schema. Application is still SQLite until the documented migration is verified.
create schema if not exists campus;
revoke all on schema campus from public, anon, authenticated;
create table if not exists campus.profiles (
 id uuid primary key default gen_random_uuid(), google_subject text unique not null,
 email text unique not null, display_name text not null,
 role text not null default 'student' check(role in ('student','teacher','admin')),
 class_id text, email_verified boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists campus.lessons (
 id text primary key, quarter smallint not null check(quarter between 1 and 4),
 title text not null, position integer not null, published boolean not null default false,
 unique(quarter,position)
);
create table if not exists campus.enrollments (
 student_id uuid references campus.profiles(id),teacher_id uuid references campus.profiles(id),
 primary key(student_id,teacher_id)
);
create table if not exists campus.progress (
 student_id uuid references campus.profiles(id),lesson_id text references campus.lessons(id),
 mission_passed boolean not null default false, explanation text,reflection text,
 review_status text not null default 'none' check(review_status in ('none','pending','revise','approved')),
 feedback text,reviewed_by uuid references campus.profiles(id),updated_at timestamptz not null default now(),
 primary key(student_id,lesson_id)
);
create table if not exists campus.sessions (
 user_id uuid primary key references campus.profiles(id),token_hash text unique not null,
 created_at timestamptz not null default now(),seen_at timestamptz not null default now(),expires_at timestamptz not null
);
create table if not exists campus.audit (
 id bigint generated always as identity primary key,actor_id uuid references campus.profiles(id),
 action text not null,target_id text,created_at timestamptz not null default now()
);
alter table campus.profiles enable row level security;
alter table campus.lessons enable row level security;
alter table campus.enrollments enable row level security;
alter table campus.progress enable row level security;
alter table campus.sessions enable row level security;
alter table campus.audit enable row level security;
revoke all on all tables in schema campus from public, anon, authenticated;
insert into campus.lessons(id,quarter,title,position,published)
values('q1-network-01',1,'Компьютерлік желілердің жұмыс жасау принциптері',1,true)
on conflict(id) do nothing;
