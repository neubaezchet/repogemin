const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://web-production-95ed.up.railway.app';

// ✅ REQUEST DEDUPLICATION - Avoid duplicate requests for same resource
class RequestDeduplicator {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  async fetch(url, options = {}) {
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    // If request is pending, wait for it (deduplication)
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey);
    }

    // If cached and not expired, return from cache (1 minute TTL)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }

    // Make the request
    const promise = fetch(url, options)
      .then(response => {
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        // Store in cache
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pending.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pending.delete(cacheKey);
        throw error;
      });

    // Mark as pending
    this.pending.set(cacheKey, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }
}

// Global deduplicator instance
const dedup = new RequestDeduplicator();

export const buscarEmpleado = async (cedula) => {
  try {
    const data = await dedup.fetch(`${API_BASE}/empleados/${cedula}`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Error consultando empleado");
  }
};