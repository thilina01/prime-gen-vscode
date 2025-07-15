import { getApiUrl } from './utils';

const BACKEND_API = getApiUrl();

export async function extractFormFieldsToJson(htmlContent: string): Promise<any> {
  const res = await fetch(`${BACKEND_API}/extract-form-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/html' },
    body: htmlContent,
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function generateTailwindHTML(formJson: any, title: string): Promise<string> {
  const res = await fetch(
    `${BACKEND_API}/generate-tailwind-form?title=${encodeURIComponent(title)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formJson),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  let html = await res.text();

  // Clean up unwanted HTML comments
  html = html.replace(/<!--.*?-->/gs, '');
  const start = html.indexOf('<div ');
  const end = html.lastIndexOf('</div>');

  return start !== -1 && end !== -1
    ? html.substring(start, end + 6).trim()
    : html.trim();
}
