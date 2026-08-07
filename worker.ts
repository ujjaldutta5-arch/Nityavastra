// OpenNext custom Worker entry (cron + fetch). Not part of the Next.js app.
// @ts-expect-error `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

type Env = {
  CRON_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ASSETS?: Fetcher;
};

export default {
  fetch: handler.fetch,

  /**
   * Cloudflare Cron Trigger → Shiprocket status poll.
   * Requires NEXT_PUBLIC_SITE_URL secret on the Worker.
   * Test locally: wrangler dev --test-scheduled
   * then GET /cdn-cgi/handler/scheduled
   */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    const origin = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (!origin) {
      console.error("scheduled: NEXT_PUBLIC_SITE_URL is not set");
      return;
    }

    const headers = new Headers();
    if (env.CRON_SECRET) {
      headers.set("Authorization", `Bearer ${env.CRON_SECRET}`);
    }

    ctx.waitUntil(
      handler.fetch(
        new Request(`${origin}/api/cron/shiprocket-poll`, {
          method: "GET",
          headers,
        }),
        env,
        ctx
      )
    );
  },
} satisfies ExportedHandler<Env>;

// @ts-expect-error `.open-next/worker.js` is generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
