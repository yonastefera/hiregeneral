export class InFlightCoalescer<T> {
  private readonly requests = new Map<string, Promise<T>>();

  async run(key: string, load: () => Promise<T>) {
    const existing = this.requests.get(key);
    if (existing) return { owner: false, value: await existing };

    const request = Promise.resolve().then(load);
    this.requests.set(key, request);

    try {
      return { owner: true, value: await request };
    } finally {
      if (this.requests.get(key) === request) this.requests.delete(key);
    }
  }
}
