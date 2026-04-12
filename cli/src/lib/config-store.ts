import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const CONFIG_DIR = path.join(os.homedir(), '.ero');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface EroConfig {
  apiUrl: string;
  publicKey: string;
  encryptedSecret?: string;   // AES-256-GCM encrypted secret key
  initialized?: boolean;
}

const DEFAULTS: EroConfig = {
  apiUrl: 'https://ero-72v4.onrender.com',
  publicKey: '',
};

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): EroConfig {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULTS };
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config: EroConfig) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function isInitialized(): boolean {
  const cfg = loadConfig();
  return !!(cfg.initialized && cfg.publicKey && cfg.encryptedSecret);
}

export function requireInit(): EroConfig {
  const cfg = loadConfig();
  if (!cfg.initialized || !cfg.publicKey || !cfg.encryptedSecret) {
    console.error('Not initialized. Run: ero init');
    process.exit(1);
  }
  return cfg;
}

export function requirePublicKey(): string {
  return requireInit().publicKey;
}

// --- Encryption helpers (AES-256-GCM) ---
// Derive a machine-specific key from hostname + username + config dir path
// This is NOT a password — it's a deterministic key that ties the secret to this machine.
function deriveKey(): Buffer {
  const material = `${os.hostname()}:${os.userInfo().username}:${CONFIG_DIR}`;
  return crypto.createHash('sha256').update(material).digest();
}

export function encryptSecret(secretKey: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secretKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv + tag + ciphertext)
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(encryptedBase64: string): string {
  const key = deriveKey();
  const buf = Buffer.from(encryptedBase64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
