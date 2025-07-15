import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import { toCamelCase, toKebabCase } from './utils';
import { writeFileToWorkspace } from './writeFile';
import { extractFormFieldsToJson, generateTailwindHTML } from './primeGenApiClient';
import { generateInterfaceFile } from './generators/generateInterfaceFile';
import { generateFormComponentTs } from './generators/generateFormComponentTs';
import { generateServiceFile } from './generators/generateServiceFile';
import { generateRoutesFile } from './generators/generateRoutesFile';
import { generateTableComponent } from './generators/generateTableComponent';
import { updateAppsRoutesTs } from './generators/updateAppsRoutesTs';
import { showSuggestedMenuEntry } from './generators/showSuggestedMenuEntry';

export async function runPrimeGen(
  appName: string,
  htmlFilePath: string,
  workspaceRoot: string,
  progress?: vscode.Progress<{ message?: string }>
): Promise<void> {
  const camel = toCamelCase(appName);
  const kebab = toKebabCase(camel);
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
  const title = camel
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const basePath = path.join(workspaceRoot, "src", "app", "apps", kebab);
  progress?.report({ message: "📁 Creating target folder..." });
  await fs.mkdir(basePath, { recursive: true });

  progress?.report({ message: "📖 Reading selected HTML form..." });
  const htmlContent = await fs.readFile(htmlFilePath, "utf-8");

  progress?.report({ message: "🔍 Extracting form fields from HTML..." });
  const formJson = await extractFormFieldsToJson(htmlContent);

  progress?.report({ message: "🎨 Generating Tailwind HTML layout..." });
  const generatedHtml = await generateTailwindHTML(formJson, title);

  const formFilePath = path.join(basePath, `${kebab}-form.component.html`);
  progress?.report({ message: "📝 Writing form.component.html..." });
  await writeFileToWorkspace(formFilePath, generatedHtml);

  progress?.report({ message: "🧠 Creating model interface..." });
  await generateInterfaceFile(formJson, basePath, pascal, kebab);

  progress?.report({ message: "⚙️ Generating form.component.ts..." });
  await generateFormComponentTs(formJson, basePath, pascal, kebab, camel);

  progress?.report({ message: "📦 Creating service.ts and routes.ts..." });
  await generateServiceFile(basePath, pascal, kebab);
  await generateRoutesFile(basePath, camel, kebab);

  progress?.report({ message: "📊 Generating table.component files..." });
  await generateTableComponent(basePath, pascal, camel, kebab, title, formJson);

  progress?.report({ message: "🧭 Updating apps.routes.ts..." });
  await updateAppsRoutesTs(kebab, camel, title, workspaceRoot);

  progress?.report({ message: "📋 Showing suggested menu entry..." });
  showSuggestedMenuEntry(kebab, title);

  progress?.report({ message: "🎨 Writing SCSS placeholder..." });
  await writeFileToWorkspace(
    path.join(basePath, `${kebab}-form.component.scss`),
    `/* styles for ${kebab} form */`
  );

  vscode.window.showInformationMessage(
    `✅ Tailwind form HTML generated: ${formFilePath}`
  );
}
