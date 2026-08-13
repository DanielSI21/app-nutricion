create extension if not exists pgcrypto;

create type public.profile_role as enum ('patient', 'practitioner');
create type public.recipe_mode as enum ('calculated', 'manual');
create type public.meal_log_status as enum ('pending', 'completed-planned', 'completed-changed', 'skipped', 'recalculated');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role public.profile_role not null,
  timezone text not null default 'America/Chihuahua',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.practitioner_patients (
  practitioner_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (practitioner_id, patient_id),
  check (practitioner_id <> patient_id)
);
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.profiles(id) on delete cascade,
  label text not null, source text not null check (source in ('formula','smae')),
  protein numeric(10,4) not null check (protein >= 0), fat numeric(10,4) not null check (fat >= 0),
  carbs numeric(10,4) not null check (carbs >= 0), kcal numeric(10,4) not null check (kcal >= 0),
  parameters jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.profiles(id) on delete cascade,
  practitioner_id uuid not null references public.profiles(id) on delete restrict,
  target_id uuid not null references public.nutrition_targets(id) on delete restrict,
  title text not null, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.smae_groups (
  id uuid primary key default gen_random_uuid(), code text not null unique, group_name text not null, subgroup text,
  protein_per_equivalent numeric(8,3) not null check (protein_per_equivalent >= 0),
  fat_per_equivalent numeric(8,3) not null check (fat_per_equivalent >= 0),
  carbs_per_equivalent numeric(8,3) not null check (carbs_per_equivalent >= 0),
  verified boolean not null default true, created_at timestamptz not null default now()
);
create table public.foods (
  id uuid primary key default gen_random_uuid(), name text not null, brand text, smae_group_id uuid references public.smae_groups(id) on delete set null,
  reference_quantity numeric(10,3) not null check (reference_quantity > 0), reference_unit text not null,
  reference_grams numeric(10,3) check (reference_grams > 0), kcal numeric(10,3) not null check (kcal >= 0),
  protein numeric(10,3) not null check (protein >= 0), fat numeric(10,3) not null check (fat >= 0), carbs numeric(10,3) not null check (carbs >= 0),
  equivalents numeric(8,3) not null default 0 check (equivalents >= 0), household_note text, icon text,
  data_source text not null, verified boolean not null default false, owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.food_servings (
  id uuid primary key default gen_random_uuid(), food_id uuid not null references public.foods(id) on delete cascade,
  label text not null, quantity numeric(10,3) not null check (quantity > 0), unit text not null,
  grams_equivalent numeric(10,3) check (grams_equivalent > 0), created_at timestamptz not null default now()
);
create table public.plan_meals (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  meal_key text not null check (meal_key in ('breakfast','snack','lunch','dinner')), name text not null, meal_time time not null,
  position smallint not null check (position between 1 and 20), planned_macros jsonb not null,
  unique(plan_id, meal_key), unique(plan_id, position)
);
create table public.meal_choice_groups (
  id uuid primary key default gen_random_uuid(), plan_meal_id uuid not null references public.plan_meals(id) on delete cascade,
  label text not null, required boolean not null default true, note text, position smallint not null, unique(plan_meal_id, position)
);
create table public.meal_options (
  id uuid primary key default gen_random_uuid(), choice_group_id uuid not null references public.meal_choice_groups(id) on delete cascade,
  label text not null, position smallint not null, unique(choice_group_id, position)
);
create table public.meal_option_items (
  id uuid primary key default gen_random_uuid(), meal_option_id uuid not null references public.meal_options(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict, label text not null,
  quantity numeric(10,3) not null check (quantity > 0), unit text not null, equivalents numeric(8,3) not null default 0 check (equivalents >= 0)
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(), patient_id uuid references public.profiles(id) on delete cascade,
  name text not null, mode public.recipe_mode not null, servings numeric(8,2) not null check (servings > 0),
  description text, manual_macros jsonb, smae_note text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((mode = 'manual' and manual_macros is not null) or mode = 'calculated')
);
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(), recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict, quantity numeric(10,3) not null check (quantity > 0),
  unit text not null, position smallint not null, unique(recipe_id, position)
);
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(patient_id, log_date)
);
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(), daily_log_id uuid not null references public.daily_logs(id) on delete cascade,
  plan_meal_id uuid not null references public.plan_meals(id) on delete restrict, meal_key text not null,
  status public.meal_log_status not null, classification text not null,
  macros jsonb not null, recorded_at timestamptz not null default now(), unique(daily_log_id, meal_key)
);
create table public.food_log_entries (
  id uuid primary key default gen_random_uuid(), meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null, recipe_id uuid references public.recipes(id) on delete set null,
  name text not null, quantity numeric(10,3) not null check (quantity > 0), unit text not null,
  macros jsonb not null, equivalents numeric(8,3) not null default 0 check (equivalents >= 0), approximate boolean not null default true,
  check ((food_id is not null)::int + (recipe_id is not null)::int <= 1)
);
create table public.recalculation_events (
  id uuid primary key default gen_random_uuid(), daily_log_id uuid not null references public.daily_logs(id) on delete cascade,
  previous_state jsonb not null, proposal jsonb not null, decision text not null check (decision in ('accepted','rejected')),
  created_at timestamptz not null default now()
);

