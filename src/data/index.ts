export const session = {
  id: 'sess_01HQ3YT4ZXKM',
  name: 'acme-checkout-prod',
  base_url: 'https://api.acme-shop.com',
  source_type: 'HAR' as const,
  status: 'completed' as const,
  created_at: '2026-05-04T14:32:00Z',
  endpoints_count: 47,
  transactions_count: 2148,
  duration_ms: 187_421,
  ai_enriched_at: '2026-05-04T14:48:21Z',
  coverage: 78,
};

export const oauthFlow = [
  { method: 'GET'  as const, path: '/api/v1/users/me',     status: 401, statusText: 'Unauthorized', timing: 142, note: 'Bearer token expired' },
  { method: 'POST' as const, path: '/api/v1/auth/refresh', status: 200, statusText: 'OK',           timing: 312, note: 'Returns new access_token (15m TTL)' },
  { method: 'GET'  as const, path: '/api/v1/users/me',     status: 200, statusText: 'OK',           timing: 98,  note: 'Retried with new token' },
  { method: 'GET'  as const, path: '/api/v1/cart',         status: 200, statusText: 'OK',           timing: 124 },
];

export const oauthInsights = [
  { kind: 'info'    as const, text: 'Access token expires after ~15 minutes',       detail: 'Decoded JWT exp claim across 18 captured tokens' },
  { kind: 'warning' as const, text: 'Refresh token does not expire',                detail: 'No exp claim — security risk if leaked' },
  { kind: 'info'    as const, text: 'Client performs automatic retry after refresh', detail: 'Detected in 12/12 expired-token scenarios' },
  { kind: 'success' as const, text: 'PKCE detected on /auth/authorize',             detail: 'code_challenge_method = S256' },
];

export const schemaResource = {
  resource: 'Product',
  endpoint: 'GET /api/v1/products/{id}',
  samples: 234,
  fields: [
    { name: 'id',          type: 'string (uuid)',    range: '36 chars',         nullable: false, required: true,  confidence: 100, samples: 234, notes: 'v4 UUID format' },
    { name: 'price',       type: 'number (currency)',range: '0.01 → 9,999.99',  nullable: false, required: true,  confidence: 98,  samples: 234, notes: 'EUR — always 2 decimals' },
    { name: 'category',    type: 'enum',             range: '4 values',         nullable: false, required: true,  confidence: 96,  samples: 234, notes: 'vêtements, accessoires, électronique, maison' },
    { name: 'stock',       type: 'integer',          range: '0 → 1,250',        nullable: false, required: true,  confidence: 99,  samples: 234 },
    { name: 'rating',      type: 'number',           range: '0 → 5',            nullable: true,  required: false, confidence: 91,  samples: 198, notes: '15% null when sample_count < 5' },
    { name: 'created_at',  type: 'string (iso-8601)',range: '2023-08 → 2026-05',nullable: false, required: true,  confidence: 100, samples: 234 },
    { name: 'description', type: 'string',           range: '0 → 2,400 chars',  nullable: true,  required: false, confidence: 87,  samples: 234, notes: 'Absent in summary view' },
  ],
  patterns: [
    { label: 'Summary vs Full response detected', detail: '/products list returns 6 fields; /products/{id} returns 14' },
    { label: 'Pagination shape: cursor-based',    detail: 'next_cursor + has_more — no total count' },
  ],
};

export const predictedEndpoints = [
  { method: 'GET'    as const, path: '/api/v1/orders/{id}',         reason: 'CRUD pattern completion — list and create observed',        confidence: 97, evidence: ['POST /orders observed', 'GET /orders observed', 'DELETE /orders/{id} observed'] },
  { method: 'GET'    as const, path: '/api/v1/auth/logout',         reason: 'Auth flow symmetry — login present, logout absent',         confidence: 68, evidence: ['POST /auth/login observed', 'POST /auth/refresh observed'] },
  { method: 'GET'    as const, path: '/api/v1/orders?status=',      reason: 'Filter pattern from /products?category= generalized',       confidence: 74, evidence: ['?category= used on /products', '?role= used on /users'] },
  { method: 'PATCH'  as const, path: '/api/v1/users/{id}',          reason: 'Partial update missing — full PUT only',                    confidence: 82, evidence: ['PUT /users/{id} observed', 'PATCH /products/{id} observed'] },
  { method: 'DELETE' as const, path: '/api/v1/cart/items/{itemId}', reason: 'Sub-resource deletion inferred from add-item POST',         confidence: 91, evidence: ['POST /cart/items observed', 'PUT /cart/items/{itemId} observed'] },
  { method: 'GET'    as const, path: '/api/v1/invoices/{id}/pdf',   reason: 'Render endpoint — JSON variant present',                    confidence: 63, evidence: ['GET /invoices/{id} observed (JSON)'] },
];

export const rateLimitSeries = (() => {
  const data: { t: number; remaining: number }[] = [];
  let remaining = 100;
  for (let i = 0; i < 60; i++) {
    const drop = i < 5 ? 4 : i < 18 ? 2 : i < 30 ? 1 : i < 35 ? 6 : 1;
    remaining = Math.max(0, remaining - drop);
    if (i === 38) remaining = 100;
    data.push({ t: i, remaining });
  }
  return data;
})();

