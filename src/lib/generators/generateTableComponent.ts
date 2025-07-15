import * as path from 'path';
import { writeFileToWorkspace } from '../writeFile';

export async function generateTableComponent(
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
          ${fields.map((f) => `<th>${f.label}</th>`).join("\n")}
          <th>Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-item>
        <tr>
          ${fields.map((f) => `<td>{{ item.${f.formControlName} }}</td>`).join("\n")}
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
${fields.map((f) => `      ${f.formControlName}: '${f.formControlName}_val' + nextId`).join(",\n")}
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
}`.trim();

  const tableScss = `/* styles for ${kebab} table */`;

  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.html`), tableHtml);
  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.ts`), tableTs);
  await writeFileToWorkspace(path.join(basePath, `${kebab}-table.component.scss`), tableScss);
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