import * as StellarSdk from '@stellar/stellar-sdk';
import { config } from '../config';
import { events } from './events.service';
import { RegisteredAPI } from '../types';

class SorobanService {
  private rpcServer: StellarSdk.SorobanRpc.Server;
  private contractId: string;
  private networkPassphrase: string;

  constructor() {
    this.rpcServer = new StellarSdk.SorobanRpc.Server(config.soroban.rpcUrl);
    this.contractId = config.soroban.contractId;
    this.networkPassphrase = StellarSdk.Networks.TESTNET;
  }

  isConfigured(): boolean {
    return !!this.contractId;
  }

  // === Read-only: get all APIs from contract ===

  async getAllApis(): Promise<RegisteredAPI[]> {
    if (!this.isConfigured()) return [];

    try {
      const contract = new StellarSdk.Contract(this.contractId);
      const caller = StellarSdk.Keypair.random();
      const account = await this.rpcServer.getAccount(caller.publicKey()).catch(() => null);

      // Use a simulation-only call to read data without submitting
      // For read-only calls, we simulate a transaction
      const sourceAccount = account || new StellarSdk.Account(caller.publicKey(), '0');

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('get_all_apis'))
        .setTimeout(30)
        .build();

      const simResult = await this.rpcServer.simulateTransaction(tx);

      if (StellarSdk.SorobanRpc.Api.isSimulationError(simResult)) {
        console.warn('[Soroban] Simulation error reading APIs:', simResult.error);
        return [];
      }

      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResult)) {
        return [];
      }

      // Parse the result XDR into our RegisteredAPI format
      const resultValue = simResult.result?.retval;
      if (!resultValue) return [];

      return this.parseApiEntries(resultValue);
    } catch (err: any) {
      console.warn('[Soroban] Failed to read APIs from contract:', err.message);
      return [];
    }
  }

  // === Build unsigned TX for register_api ===

  async buildRegisterApiTx(
    callerPublicKey: string,
    baseUrl: string,
    slug: string,
    price: number,
    receiverAddress: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Soroban contract not configured');
    }

    const contract = new StellarSdk.Contract(this.contractId);
    const account = await this.rpcServer.getAccount(callerPublicKey);

    // Price in base units (1 USDC = 10_000_000 units on Stellar), stored as i128
    const priceUnits = Math.round(price * 10_000_000);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'register_api',
          StellarSdk.Address.fromString(callerPublicKey).toScVal(),
          StellarSdk.nativeToScVal(baseUrl, { type: 'string' }),
          StellarSdk.nativeToScVal(slug, { type: 'string' }),
          StellarSdk.nativeToScVal(priceUnits, { type: 'i128' }),
          StellarSdk.Address.fromString(receiverAddress).toScVal()
        )
      )
      .setTimeout(60)
      .build();

    // Simulate to get proper resource footprint
    const simResult = await this.rpcServer.simulateTransaction(tx);

    if (StellarSdk.SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Soroban simulation failed: ${simResult.error}`);
    }

    const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simResult).build();
    return preparedTx.toXDR();
  }

  // === Build unsigned TX for remove_api ===

  async buildRemoveApiTx(callerPublicKey: string, apiId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Soroban contract not configured');
    }

    const contract = new StellarSdk.Contract(this.contractId);
    const account = await this.rpcServer.getAccount(callerPublicKey);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'remove_api',
          StellarSdk.Address.fromString(callerPublicKey).toScVal(),
          StellarSdk.nativeToScVal(apiId, { type: 'string' })
        )
      )
      .setTimeout(60)
      .build();

    const simResult = await this.rpcServer.simulateTransaction(tx);

    if (StellarSdk.SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Soroban simulation failed: ${simResult.error}`);
    }

    const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simResult).build();
    return preparedTx.toXDR();
  }

  // === Submit a signed Soroban transaction ===

  async submitTransaction(signedTxXdr: string): Promise<string> {
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, this.networkPassphrase);
    const sendResult = await this.rpcServer.sendTransaction(tx);

    if (sendResult.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResult.errorResult?.toXDR('base64') || 'unknown'}`);
    }

    // Poll for completion
    let getResult: StellarSdk.SorobanRpc.Api.GetTransactionResponse;
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      getResult = await this.rpcServer.getTransaction(sendResult.hash);

      if (getResult.status === 'SUCCESS') {
        events.log('info', 'Soroban', `Contract TX confirmed: ${sendResult.hash}`);
        return sendResult.hash;
      }
      if (getResult.status === 'FAILED') {
        throw new Error(`Soroban transaction failed: ${sendResult.hash}`);
      }
      // status === 'NOT_FOUND' means still pending
    }

    throw new Error('Transaction timed out waiting for confirmation');
  }

  // === Parse Soroban ScVal into RegisteredAPI[] ===

  private parseApiEntries(scVal: StellarSdk.xdr.ScVal): RegisteredAPI[] {
    const apis: RegisteredAPI[] = [];

    try {
      // The return value is a Vec<ApiEntry> encoded as ScVal
      const vec = scVal.vec();
      if (!vec) return [];

      for (const entry of vec) {
        try {
          const fields = entry.map();
          if (!fields) continue;

          const api = this.parseApiEntry(fields);
          if (api) apis.push(api);
        } catch {
          // Try as struct (vec of field pairs)
          try {
            const structFields = entry.vec();
            if (structFields) {
              const api = this.parseApiEntryFromVec(structFields);
              if (api) apis.push(api);
            }
          } catch {
            continue;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Soroban] Failed to parse API entries:', err.message);
    }

    return apis;
  }

  private parseApiEntry(fields: StellarSdk.xdr.ScMapEntry[]): RegisteredAPI | null {
    const getField = (name: string): StellarSdk.xdr.ScVal | undefined => {
      const entry = fields.find(f => {
        const key = f.key();
        return key.sym()?.toString() === name;
      });
      return entry?.val();
    };

    const id = this.scValToString(getField('id'));
    const baseUrl = this.scValToString(getField('base_url'));
    const slug = this.scValToString(getField('slug'));
    const priceUnits = this.scValToI128(getField('price'));
    const receiverAddress = this.scValToAddress(getField('receiver_address'));
    const owner = this.scValToAddress(getField('owner'));
    const status = this.scValToU32(getField('status'));

    if (!id || !baseUrl || !slug) return null;

    return {
      id,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      baseUrl,
      slug,
      price: priceUnits / 10_000_000,
      receiverAddress: receiverAddress || '',
      owner: owner || '',
      status: status === 1 ? 'active' : 'inactive',
      callCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };
  }

  private parseApiEntryFromVec(fields: StellarSdk.xdr.ScVal[]): RegisteredAPI | null {
    // Soroban structs are sometimes encoded as ordered vec of values
    // Order from our contract: id, base_url, slug, price, receiver_address, owner, status, created_at
    if (fields.length < 7) return null;

    const id = this.scValToString(fields[0]);
    const baseUrl = this.scValToString(fields[1]);
    const slug = this.scValToString(fields[2]);
    const priceUnits = this.scValToI128(fields[3]);
    const receiverAddress = this.scValToAddress(fields[4]);
    const owner = this.scValToAddress(fields[5]);
    const status = this.scValToU32(fields[6]);

    if (!id || !baseUrl || !slug) return null;

    return {
      id,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      baseUrl,
      slug,
      price: priceUnits / 10_000_000,
      receiverAddress: receiverAddress || '',
      owner: owner || '',
      status: status === 1 ? 'active' : 'inactive',
      callCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };
  }

  // === ScVal helpers ===

  private scValToString(val?: StellarSdk.xdr.ScVal): string {
    if (!val) return '';
    try {
      return val.str().toString();
    } catch {
      try {
        return StellarSdk.scValToNative(val)?.toString() || '';
      } catch {
        return '';
      }
    }
  }

  private scValToAddress(val?: StellarSdk.xdr.ScVal): string {
    if (!val) return '';
    try {
      return StellarSdk.Address.fromScVal(val).toString();
    } catch {
      return '';
    }
  }

  private scValToU32(val?: StellarSdk.xdr.ScVal): number {
    if (!val) return 0;
    try {
      return val.u32();
    } catch {
      try {
        return Number(StellarSdk.scValToNative(val));
      } catch {
        return 0;
      }
    }
  }

  private scValToI128(val?: StellarSdk.xdr.ScVal): number {
    if (!val) return 0;
    try {
      return Number(StellarSdk.scValToNative(val));
    } catch {
      return 0;
    }
  }
}

export const sorobanService = new SorobanService();
