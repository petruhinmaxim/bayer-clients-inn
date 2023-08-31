export function makeQueryParams(count: number, start: number = 1): string {
  return Array(count).fill(start).map((x, i) => `$${x + i}`).join(', ')
}

export function makeChunks<T>(params: T[], chunkSize: number = 1024): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < params.length; i += chunkSize) {
    chunks.push(params.slice(i, i + chunkSize))
  }
  return chunks
}

