#!/usr/bin/env bash
# Split supabase/admin-seed.sql into 11 chat-sendable parts.
# Fix (2026-09): strips the trailing comma from the last VALUES row of each
# partial insert (parts 02,03,07,08,09) so a standalone `on conflict` clause parses.
F="$(dirname "$0")/../supabase/admin-seed.sql"
D=/tmp/seedparts; rm -rf $D; mkdir -p $D
TH='insert into public.tools (slug, name, category, description, icon, url, input_type, active, featured, popular, sort_order, seo)'
PH='insert into public.templates (slug, name, category_slug, short_description, description, thumbnail, preview_image, demo_url, tags, featured, status, sort_order, seo)'
sed -n '1,32p' $F > $D/part01.sql
{ echo "-- tools (136 rows) — part 1 of 3 (rows 1-55)"; echo "$TH"; echo "values"; sed -n '36,90p'  $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part02.sql
{ echo "-- tools (136 rows) — part 2 of 3 (rows 56-110)"; echo "$TH"; echo "values"; sed -n '91,145p'  $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part03.sql
{ echo "-- tools (136 rows) — part 3 of 3 (rows 111-136)"; echo "$TH"; echo "values"; sed -n '146,171p' $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part04.sql
sed -n '176,292p' $F > $D/part05.sql
sed -n '293,314p' $F > $D/part06.sql
{ echo "-- templates (105 rows) — part 1 of 4 (rows 1-27)"; echo "$PH"; echo "values"; sed -n '318,344p' $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part07.sql
{ echo "-- templates (105 rows) — part 2 of 4 (rows 28-53)"; echo "$PH"; echo "values"; sed -n '345,370p' $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part08.sql
{ echo "-- templates (105 rows) — part 3 of 4 (rows 54-79)"; echo "$PH"; echo "values"; sed -n '371,396p' $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part09.sql
{ echo "-- templates (105 rows) — part 4 of 4 (rows 80-105)"; echo "$PH"; echo "values"; sed -n '397,422p' $F | sed '$s/,$//'; echo "on conflict (slug) do nothing;"; } > $D/part10.sql
sed -n '427,436p' $F > $D/part11.sql
echo "done -> $D"
