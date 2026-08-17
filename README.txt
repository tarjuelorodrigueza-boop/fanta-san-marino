FANTASY SAN MARINO — CLOUDFLARE WORKER

Cron: */2 * * * * (every 2 minutes, UTC)

After importing this Worker into Cloudflare, add these Worker secrets/variables:

SUPABASE_FUNCTION_URL = https://clfdtofeoqvterxmbhcj.supabase.co/functions/v1/sync-sammarino-live

CRON_SECRET = the dedicated secret accepted by the Supabase sync function.

SUPABASE_ANON_KEY = your Supabase project's public anon key.

Do NOT use the Supabase service-role key in the Worker.

Dashboard:
Workers & Pages -> Create application -> upload/import this project -> Deploy.
Then Worker -> Settings -> Variables and Secrets -> add the values above.
The Cron is already defined in wrangler.json as */2 * * * *.
After deployment, check Worker -> Triggers / Cron and then Trigger Events / View events.