export const rateLimitInsights = [
  { kind: 'info'    as const, text: 'Global limit: 100 req / 60s window',       detail: 'X-RateLimit-Limit header — uniform across endpoints' },
  { kind: 'warning' as const, text: 'Login endpoint limited to 5 req / minute', detail: 'Stricter throttle on POST /auth/login — brute-force protection' },
  { kind: 'success' as const, text: 'Retry-After header respected by client',   detail: 'Average backoff: 23s before retry' },
];

export const summaryBullets = [
  { tone: 'indigo'  as const, text: 'OAuth2 with automatic token refresh', sub: 'PKCE enabled, 15-minute access token TTL' },
  { tone: 'amber'   as const, text: 'Incomplete session coverage',          sub: '6 endpoints inferred but not observed in capture' },
  { tone: 'violet'  as const, text: 'Cursor-based pagination throughout',   sub: 'next_cursor + has_more — total count never returned' },
  { tone: 'rose'    as const, text: 'Refresh tokens do not expire',         sub: 'High-impact finding — flagged in security audit' },
  { tone: 'emerald' as const, text: 'Rate limiting enforced globally',      sub: 'Stricter throttle on auth endpoints' },
];

export const endpointsList = [
  { method: 'GET'    as const, path: '/api/v1/users/me',                   samples: 412, p95: 124, conf: 99 },
  { method: 'POST'   as const, path: '/api/v1/auth/login',                 samples: 38,  p95: 312, conf: 100 },
  { method: 'POST'   as const, path: '/api/v1/auth/refresh',               samples: 144, p95: 198, conf: 98 },
  { method: 'GET'    as const, path: '/api/v1/products',                   samples: 287, p95: 91,  conf: 99 },
  { method: 'GET'    as const, path: '/api/v1/products/{id}',              samples: 234, p95: 102, conf: 98 },
  { method: 'POST'   as const, path: '/api/v1/cart/items',                 samples: 89,  p95: 256, conf: 96 },
  { method: 'PUT'    as const, path: '/api/v1/cart/items/{itemId}',        samples: 41,  p95: 187, conf: 94 },
  { method: 'GET'    as const, path: '/api/v1/orders',                     samples: 203, p95: 142, conf: 97 },
  { method: 'POST'   as const, path: '/api/v1/orders',                     samples: 56,  p95: 421, conf: 99 },
  { method: 'DELETE' as const, path: '/api/v1/orders/{id}/items/{itemId}', samples: 18,  p95: 198, conf: 88 },
  { method: 'PATCH'  as const, path: '/api/v1/products/{id}',              samples: 27,  p95: 167, conf: 92 },
];

export const securityFindings = [
  { severity: 'high'   as const, title: 'Refresh tokens never expire',                endpoint: 'POST /api/v1/auth/refresh', owasp: 'API2:2023', cvss: 7.4 },
  { severity: 'high'   as const, title: 'Excessive data exposure on user object',     endpoint: 'GET /api/v1/users/{id}',    owasp: 'API3:2023', cvss: 7.1 },
  { severity: 'medium' as const, title: 'Broken object-level authorization',          endpoint: 'GET /api/v1/orders/{id}',   owasp: 'API1:2023', cvss: 6.5 },
  { severity: 'medium' as const, title: 'Missing rate limit on enumeration endpoint', endpoint: 'GET /api/v1/products',      owasp: 'API4:2023', cvss: 5.3 },
  { severity: 'low'    as const, title: 'CORS allows wildcard origin',                endpoint: '*',                         owasp: 'API8:2023', cvss: 3.7 },
  { severity: 'low'    as const, title: 'Verbose error messages on 500',              endpoint: 'POST /api/v1/cart/items',   owasp: 'API8:2023', cvss: 3.1 },
  { severity: 'info'   as const, title: 'Server header reveals stack version',        endpoint: '*',                         owasp: 'API8:2023', cvss: 2.0 },
];

export const rawTraffic = [
  { ts: '14:32:01.214', method: 'GET'  as const, path: '/api/v1/users/me',        status: 401, ms: 142 },
  { ts: '14:32:01.498', method: 'POST' as const, path: '/api/v1/auth/refresh',    status: 200, ms: 312 },
  { ts: '14:32:01.842', method: 'GET'  as const, path: '/api/v1/users/me',        status: 200, ms: 98  },
  { ts: '14:32:02.211', method: 'GET'  as const, path: '/api/v1/products',        status: 200, ms: 91  },
  { ts: '14:32:02.504', method: 'GET'  as const, path: '/api/v1/products/p_2391', status: 200, ms: 102 },
  { ts: '14:32:03.117', method: 'POST' as const, path: '/api/v1/cart/items',      status: 201, ms: 256 },
  { ts: '14:32:03.612', method: 'GET'  as const, path: '/api/v1/cart',            status: 200, ms: 87  },
  { ts: '14:32:04.221', method: 'POST' as const, path: '/api/v1/orders',          status: 201, ms: 421 },
  { ts: '14:32:04.871', method: 'GET'  as const, path: '/api/v1/orders/o_8821',   status: 200, ms: 142 },
  { ts: '14:32:05.014', method: 'POST' as const, path: '/api/v1/auth/login',      status: 429, ms: 38  },
];
