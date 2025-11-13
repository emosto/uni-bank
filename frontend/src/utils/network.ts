export interface NetworkMetadata {
  name: string;
  explorerBaseUrl?: string;
}

export const NETWORK_METADATA: Record<number, NetworkMetadata> = {
  1: { name: 'Ethereum Mainnet', explorerBaseUrl: 'https://etherscan.io' },
  5: { name: 'Goerli Testnet', explorerBaseUrl: 'https://goerli.etherscan.io' },
  11155111: { name: 'Sepolia Testnet', explorerBaseUrl: 'https://sepolia.etherscan.io' },
  10: { name: 'Optimism', explorerBaseUrl: 'https://optimistic.etherscan.io' },
  137: { name: 'Polygon', explorerBaseUrl: 'https://polygonscan.com' },
  8453: { name: 'Base', explorerBaseUrl: 'https://basescan.org' },
  42161: { name: 'Arbitrum One', explorerBaseUrl: 'https://arbiscan.io' },
  31337: { name: 'Hardhat Local', explorerBaseUrl: undefined },
  1337: { name: 'Localhost', explorerBaseUrl: undefined },
};

export function explorerTxUrl(chainId: number, txHash: string): string | null {
  const network = NETWORK_METADATA[chainId];
  if (!network?.explorerBaseUrl) return null;
  return `${network.explorerBaseUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(chainId: number, address: string): string | null {
  const network = NETWORK_METADATA[chainId];
  if (!network?.explorerBaseUrl) return null;
  return `${network.explorerBaseUrl}/address/${address}`;
}

export function getNetworkName(chainId: number): string {
  return NETWORK_METADATA[chainId]?.name || `Chain ID ${chainId}`;
}
