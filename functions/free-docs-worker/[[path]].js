// Keeps the worker's source files (free-docs-worker/*) from being served by Pages.
// The folder lives in the repo (the worker deploys from it with wrangler) but is not part of the site.
// Anything under /free-docs-worker/ answers with the normal 404 page.
export async function onRequest({ request, env }) {
  const page = await env.ASSETS.fetch(new URL("/404.html", request.url));
  return new Response(page.body, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
