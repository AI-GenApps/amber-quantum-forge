export const MAX_PROVIDER_RESPONSE_BYTES = 64 * 1024;

export type ProviderBodyErrorFactory = (code: string, retryable: boolean) => Error;

export async function readProviderResponse(
  response: Response,
  controller: AbortController,
  deadline: number,
  createError: ProviderBodyErrorFactory,
): Promise<string> {
  const length = response.headers.get("content-length");
  if (length && Number(length) > MAX_PROVIDER_RESPONSE_BYTES) {
    controller.abort();
    if (response.body) await response.body.cancel().catch(() => undefined);
    throw createError("provider_response_too_large", false);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        controller.abort();
        throw createError("provider_timeout", true);
      }
      const read = await readChunk(reader, remaining, controller, createError);
      if (read.done) break;
      const chunk = read.value;
      size += chunk.byteLength;
      if (size > MAX_PROVIDER_RESPONSE_BYTES) {
        controller.abort();
        throw createError("provider_response_too_large", false);
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
  controller: AbortController,
  createError: ProviderBodyErrorFactory,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(createError("provider_timeout", true));
      }, timeoutMs);
    });
    return await Promise.race([reader.read(), timeout]);
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
