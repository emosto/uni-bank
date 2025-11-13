import { ethers } from 'ethers';
import { format, formatDistanceToNow } from 'date-fns';

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint | string | number, decimals: number = 4): string {
  try {
    const value = ethers.formatEther(wei);
    const num = parseFloat(value);
    return num.toFixed(decimals);
  } catch {
    return '0.0000';
  }
}

export function parseEtherSafe(ethString: string): bigint {
  try {
    return ethers.parseEther(ethString);
  } catch {
    return 0n;
  }
}

export function formatTimestamp(timestamp: number | bigint, relative: boolean = false): string {
  try {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(ts * 1000);
    if (relative) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Invalid date';
  }
}

export function bpToPercent(bp: number | bigint): string {
  try {
    const bpNum = typeof bp === 'bigint' ? Number(bp) : bp;
    return (bpNum / 100).toFixed(2) + '%';
  } catch {
    return '0.00%';
  }
}

export function calculateTimeRemaining(timestamp: number | bigint, lockMinutes: number | bigint): {
  remaining: number;
  humanReadable: string;
  isMatured: boolean;
} {
  try {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const lockMins = typeof lockMinutes === 'bigint' ? Number(lockMinutes) : lockMinutes;
    const maturityTime = ts + lockMins * 60;
    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, maturityTime - nowSec);
    const isMatured = remaining === 0;

    if (isMatured) {
      return { remaining: 0, humanReadable: 'Matured', isMatured: true };
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return {
        remaining,
        humanReadable: `${hours}h ${mins}m`,
        isMatured: false,
      };
    }

    return {
      remaining,
      humanReadable: `${minutes}m ${seconds}s`,
      isMatured: false,
    };
  } catch {
    return { remaining: 0, humanReadable: 'Unknown', isMatured: false };
  }
}

export function formatBigInt(value: bigint | undefined): string {
  if (value === undefined) return '0';
  try {
    return value.toString();
  } catch {
    return '0';
  }
}
