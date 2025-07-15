import * as path from 'path';
import * as vscode from 'vscode';
import { Project, SyntaxKind } from 'ts-morph';

export async function updateAppsRoutesTs(
  appKebab: string,
  appCamel: string,
  appTitle: string,
  workspaceRoot: string
) {
  const filePath = path.join(
    workspaceRoot,
    'src',
    'app',
    'apps',
    'apps.routes.ts'
  );
  const project = new Project();
  let sourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch (error) {
    vscode.window.showWarningMessage(
      `apps.routes.ts not found at ${filePath}. Skipping route injection.`
    );
    return;
  }

  const routesArray = sourceFile.getFirstDescendantByKind(
    SyntaxKind.ArrayLiteralExpression
  );

  if (!routesArray) {
    vscode.window.showWarningMessage(
      'Could not locate routes array in apps.routes.ts'
    );
    return;
  }

  const alreadyExists = routesArray
    .getElements()
    .some((el) => el.getText().includes(`path: '${appKebab}'`));

  if (alreadyExists) {
    vscode.window.showInformationMessage(
      `⚠️ Route for '${appKebab}' already exists in apps.routes.ts`
    );
    return;
  }

  const newRoute = `{
    path: '${appKebab}',
    data: { breadcrumb: '${appTitle}' },
    loadChildren: () =>
      import('@/apps/${appKebab}/${appKebab}.routes').then(m => m.${appCamel}Routes)
  }`;

  routesArray.addElement(newRoute);
  await sourceFile.save();
  vscode.window.showInformationMessage(
    `✅ apps.routes.ts updated with '${appKebab}' route`
  );
}