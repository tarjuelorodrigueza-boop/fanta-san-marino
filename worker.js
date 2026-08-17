export default {
  async fetch() {
    return new Response(JSON.stringify({ ok: true, service: 'Fantasy San Marino live sync', cron: '*/2 * * * *' }), {
      headers: { 'content-type': 'application/json' }
    });
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sync(env, controller));
  }
};

async function sync(env, controller) {
  if (!env.SUPABASE_FUNCTION_URL) throw new Error('Missing SUPABASE_FUNCTION_URL');

  const headers = { 'content-type': 'application/json' };
  if (env.CRON_SECRET) {
    headers['x-cron-secret'] = env.CRON_SECRET;
    headers['authorization'] = `Bearer ${env.CRON_SECRET}`;
  }
  if (env.SUPABASE_ANON_KEY) headers['apikey'] = env.SUPABASE_ANON_KEY;

  const response = await fetch(env.SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: 'cloudflare-cron',
      cron: controller.cron,
      scheduled_at: new Date(controller.scheduledTime).toISOString()
    })
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase sync failed (${response.status}): ${body}`);
  console.log('Supabase sync OK:', body);
}
