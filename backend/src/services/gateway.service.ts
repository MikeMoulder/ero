import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { RegisteredAPI } from '../types';
import { store } from '../store/memory.store';
import { events } from './events.service';
import { stellarService } from './stellar.service';

class GatewayService {
  private validateBaseUrl(baseUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new Error('Invalid baseUrl: must be a valid URL');
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid baseUrl: only http and https protocols are allowed');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block private/internal IPs and hostnames
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
      /^fd/,
      /\.local$/,
      /\.internal$/,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        throw new Error('Invalid baseUrl: private/internal addresses are not allowed');
      }
    }
  }

  registerApi(baseUrl: string, slug: string, price: number, receiverAddress?: string, owner?: string): RegisteredAPI {
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/^-+|-+$/g, '');

    if (!normalizedSlug) {
      throw new Error('Invalid slug: must contain at least one alphanumeric character');
    }

    if (normalizedSlug.length > 64) {
      throw new Error('Invalid slug: must be 64 characters or fewer');
    }

    this.validateBaseUrl(baseUrl);

    const existing = store.getApiBySlug(normalizedSlug);
    if (existing) {
      // Allow claiming unowned catalog entries
      if (!existing.owner && owner) {
        store.updateApi(existing.id, {
          baseUrl: baseUrl.replace(/\/$/, ''),
          price,
          receiverAddress: receiverAddress || stellarService.getAgentPublicKey(),
          owner,
        });
        const claimed = store.getApiBySlug(normalizedSlug)!;
        events.log('info', 'Gateway', `Claimed catalog API: ${claimed.name} by ${owner} (${price} USDC/call)`, undefined, owner);
        return claimed;
      }
      throw new Error(`Slug "${normalizedSlug}" is already registered`);
    }

    const api: RegisteredAPI = {
      id: uuid(),
      name: normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      baseUrl: baseUrl.replace(/\/$/, ''),
      slug: normalizedSlug,
      price,
      receiverAddress: receiverAddress || stellarService.getAgentPublicKey(),
      owner: owner || '',
      status: 'active',
      callCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };

    store.addApi(api);
    events.log('info', 'Gateway', `Registered API: ${api.name} at /x402/${normalizedSlug}/* (${price} USDC/call)`, undefined, owner);
    return api;
  }

  /**
   * Parse a full request path into slug + sub-path + query params.
    * e.g. "/dexscreener/latest/dex/search?q=bitcoin" → { slug: "dexscreener", subPath: "/latest/dex/search", queryParams: { q: "bitcoin" } }
   */
  private parseRequestPath(path: string): { slug: string; subPath: string; queryParams: Record<string, string> } | null {
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    if (!cleaned) return null;

    // Separate query string from path
    const [pathPart, queryString] = cleaned.split('?');
    const queryParams: Record<string, string> = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
    }

    const slashIndex = pathPart.indexOf('/');
    if (slashIndex === -1) {
      return { slug: pathPart, subPath: '/', queryParams };
    }

    return {
      slug: pathPart.slice(0, slashIndex),
      subPath: pathPart.slice(slashIndex),
      queryParams,
    };
  }

  async handleWrappedRequest(
    wrappedPath: string,
    paymentId: string | undefined,
    query: Record<string, any>,
    userPublicKey: string = ''
  ): Promise<{ status: number; body: any }> {
    const parsed = this.parseRequestPath(wrappedPath);
    if (!parsed) {
      return { status: 404, body: { error: 'Invalid path', path: `/x402${wrappedPath}` } };
    }

    const api = store.getApiBySlug(parsed.slug);
    if (!api) {
      return { status: 404, body: { error: 'API not found', slug: parsed.slug, path: `/x402${wrappedPath}` } };
    }

    if (api.status !== 'active') {
      return { status: 503, body: { error: 'API is inactive' } };
    }

    // No payment provided - return 402
    if (!paymentId) {
      const payment = stellarService.createPaymentRequest(api.id, api.name, api.price, api.receiverAddress, userPublicKey);
      events.log('payment', 'Gateway', `402 Payment Required for ${api.name}${parsed.subPath}: ${api.price} USDC`, {
        paymentId: payment.id,
      }, userPublicKey);
      return {
        status: 402,
        body: {
          status: 402,
          message: 'Payment Required',
          amount: api.price,
          asset: 'USDC',
          network: 'testnet',
          address: api.receiverAddress,
          memo: payment.id,
          paymentId: payment.id,
        },
      };
    }

    // Payment provided - check status
    const payment = store.getPayment(paymentId);
    if (!payment) {
      return { status: 402, body: { error: 'Invalid payment ID' } };
    }

    if (payment.status !== 'verified') {
      return {
        status: 402,
        body: {
          status: 402,
          message: 'Payment not yet verified',
          paymentStatus: payment.status,
          paymentId: payment.id,
        },
      };
    }

    // Payment verified - forward request with sub-path (one-time use)
    try {
      // Mark payment as consumed to prevent replay
      store.updatePayment(paymentId, { status: 'consumed' as any });

      const mergedQuery = { ...parsed.queryParams, ...query };
      const result = await this.forwardRequest(api, parsed.subPath, mergedQuery);

      // Upstream returned 4xx — pass through the error but consume the payment
      // (bad request is the caller's fault, not a retryable failure)
      if (result.upstreamStatus && result.upstreamStatus >= 400) {
        events.log('warn', 'Gateway', `Upstream ${api.name}${parsed.subPath} returned ${result.upstreamStatus}`, undefined, payment.userPublicKey || userPublicKey);
        return { status: result.upstreamStatus, body: { error: 'Upstream API returned an error', upstreamStatus: result.upstreamStatus, upstreamResponse: result.data, paymentId } };
      }

      store.updateApi(api.id, {
        callCount: api.callCount + 1,
        totalRevenue: api.totalRevenue + api.price,
      });
      events.log('info', 'Gateway', `Forwarded request to ${api.name}${parsed.subPath} (call #${api.callCount + 1})`, undefined, payment.userPublicKey || userPublicKey);
      return { status: 200, body: result.data };
    } catch (err: any) {
      // Revert payment to verified so the caller can retry without paying again
      store.updatePayment(paymentId, { status: 'verified' as any });
      events.log('error', 'Gateway', `Failed to forward to ${api.baseUrl}${parsed.subPath}: ${err.message} (payment ${paymentId} restored for retry)`, undefined, payment.userPublicKey || userPublicKey);
      return { status: 502, body: { error: 'Upstream API error', message: err.message, paymentId, retryable: true } };
    }
  }

  private async forwardRequest(api: RegisteredAPI, subPath: string, query: Record<string, any>): Promise<{ data: any; upstreamStatus?: number }> {
    const url = `${api.baseUrl}${subPath}`;
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          params: query,
          timeout: 30000,
          headers: { 'User-Agent': 'ero-x402-gateway/1.0 (https://github.com/ero-x402)' },
          validateStatus: (status) => status < 500, // don't throw on 4xx
        });
        return { data: response.data, upstreamStatus: response.status };
      } catch (err: any) {
        lastError = err;
        const isRetryable = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ERR_SOCKET_CONNECTION_TIMEOUT'
          || (err.response && err.response.status >= 500);
        if (!isRetryable || attempt === maxRetries) break;
        // Brief pause before retry
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw lastError;
  }
}

export const gatewayService = new GatewayService();
