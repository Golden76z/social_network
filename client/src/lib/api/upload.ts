const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8080';

let CSRF_TOKEN: string | null = null;

async function ensureCsrfToken(): Promise<void> {
  if (CSRF_TOKEN) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/post`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    CSRF_TOKEN = res.headers.get('X-CSRF-Token');
  } catch {
    // ignore
  }
}

export async function uploadAvatar(file: Blob): Promise<{ url: string }> {
  await ensureCsrfToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload avatar failed');
  }
  return res.json();
}

export async function uploadPostImage(file: Blob): Promise<{ url: string }> {
  await ensureCsrfToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload/post-image`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload post image failed');
  }
  return res.json();
}
