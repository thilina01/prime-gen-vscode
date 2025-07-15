import * as path from 'path';
import { writeFileToWorkspace } from '../writeFile';

export async function generateServiceFile(
  basePath: string,
  pascal: string,
  kebab: string
) {
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
}`.trim();

  await writeFileToWorkspace(
    path.join(basePath, `${kebab}.service.ts`),
    content
  );
}