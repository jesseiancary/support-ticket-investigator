import { createServer } from 'node:http';

import { health } from '@sti/shared';

/**
 * Placeholder entrypoint. The real Express server, routes, and RAG pipeline are
 * built in later phases (Phase 2 onward). For now this serves a minimal, dependency
 * -free health endpoint so the containerized dev stack boots and reports healthy.
 */
const PORT = Number(process.env.PORT) || 3000;

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: health(), service: 'api' }));
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console -- intentional boot log for the dev stack
  console.log(`api listening on :${PORT} (health=${health()})`);
});
