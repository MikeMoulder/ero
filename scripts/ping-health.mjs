const baseUrl = process.env.RENDER_BACKEND_URL;

if (!baseUrl) {
  console.error('Missing RENDER_BACKEND_URL environment variable.');
  process.exit(1);
}

const healthUrl = `${baseUrl.replace(/\/$/, '')}/api/health`;

try {
  const response = await fetch(healthUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'stellar-hackathon-keepalive/1.0',
      Accept: 'application/json',
    },
  });

  const body = await response.text();
  console.log(`[keepalive] ${response.status} ${response.statusText} -> ${healthUrl}`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
} catch (error) {
  console.error(`[keepalive] request failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
