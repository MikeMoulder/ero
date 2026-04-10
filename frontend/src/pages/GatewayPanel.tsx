import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import * as freighter from '../services/freighter';
import { RegisteredAPI } from '../types';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Badge } from '../components/shared/Badge';
import { StatusDot } from '../components/shared/StatusDot';

// ─── API Test Panel ─────────────────────────────────────────────────────────
function ApiTestPanel({ apiItem, onClose }: { apiItem: RegisteredAPI; onClose: () => void }) {
  const wallet = useWallet();
  const [step, setStep] = useState<'idle' | 'preparing' | 'signing' | 'submitting' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [subPath, setSubPath] = useState('');

  const wrappedPath = `/${apiItem.slug}${subPath.startsWith('/') ? subPath : `/${subPath}`}`;

  const runTest = async () => {
    setResult(null);
    setError('');
    const start = Date.now();

    if (wallet.connected && wallet.publicKey) {
      setStep('preparing');
      try {
        const prepared = await api.preparePayment(wrappedPath, wallet.publicKey) as any;
        if (prepared.step === 'already_accessible') {
          setElapsed(Date.now() - start);
          setResult(prepared.response);
          setStep('done');
          return;
        }
        setStep('signing');
        const signedTxXdr = await freighter.signTx(prepared.unsignedTxXdr);
        setStep('submitting');
        const res = await api.submitPayment(signedTxXdr, prepared.paymentId, wrappedPath);
        setElapsed(Date.now() - start);
        setResult(res);
        setStep('done');
      } catch (err: any) {
        setElapsed(Date.now() - start);
        setError(err.message || 'Payment failed');
        setStep('error');
      }
    } else {
      setStep('submitting');
      try {
        const res = await api.testPayment(wrappedPath);
        setElapsed(Date.now() - start);
        setResult(res);
        setStep('done');
      } catch (err: any) {
        setElapsed(Date.now() - start);
        setError(err.message || 'Test failed');
        setStep('error');
      }
    }
  };

  const stepLabel =
    step === 'preparing' ? 'Preparing transaction...' :
    step === 'signing' ? 'Awaiting Freighter signature...' :
    step === 'submitting' ? 'Submitting & verifying on Stellar...' :
    null;

  return (
    <div className="border border-border bg-bg-secondary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Badge variant="info">
            GET
          </Badge>
          <span className="text-xs font-mono text-accent">/x402/{apiItem.slug}/*</span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-xs font-mono transition-colors duration-[80ms]">
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left: Request */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em]">Request</span>
            <div className="flex items-center gap-2">
              {wallet.connected ? (
                <span className="text-[9px] font-mono text-text-tertiary">via Freighter</span>
              ) : (
                <span className="text-[9px] font-mono text-text-tertiary">via Agent Wallet</span>
              )}
            </div>
          </div>

          {/* Sub-path input */}
          <div className="mb-4">
            <Input
              label="Sub-path"
              placeholder="/simple/price?ids=stellar&vs_currencies=usd"
              value={subPath}
              onChange={(e) => setSubPath(e.target.value)}
            />
            <p className="text-[9px] font-mono text-text-tertiary mt-1">Full path: /x402{wrappedPath}</p>
          </div>

          {/* Request info */}
          <div className="bg-bg-primary border border-border p-4 font-mono text-xs space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Endpoint</span>
              <span className="text-text-primary">/x402{wrappedPath}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Price</span>
              <span className="text-accent">{apiItem.price} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Receiver</span>
              <span className="text-text-secondary">{apiItem.receiverAddress.slice(0, 12)}...{apiItem.receiverAddress.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Network</span>
              <span className="text-text-secondary">Stellar Testnet</span>
            </div>
          </div>

          {/* x402 flow visualization */}
          <div className="space-y-2 mb-5">
            {[
              { label: '1. Request API', done: step !== 'idle' },
              { label: '2. Receive 402', done: step !== 'idle' },
              { label: '3. Sign & Pay', done: ['submitting', 'done', 'error'].includes(step) },
              { label: '4. Verified', done: step === 'done' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-4 h-4 flex items-center justify-center text-[8px] font-mono border ${
                  s.done ? 'border-accent bg-accent text-white' : 'border-border text-text-tertiary'
                }`}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-mono ${s.done ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {step === 'idle' && (
            <Button onClick={runTest} className="w-full">
              {wallet.connected
                ? `Pay & Test (${apiItem.price} USDC)`
                : `Test via Agent Wallet`
              }
            </Button>
          )}

          {stepLabel && (
            <div className="flex items-center gap-3 py-3">
              <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spinner" />
              <span className="text-[10px] font-mono text-text-secondary">{stepLabel}</span>
            </div>
          )}

          {(step === 'done' || step === 'error') && (
            <Button onClick={runTest} variant="secondary" className="w-full">
              Run Again
            </Button>
          )}
        </div>

        {/* Right: Response */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em]">Response</span>
            {step === 'done' && (
              <div className="flex items-center gap-3">
                <Badge variant="success">200 OK</Badge>
                <span className="text-[9px] font-mono text-text-tertiary">{elapsed}ms</span>
              </div>
            )}
            {step === 'error' && (
              <Badge variant="error">Error</Badge>
            )}
          </div>

          {step === 'idle' && (
            <div className="bg-bg-primary border border-border p-8 text-center">
              <p className="text-xs font-mono text-text-tertiary">Run a test to see the response</p>
            </div>
          )}

          {stepLabel && (
            <div className="bg-bg-primary border border-border p-8 text-center">
              <div className="w-5 h-5 border border-accent border-t-transparent rounded-full animate-spinner mx-auto mb-3" />
              <p className="text-[10px] font-mono text-text-tertiary">{stepLabel}</p>
            </div>
          )}

          {step === 'done' && result && (
            <div className="space-y-3">
              {result.txHash && (
                <div className="bg-bg-primary border border-border p-3">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.15em]">Tx Hash</span>
                  <p className="text-[10px] font-mono text-accent mt-1 break-all">{result.txHash}</p>
                </div>
              )}
              <div className="bg-bg-primary border border-border p-4 max-h-72 overflow-y-auto">
                <pre className="text-[11px] font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(result.apiResponse ?? result, null, 2)?.slice(0, 3000)}
                </pre>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="bg-bg-primary border border-status-error/20 p-4">
              <p className="text-xs font-mono text-status-error">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function GatewayPanel() {
  const wallet = useWallet();
  const [baseUrl, setBaseUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [testApi, setTestApi] = useState<RegisteredAPI | null>(null);
  const [apis, setApis] = useState<RegisteredAPI[]>([]);

  // Fetch user's APIs from server
  useEffect(() => {
    async function fetchApis() {
      try {
        const serverApis = await api.getApis(wallet.publicKey || undefined) as RegisteredAPI[];
        setApis(serverApis || []);
      } catch {
        setApis([]);
      }
    }
    fetchApis();
  }, [wallet.publicKey]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRegisterError('');
    try {
      let registered: any;
      if (wallet.connected && wallet.publicKey) {
        try {
          const { unsignedTxXdr } = await api.prepareRegisterApi({
            callerPublicKey: wallet.publicKey,
            baseUrl,
            slug,
            price: parseFloat(price),
            receiverAddress: receiverAddress || undefined,
          });
          const signedTxXdr = await freighter.signTx(unsignedTxXdr);
          registered = await api.submitRegisterApi({
            signedTxXdr,
            baseUrl,
            slug,
            price: parseFloat(price),
            receiverAddress: receiverAddress || undefined,
            owner: wallet.publicKey,
          });
        } catch (sorobanErr: any) {
          console.warn('Soroban registration failed, using direct:', sorobanErr.message);
          registered = await api.registerApi({
            baseUrl,
            slug,
            price: parseFloat(price),
            receiverAddress: receiverAddress || undefined,
            owner: wallet.publicKey || undefined,
          });
        }
      } else {
        registered = await api.registerApi({
          baseUrl,
          slug,
          price: parseFloat(price),
          receiverAddress: receiverAddress || undefined,
          owner: undefined,
        });
      }

      // Update state
      if (registered) {
        const updated = [...apis.filter(a => a.id !== registered.id), registered];
        setApis(updated);
      }

      setBaseUrl('');
      setSlug('');
      setPrice('');
      setReceiverAddress('');
    } catch (err: any) {
      setRegisterError(err.message || 'Registration failed');
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    try {
      if (wallet.connected && wallet.publicKey) {
        try {
          const { unsignedTxXdr } = await api.prepareRemoveApi(id, wallet.publicKey);
          const signedTxXdr = await freighter.signTx(unsignedTxXdr);
          await api.submitRemoveApi(id, signedTxXdr);
        } catch {
          await api.removeApi(id);
        }
      } else {
        await api.removeApi(id);
      }
    } catch {
      // Backend may not have this API (e.g. server restarted, in-memory store cleared)
    }

    // Update state
    const updated = apis.filter(a => a.id !== id);
    setApis(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">API Gateway</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">Wrap any REST API into a payment-required x402 endpoint</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-status-success" />
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.15em]">Stellar Testnet</span>
        </div>
      </div>

      {/* Register Form — card layout */}
      <form onSubmit={handleRegister} className="border border-border bg-bg-secondary">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">Register New API</span>
          {wallet.connected && (
            <span className="text-[9px] font-mono text-text-tertiary">Signing as {wallet.publicKey!.slice(0, 6)}...{wallet.publicKey!.slice(-4)}</span>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <Input label="Base URL" placeholder="https://api.example.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required />
            </div>
            <div className="md:col-span-3">
              <Input label="Slug" placeholder="coingecko" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <Input label="Price (USDC)" type="number" step="0.001" min="0.001" placeholder="0.05" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" loading={submitting} className="w-full">Wrap API</Button>
            </div>
          </div>
          <Input
            label="Receiver Address (defaults to agent wallet)"
            placeholder="GABCDEF...XYZ"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          {registerError && (
            <p className="text-[10px] font-mono text-status-error mt-1">{registerError}</p>
          )}
        </div>
      </form>

      {/* Registered APIs */}
      <div className="border border-border bg-bg-secondary overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">
            Registered APIs
          </span>
          <span className="text-[9px] font-mono text-text-tertiary">{apis?.length ?? 0} total</span>
        </div>

        {(!apis || apis.length === 0) ? (
          <div className="p-12 text-center">
            <p className="text-xs font-mono text-text-tertiary mb-1">No APIs registered yet</p>
            <p className="text-[10px] font-mono text-text-tertiary">Register an API above to get a payment-wrapped x402 endpoint</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {apis.map((item) => (
              <div key={item.id} className="group">
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-[80ms]">
                  {/* Status */}
                  <StatusDot status={item.status === 'active' ? 'active' : 'inactive'} />

                  {/* Endpoint info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-medium text-text-primary">{item.name}</span>
                      <span className="text-[10px] font-mono text-accent">/x402/{item.slug}/*</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-text-tertiary">
                      <span>{item.price} USDC/call</span>
                      <span>{item.callCount} calls</span>
                      <span>{(item.totalRevenue ?? 0).toFixed(4)} USDC earned</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={testApi?.id === item.id ? 'primary' : 'secondary'}
                      onClick={() => setTestApi(testApi?.id === item.id ? null : item)}
                    >
                      {testApi?.id === item.id ? 'Close' : 'Try It'}
                    </Button>
                    {(!item.owner || item.owner === wallet.publicKey) && (
                      <Button size="sm" variant="danger" onClick={() => handleRemove(item.id)}>Remove</Button>
                    )}
                  </div>
                </div>

                {/* Inline test panel */}
                {testApi?.id === item.id && (
                  <div className="border-t border-border">
                    <ApiTestPanel apiItem={item} onClose={() => setTestApi(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
