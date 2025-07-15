import * as vscode from 'vscode';
import * as path from 'path';

export function showSuggestedMenuEntry(appKebab: string, title: string) {
  const output = vscode.window.createOutputChannel('PrimeGen');
  const menuSnippet = `{
  label: '${title}',
  icon: 'pi pi-fw pi-file',
  items: [
    { label: 'Table', icon: 'pi pi-fw pi-list', routerLink: ['/apps/${appKebab}/table'] },
    { label: 'Form',  icon: 'pi pi-fw pi-pencil', routerLink: ['/apps/${appKebab}/form']  }
  ]
}`;

  output.appendLine(
    `💡 Paste this into your desired location in:\n  src/app/layout/components/app.menu.ts\n`
  );
  output.appendLine(menuSnippet);
  output.show(true);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const filePath = path.join(
      workspaceFolders[0].uri.fsPath,
      'src',
      'app',
      'layout',
      'components',
      'app.menu.ts'
    );
    const fileUri = vscode.Uri.file(filePath);

    vscode.workspace.openTextDocument(fileUri).then(
      (doc) => {
        vscode.window.showTextDocument(doc, { preview: false });
      },
      (err) => {
        vscode.window.showWarningMessage(
          `⚠️ Unable to open app.menu.ts: ${err.message}`
        );
      }
    );
  }
}