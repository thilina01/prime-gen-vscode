import * as vscode from 'vscode';
import { runPrimeGen } from './lib/primeGenRunner';

export function activate(context: vscode.ExtensionContext) {
	console.log('✅ prime-gen-vscode extension is now active.');

	const disposable = vscode.commands.registerCommand('prime-gen.generateTailwindForm', async () => {
		try {
			const appName = await vscode.window.showInputBox({
				prompt: 'Enter the Angular component name (in CamelCase)',
				placeHolder: 'Example: MyNewComponent',
				ignoreFocusOut: true,
			});
			if (!appName) return;

			const htmlUris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectMany: false,
				openLabel: 'Select the HTML file',
				filters: { HTML: ['html'] },
			});
			if (!htmlUris || htmlUris.length === 0) return;

			const htmlFilePath = htmlUris[0].fsPath;
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('No workspace folder open.');
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;

			// 🔁 Show progress while generating files
			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Generating Angular module: ${appName}`,
					cancellable: false
				},
				async (progress) => {
					progress.report({ message: 'Starting...' });
					await runPrimeGen(appName, htmlFilePath, workspaceRoot, progress);
				}
			);

			vscode.window.showInformationMessage(`✅ Angular module "${appName}" generated successfully!`);

		} catch (error: any) {
			console.error('❌ Error:', error);
			vscode.window.showErrorMessage(`Prime Gen failed: ${error.message}`);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
