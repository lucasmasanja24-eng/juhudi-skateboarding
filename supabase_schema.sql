-- =============================================
-- JUHUDI SKATEBOARDING - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  date_of_birth date,
  gender text,
  status text default 'Student', -- Student / Working / Both
  role text default 'Member',    -- Member / Founder / Coach / Captain
  stance text default 'Regular', -- Regular / Goofy
  level text default 'Beginner', -- Beginner / Intermediate / Advanced / Pro
  favourite_trick text,
  idol_skater text,
  bio text,
  photo_url text,
  is_approved boolean default false,
  is_visible boolean default true,
  is_admin boolean default false,
  student boolean default true,
  working boolean default false,
  created_at timestamp with time zone default now()
);

-- GALLERY
create table public.gallery (
  id uuid default gen_random_uuid() primary key,
  title text,
  caption text,
  image_url text not null,
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- POSTS
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  media_url text,
  media_type text, -- 'image' or 'video'
  published_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- BOOKINGS
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  full_name text not null,
  date_of_birth date,
  phone text not null,
  preferred_date date not null,
  preferred_time text not null,
  skill_level text not null,
  notes text,
  status text default 'Pending', -- Pending / Approved / Declined
  created_at timestamp with time zone default now()
);

-- STORAGE BUCKETS (run in Supabase dashboard > Storage)
-- Create buckets: 'gallery', 'profiles', 'posts'
-- Set gallery and profiles to PUBLIC

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.gallery enable row level security;
alter table public.posts enable row level security;
alter table public.bookings enable row level security;

-- PROFILES policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (is_approved = true);

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admin can do everything on profiles"
  on public.profiles for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- GALLERY policies
create policy "Gallery is public"
  on public.gallery for select using (true);

create policy "Admin can manage gallery"
  on public.gallery for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- POSTS policies
create policy "Posts are public"
  on public.posts for select using (true);

create policy "Admin can manage posts"
  on public.posts for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- BOOKINGS policies
create policy "Users can create bookings"
  on public.bookings for insert with check (true);

create policy "Users can view their own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "Admin can manage all bookings"
  on public.bookings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- TRIGGER: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INSERT ADMIN (run after creating your account)
-- Replace 'YOUR_USER_ID' with your actual UUID from auth.users
-- update public.profiles set is_admin = true, is_approved = true where email = 'lucas@juhudi.com';
