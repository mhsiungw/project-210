import process from 'node:process'

if (typeof process.pid !== 'number') {
  Object.defineProperty(process, 'pid', { value: 1, configurable: true })
}
