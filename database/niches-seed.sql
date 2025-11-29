-- Insert niches into the niches table
INSERT INTO public.niches (id, name, created_at) VALUES
  ('actualites', 'Actualités', now()),
  ('organisation', 'Organisation', now()),
  ('projet', 'Projet', now()),
  ('rapports', 'Rapports', now()),
  ('lois', 'Lois', now())
ON CONFLICT (id) DO NOTHING;
