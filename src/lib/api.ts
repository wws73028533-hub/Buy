async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? ((await response.json()) as T | { message?: string }) : null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && payload.message
        ? String(payload.message)
        : `请求失败（${response.status}）`

    throw new Error(message)
  }

  return payload as T
}

export async function apiGet<T>(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  })

  return parseResponse<T>(response)
}

export async function apiPost<T>(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  return parseResponse<T>(response)
}

export async function apiPut<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return parseResponse<T>(response)
}

export async function apiDelete<T>(url: string) {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return parseResponse<T>(response)
}
