import * as vscode from 'vscode';

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_ ]+./g, (s) => s.charAt(s.length - 1).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[A-Z]/, (s) => s.toLowerCase());
}

export function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function getApiUrl(): string {
  const config = vscode.workspace.getConfiguration("primeGen");
  return config.get<string>("apiUrl") || "http://localhost:8000";
}
