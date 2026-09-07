-- seed part 01 · settings (6 of 6) — run parts in order
insert into public.settings (key, value)
values
  ('brand', '{"logo_url": "/branify-logo-horizontal.svg", "favicon_url": "/branify-icon.svg", "default_og_image": "/og/home.jpg"}'::jsonb),
  ('contact', '{"email": "admin@branify.store", "phone": "+447412831132", "offices": [{"label": "UK Office", "lines": ["13 Church Way", "Bradford, BD1 7ZE", "United Kingdom"]}, {"label": "Pakistan Office", "lines": ["House 6, Street 2", "Nearby PMA", "Pakistan"]}, {"label": "Bangladesh Office", "lines": ["Opening Soon"]}], "whatsapp": "923321029333", "whatsapp_display": "+92 332 1029333"}'::jsonb),
  ('general', '{"tagline": "Luxury Digital Studio & Futuristic Technology", "site_url": "https://branify-new.vercel.app", "site_name": "BRANIFY"}'::jsonb),
  ('performance', '{"analytics_provider": "first_party"}'::jsonb),
  ('seo_defaults', '{"default_title": "BRANIFY — Luxury Digital Studio & Futuristic Technology", "title_template": "%s | BRANIFY", "default_og_image": "/og/home.jpg", "title_max_length": 60, "default_description": "BRANIFY is a futuristic digital studio delivering web development, branding, AI solutions, 100+ free tools and premium digital products for ambitious international brands.", "description_max_length": 160}'::jsonb),
  ('social', '{"tiktok": "https://www.tiktok.com/@branify", "youtube": "https://www.youtube.com/@branify", "facebook": "https://facebook.com/branify", "linkedin": "https://www.linkedin.com/company/branify", "instagram": "https://instagram.com/branify"}'::jsonb)
on conflict (key) do update set key = excluded.key, value = excluded.value;
