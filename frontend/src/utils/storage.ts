const PREFIX = 'unibank:';

export function getItem<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(PREFIX + key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue ?? null;
  }
}

export function setItem(key: string, value: any): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

export function clear(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}
