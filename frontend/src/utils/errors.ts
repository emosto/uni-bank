export function parseEthersError(error: any): string {
  // User rejected
  if (error?.code === 'ACTION_REJECTED' || error?.code === 4001) {
    return 'Transaction rejected by user';
  }

  // Insufficient funds
  if (error?.code === 'INSUFFICIENT_FUNDS' || error?.message?.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }

  // Network/connection errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
    return 'Network error. Please check your connection';
  }

  // Contract revert with reason
  if (error?.reason) {
    return error.reason;
  }

  // Try to extract error from nested structure
  if (error?.info?.error?.message) {
    return error.info.error.message;
  }

  // Short message from ethers v6
  if (error?.shortMessage) {
    return error.shortMessage;
  }

  // Generic message
  if (error?.message) {
    // Clean up technical details
    const msg = error.message;
    if (msg.includes('execution reverted')) {
      const match = msg.match(/execution reverted:?\s*(.+?)(?:\s*\(|$)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      return 'Transaction failed: contract reverted';
    }
    return msg;
  }

  return 'An unknown error occurred';
}
