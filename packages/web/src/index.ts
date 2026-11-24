import { createServer } from 'node:http';

import { health } from '@sti/shared';

/**
 * Placeholder entrypoint. The real React app (Vite + Tailwind + TanStack Query) is
 * scaffolded in Phase 5. For now this serves a minimal, dependency-free health
 * endpoint so the containerized dev stack boots and reports healthy.
 */
const PORT = Number(process.env.PORT) || 5173;

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: health(), service: 'web' }));
    return;
  }
  if (req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('support-ticket-investigator web (placeholder — UI arrives in Phase 5)\n');
    return;
  }
  // Unknown paths mirror the api placeholder's 404 JSON shape for consistency.
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console -- intentional boot log for the dev stack
  console.log(`web listening on :${PORT} (health=${health()})`);
});
