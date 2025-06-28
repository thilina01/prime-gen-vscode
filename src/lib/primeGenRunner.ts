import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import { Project, SyntaxKind } from 'ts-morph';

const BACKEND_API =
  process.env.PRIME_AGENT_API_URL || "http://192.168.1.53:8082/api";

function toCamelCase(str: string): string {
  return str
    .replace(/[-_ ]+./g, (s) => s.charAt(s.length - 1).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[A-Z]/, (s) => s.toLowerCase());
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

async function extractFormFieldsToJson(htmlContent: string): Promise<any> {
  const res = await fetch(`${BACKEND_API}/extract-form-fields`, {
    method: "POST",
    headers: { "Content-Type": "text/html" },
    body: htmlContent,
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function generateTailwindHTML(
  formJson: any,
  title: string
): Promise<string> {
  const res = await fetch(
    `${BACKEND_API}/generate-tailwind-form?title=${encodeURIComponent(title)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formJson),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  let html = await res.text();

  // Clean up unwanted HTML comments
  html = html.replace(/<!--.*?-->/gs, "");
  const start = html.indexOf("<div ");
  const end = html.lastIndexOf("</div>");

  return start !== -1 && end !== -1
    ? html.substring(start, end + 6).trim()
    : html.trim();
}

async function writeFileToWorkspace(
  filePath: string,
  content: string
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content.trimStart(), "utf-8");
}

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
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const basePath = path.join(workspaceRoot, 'src', 'app', 'apps', kebab);
  progress?.report({ message: '📁 Creating target folder...' });
  await fs.mkdir(basePath, { recursive: true });

  progress?.report({ message: '📖 Reading selected HTML form...' });
  const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');

  progress?.report({ message: '🔍 Extracting form fields from HTML...' });
  const formJson = await extractFormFieldsToJson(htmlContent);

  progress?.report({ message: '🎨 Generating Tailwind HTML layout...' });
  const generatedHtml = await generateTailwindHTML(formJson, title);

  const formFilePath = path.join(basePath, `${kebab}-form.component.html`);
  progress?.report({ message: '📝 Writing form.component.html...' });
  await writeFileToWorkspace(formFilePath, generatedHtml);

  progress?.report({ message: '🧠 Creating model interface...' });
  await generateInterfaceFile(formJson, basePath, pascal, kebab);

  progress?.report({ message: '⚙️ Generating form.component.ts...' });
  await generateFormComponentTs(formJson, basePath, pascal, kebab, camel);

  progress?.report({ message: '📦 Creating service.ts and routes.ts...' });
  await generateServiceFile(basePath, pascal, kebab);
  await generateRoutesFile(basePath, camel, kebab);

  progress?.report({ message: '📊 Generating table.component files...' });
  await generateTableComponent(basePath, pascal, camel, kebab, title, formJson);

  progress?.report({ message: '🧭 Updating apps.routes.ts...' });
  await updateAppsRoutesTs(kebab, camel, title, workspaceRoot);

  progress?.report({ message: '📋 Showing suggested menu entry...' });
  showSuggestedMenuEntry(kebab, title);

  progress?.report({ message: '🎨 Writing SCSS placeholder...' });
  await writeFileToWorkspace(
    path.join(basePath, `${kebab}-form.component.scss`),
    `/* styles for ${kebab} form */`
  );

  vscode.window.showInformationMessage(`✅ Tailwind form HTML generated: ${formFilePath}`);
}

async function generateInterfaceFile(
  fields: any[],
  basePath: string,
  pascal: string,
  kebab: string
) {
  const lines = fields.map((field) => {
    const name = field.formControlName;
    const type = field.type === "number" ? "number" : "string";
    return `  ${name}: ${type};`;
  });

  const content = `export interface ${pascal} {\n  id: number;\n${lines.join(
    "\n"
  )}\n}\n`;
  await writeFileToWorkspace(path.join(basePath, `${kebab}.model.ts`), content);
}

async function generateFormComponentTs(
  fields: any[],
  basePath: string,
  pascal: string,
  kebab: string,
  camel: string
) {
  const formGroupLines = fields
    .map((field) => {
      return `      ${field.formControlName}: new FormControl('', []),`;
    })
    .join("\n");

  const content = `
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ${pascal}Service } from './${kebab}.service';
import { ${pascal} } from './${kebab}.model';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-${kebab}-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    RippleModule,
    FluidModule,
    SelectModule,
    FormsModule,
    TextareaModule
  ],
  templateUrl: './${kebab}-form.component.html',
  styleUrls: ['./${kebab}-form.component.scss']
})
export class ${pascal}FormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private ${camel}Service: ${pascal}Service) {}

  ngOnInit(): void {
    this.form = this.fb.group({
${formGroupLines}
    });

    this.${camel}Service.selectedItem$.subscribe((item: ${pascal} | null) => {
      if (item) this.form.patchValue(item);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      console.log('Submitted:', formData);
      this.${camel}Service.setSelectedItem(null);
    }
  }
}
`.trim();

  await writeFileToWorkspace(
    path.join(basePath, `${kebab}-form.component.ts`),
    content
  );
}

async function generateServiceFile(basePath: string, pascal: string, kebab: string) {
  const content = `
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ${pascal} } from './${kebab}.model';

@Injectable({ providedIn: 'root' })
export class ${pascal}Service {
  private _selectedItem = new BehaviorSubject<${pascal} | null>(null);
  selectedItem$ = this._selectedItem.asObservable();