create index practitioner_patients_patient_idx on public.practitioner_patients(patient_id);
create index nutrition_plans_patient_active_idx on public.nutrition_plans(patient_id, active);
create index foods_search_idx on public.foods using gin (to_tsvector('spanish', name || ' ' || coalesce(brand,'')));
create index plan_meals_plan_idx on public.plan_meals(plan_id, position);
create index daily_logs_patient_date_idx on public.daily_logs(patient_id, log_date desc);
create index meal_logs_daily_idx on public.meal_logs(daily_log_id);
create index food_log_entries_meal_idx on public.food_log_entries(meal_log_id);
create index recalculation_events_daily_idx on public.recalculation_events(daily_log_id, created_at desc);

create or replace function public.is_assigned_practitioner(target_patient uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.practitioner_patients pp where pp.practitioner_id = auth.uid() and pp.patient_id = target_patient)
$$;
create or replace function public.owns_daily_log(target_log uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.daily_logs dl where dl.id = target_log and dl.patient_id = auth.uid())
$$;

alter table public.profiles enable row level security;
alter table public.practitioner_patients enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.smae_groups enable row level security;
alter table public.foods enable row level security;
alter table public.food_servings enable row level security;
alter table public.plan_meals enable row level security;
alter table public.meal_choice_groups enable row level security;
alter table public.meal_options enable row level security;
alter table public.meal_option_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.daily_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.food_log_entries enable row level security;
alter table public.recalculation_events enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_assigned_practitioner(id));
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy assignments_read on public.practitioner_patients for select to authenticated using (practitioner_id = auth.uid() or patient_id = auth.uid());
create policy targets_read on public.nutrition_targets for select to authenticated using (patient_id = auth.uid() or public.is_assigned_practitioner(patient_id));
create policy targets_practitioner_write on public.nutrition_targets for all to authenticated using (public.is_assigned_practitioner(patient_id)) with check (public.is_assigned_practitioner(patient_id));
create policy plans_read on public.nutrition_plans for select to authenticated using (patient_id = auth.uid() or public.is_assigned_practitioner(patient_id));
create policy plans_practitioner_write on public.nutrition_plans for all to authenticated using (practitioner_id = auth.uid() and public.is_assigned_practitioner(patient_id)) with check (practitioner_id = auth.uid() and public.is_assigned_practitioner(patient_id));
create policy smae_authenticated_read on public.smae_groups for select to authenticated using (true);
create policy foods_authenticated_read on public.foods for select to authenticated using (verified or owner_id = auth.uid());
create policy foods_owner_write_unverified on public.foods for all to authenticated using (owner_id = auth.uid() and not verified) with check (owner_id = auth.uid() and not verified);
create policy servings_read on public.food_servings for select to authenticated using (exists(select 1 from public.foods f where f.id = food_id and (f.verified or f.owner_id = auth.uid())));
create policy plan_meals_read on public.plan_meals for select to authenticated using (exists(select 1 from public.nutrition_plans p where p.id = plan_id and (p.patient_id = auth.uid() or public.is_assigned_practitioner(p.patient_id))));
create policy choice_groups_read on public.meal_choice_groups for select to authenticated using (exists(select 1 from public.plan_meals pm join public.nutrition_plans p on p.id=pm.plan_id where pm.id=plan_meal_id and (p.patient_id=auth.uid() or public.is_assigned_practitioner(p.patient_id))));
create policy meal_options_read on public.meal_options for select to authenticated using (exists(select 1 from public.meal_choice_groups cg join public.plan_meals pm on pm.id=cg.plan_meal_id join public.nutrition_plans p on p.id=pm.plan_id where cg.id=choice_group_id and (p.patient_id=auth.uid() or public.is_assigned_practitioner(p.patient_id))));
create policy option_items_read on public.meal_option_items for select to authenticated using (exists(select 1 from public.meal_options mo join public.meal_choice_groups cg on cg.id=mo.choice_group_id join public.plan_meals pm on pm.id=cg.plan_meal_id join public.nutrition_plans p on p.id=pm.plan_id where mo.id=meal_option_id and (p.patient_id=auth.uid() or public.is_assigned_practitioner(p.patient_id))));
create policy recipes_read on public.recipes for select to authenticated using (patient_id is null or patient_id=auth.uid() or public.is_assigned_practitioner(patient_id));
create policy recipes_owner_write on public.recipes for all to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy recipe_ingredients_read on public.recipe_ingredients for select to authenticated using (exists(select 1 from public.recipes r where r.id=recipe_id and (r.patient_id is null or r.patient_id=auth.uid() or public.is_assigned_practitioner(r.patient_id))));
create policy daily_logs_read on public.daily_logs for select to authenticated using (patient_id=auth.uid() or public.is_assigned_practitioner(patient_id));
create policy daily_logs_patient_write on public.daily_logs for all to authenticated using (patient_id=auth.uid()) with check (patient_id=auth.uid());
create policy meal_logs_read on public.meal_logs for select to authenticated using (public.owns_daily_log(daily_log_id) or exists(select 1 from public.daily_logs d where d.id=daily_log_id and public.is_assigned_practitioner(d.patient_id)));
create policy meal_logs_patient_write on public.meal_logs for all to authenticated using (public.owns_daily_log(daily_log_id)) with check (public.owns_daily_log(daily_log_id));
create policy entries_read on public.food_log_entries for select to authenticated using (exists(select 1 from public.meal_logs ml join public.daily_logs dl on dl.id=ml.daily_log_id where ml.id=meal_log_id and (dl.patient_id=auth.uid() or public.is_assigned_practitioner(dl.patient_id))));
create policy entries_patient_write on public.food_log_entries for all to authenticated using (exists(select 1 from public.meal_logs ml where ml.id=meal_log_id and public.owns_daily_log(ml.daily_log_id))) with check (exists(select 1 from public.meal_logs ml where ml.id=meal_log_id and public.owns_daily_log(ml.daily_log_id)));
create policy recalculations_read on public.recalculation_events for select to authenticated using (public.owns_daily_log(daily_log_id) or exists(select 1 from public.daily_logs dl where dl.id=daily_log_id and public.is_assigned_practitioner(dl.patient_id)));
create policy recalculations_patient_write on public.recalculation_events for insert to authenticated with check (public.owns_daily_log(daily_log_id));

revoke all on all tables in schema public from anon;
