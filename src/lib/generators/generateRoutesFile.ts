import * as path from 'path';
import { writeFileToWorkspace } from '../writeFile';

export async function generateRoutesFile(
  basePath: string,
  camel: string,
  kebab: string
) {
  const content = `
import { Routes } from '@angular/router';

export const ${camel}Routes: Routes = [
  { path: '', redirectTo: 'table', pathMatch: 'full' },
  {
    path: 'table',
    loadComponent: () =>
      import('./${kebab}-table.component').then(m => m.${capitalize(camel)}TableComponent),
    data: { breadcrumb: 'Table' }
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./${kebab}-form.component').then(m => m.${capitalize(camel)}FormComponent),
    data: { breadcrumb: 'Form' }
  }
];`.trim();

  await writeFileToWorkspace(
    path.join(basePath, `${kebab}.routes.ts`),
    content
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}