  setSelectedItem(item: ${pascal} | null): void {
    this._selectedItem.next(item);
  }
}
`.trim();

  await writeFileToWorkspace(path.join(basePath, `${kebab}.service.ts`), content);
}

async function generateRoutesFile(basePath: string, camel: string, kebab: string) {
  const content = `
import { Routes } from '@angular/router';

export const ${camel}Routes: Routes = [
  { path: '', redirectTo: 'table', pathMatch: 'full' },
  {
    path: 'table',
    loadComponent: () =>
      import('./${kebab}-table.component').then(m => m.${camel.charAt(0).toUpperCase() + camel.slice(1)}TableComponent),
    data: { breadcrumb: 'Table' }
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./${kebab}-form.component').then(m => m.${camel.charAt(0).toUpperCase() + camel.slice(1)}FormComponent),
    data: { breadcrumb: 'Form' }
  }
];
`.trim();

  await writeFileToWorkspace(path.join(basePath, `${kebab}.routes.ts`), content);
}

async function generateTableComponent(
  basePath: string,
  pascal: string,
  camel: string,
  kebab: string,
  title: string,
  fields: any[]
) {
  const tableHtml = `
<div class="card">
  <div class="flex justify-between items-center mb-8">
    <span class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
      ${title} Table
    </span>
    <button
      pButton
      pRipple
      class="font-semibold"
      icon="pi pi-plus"
      label="Add New"
      (click)="addItem()"
    ></button>
  </div>

  <div class="table-responsive">
    <p-table [value]="items">
      <ng-template pTemplate="header">
        <tr>
          ${fields.map(f => `<th>${f.label}</th>`).join('\n')}
          <th>Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-item>
        <tr>
          ${fields.map(f => `<td>{{ item.${f.formControlName} }}</td>`).join('\n')}
          <td>
            <div class="flex gap-2">
              <button pButton icon="pi pi-pencil" class="p-button-warning p-button-sm" (click)="editItem(item.id)"></button>
              <button pButton icon="pi pi-trash" class="p-button-danger p-button-sm" (click)="deleteItem(item.id)"></button>
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>
</div>
`.trim();

  const tableTs = `
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ${pascal} } from './${kebab}.model';
import { ${pascal}Service } from './${kebab}.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-${kebab}-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule, RippleModule],
  templateUrl: './${kebab}-table.component.html',
  styleUrls: ['./${kebab}-table.component.scss']
})
export class ${pascal}TableComponent implements OnInit {
  items: ${pascal}[] = [];

  constructor(private router: Router, private route: ActivatedRoute, private ${camel}Service: ${pascal}Service) {}

  ngOnInit(): void {
    this.items = ${JSON.stringify(generateMockItems(fields), null, 2)};
  }

  addItem(): void {
    const nextId = this.items.length + 1;
    this.items = [...this.items, {
      id: nextId,
${fields.map((f, i) => `      ${f.formControlName}: '${f.formControlName}_val' + nextId`).join(',\n')}
    }];
  }

  editItem(id: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      this.${camel}Service.setSelectedItem(item);
      this.router.navigate(['../form'], { relativeTo: this.route });
    }
  }

  deleteItem(id: number): void {
    this.items = this.items.filter(item => item.id !== id);
  }
}
`.trim();

  const tableScss = `/* styles for ${kebab} table */`;

  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.html`), tableHtml);
  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.ts`), tableTs);
  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.scss`), tableScss);
}

async function updateAppsRoutesTs(appKebab: string, appCamel: string, appTitle: string, workspaceRoot: string) {
  const filePath = path.join(workspaceRoot, 'src', 'app', 'apps', 'apps.routes.ts');
  const project = new Project();
  let sourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch (error) {
    vscode.window.showWarningMessage(`apps.routes.ts not found at ${filePath}. Skipping route injection.`);
    return;
  }

  const routesArray = sourceFile.getFirstDescendantByKind(SyntaxKind.ArrayLiteralExpression);

  if (!routesArray) {
    vscode.window.showWarningMessage('Could not locate routes array in apps.routes.ts');
    return;
  }

  const alreadyExists = routesArray.getElements().some(el => el.getText().includes(`path: '${appKebab}'`));

  if (alreadyExists) {
    vscode.window.showInformationMessage(`⚠️ Route for '${appKebab}' already exists in apps.routes.ts`);
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
  vscode.window.showInformationMessage(`✅ apps.routes.ts updated with '${appKebab}' route`);
}

function generateMockItems(fields: any[]): any[] {
  const items = [];
  for (let i = 1; i <= 3; i++) {
    const item: any = { id: i };
    for (const field of fields) {
      item[field.formControlName] = `${field.formControlName}_val${i}`;
    }
    items.push(item);
  }
  return items;
}

function showSuggestedMenuEntry(appKebab: string, title: string) {
  const output = vscode.window.createOutputChannel('PrimeGen');
  output.appendLine(`💡 Paste this into your desired location in app.menu.ts:\n`);
  output.appendLine(`{
  label: '${title}',
  icon: 'pi pi-fw pi-file',
  items: [
    { label: 'Table', icon: 'pi pi-fw pi-list', routerLink: ['/apps/${appKebab}/table'] },
    { label: 'Form',  icon: 'pi pi-fw pi-pencil', routerLink: ['/apps/${appKebab}/form']  }
  ]
}`);
  output.show(true);
}
