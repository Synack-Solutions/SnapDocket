-- Seed data: supabase/seed.sql
-- Applied automatically by `supabase db reset` (local dev only)
-- Never runs on `supabase db push` to production

-- Demo tenant
insert into public.tenants (id, name, slug, status, settings, branding) values
  (
    '00000000-0000-0000-0000-000000000001',
    'Acme Trades',
    'acme-trades',
    'active',
    '{"currency":"AUD","timezone":"Australia/Sydney","invoice_prefix":"INV-","tax_rate":10,"payment_terms_days":14}'::jsonb,
    '{"company_name":"Acme Trades","primary_color":"222 47% 11%","accent_color":"217 91% 60%"}'::jsonb
  );

-- Demo customer
insert into public.customers (id, tenant_id, name, email, phone, address_line1, city, state, postcode) values
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Bob Smith',
    'bob@example.com',
    '0412 345 678',
    '1 Example Street',
    'Sydney',
    'NSW',
    '2000'
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Jane Doe',
    'jane@example.com',
    '0413 456 789',
    '2 Sample Ave',
    'Melbourne',
    'VIC',
    '3000'
  );

-- Demo job
insert into public.jobs (id, tenant_id, customer_id, title, status, priority, scheduled_at) values
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Replace hot water system',
    'scheduled',
    'high',
    (now() + interval '2 days')
  );

-- Demo invoice
insert into public.invoices (id, tenant_id, customer_id, job_id, invoice_number, status, due_date, subtotal, tax_rate, tax_amount, total) values
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'INV-00001',
    'sent',
    (current_date + interval '14 days'),
    1000.00,
    10,
    100.00,
    1100.00
  );

insert into public.invoice_items (invoice_id, description, quantity, unit_price, tax_rate, sort_order) values
  ('00000000-0000-0000-0000-000000000030', 'Labour - Hot water system installation', 4, 150.00, 10, 0),
  ('00000000-0000-0000-0000-000000000030', 'Rheem 250L Hot Water System', 1, 400.00, 10, 1);
