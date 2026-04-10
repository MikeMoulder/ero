import freighterApi from '@stellar/freighter-api';

export async function checkFreighterAvailable(): Promise<boolean> {
  try {
    const result = await freighterApi.isConnected();
    return typeof result === 'boolean' ? result : result.isConnected;
  } catch {
    return false;
  }
}

export async function connectWallet(): Promise<string> {
  const result = await freighterApi.isConnected();
  const connected = typeof result === 'boolean' ? result : result.isConnected;
  if (!connected) {
    throw new Error('Freighter extension is not installed. Please install it from freighter.app');
  }

  await freighterApi.setAllowed();
  const { address } = await freighterApi.getAddress();
  if (!address) {
    throw new Error('No address returned from Freighter. Please unlock your wallet.');
  }
  return address;
}

export async function getWalletPublicKey(): Promise<string> {
  const { address } = await freighterApi.getAddress();
  return address;
}

export async function signTx(txXdr: string): Promise<string> {
  const { signedTxXdr } = await freighterApi.signTransaction(txXdr, {
    networkPassphrase: 'Test SDF Network ; September 2015',
  });
  return signedTxXdr;
}
