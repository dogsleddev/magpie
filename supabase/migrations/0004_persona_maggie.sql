-- Finish the long-decided persona revert: the persona is "Maggie" (see docs/SCHEMA.md,
-- docs/BRD.md, CLAUDE.md, the landing copy). The 0001 default drifted to 'Magpie',
-- so the live app shows the wrong name. This fixes the column default and backfills
-- the rows still on the old default.
-- Apply via the Supabase SQL editor or `supabase db push`.

alter table user_settings alter column persona_name set default 'Maggie';

update user_settings set persona_name = 'Maggie' where persona_name = 'Magpie';
