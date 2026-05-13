export interface Transport {
  invoke<T>(method: string, ...args: unknown[]): Promise<T>
}
