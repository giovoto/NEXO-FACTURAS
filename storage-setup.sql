-- Enable storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage" schema "extensions";

-- Create a private bucket for facturas
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do nothing;

-- Set up RLS policies for the facturas bucket

-- 1. Allow authenticated users to upload files to their own company folders
create policy "Users can upload facturas for their companies"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'facturas' and
  (storage.foldername(name))[1] in (
    select empresa_id::text
    from public.user_empresas
    where user_id = auth.uid()
  )
);

-- 2. Allow users to read files from their own company folders
create policy "Users can read facturas from their companies"
on storage.objects for select
to authenticated
using (
  bucket_id = 'facturas' and
  (storage.foldername(name))[1] in (
    select empresa_id::text
    from public.user_empresas
    where user_id = auth.uid()
  )
);

-- 3. Allow users to update/delete files from their own company folders (optional)
create policy "Users can update facturas from their companies"
on storage.objects for update
to authenticated
using (
  bucket_id = 'facturas' and
  (storage.foldername(name))[1] in (
    select empresa_id::text
    from public.user_empresas
    where user_id = auth.uid()
  )
);
