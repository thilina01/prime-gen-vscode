import * as path from 'path';
import { writeFileToWorkspace } from '../writeFile';

export async function generateFormComponentTs(
  fields: any[],
  basePath: string,
  pascal: string,
  kebab: string,
  camel: string
) {
  const formGroupLines = fields
    .map((field) => `      ${field.formControlName}: new FormControl('', []),`)
    .join('\n');

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
import { InputNumberModule } from 'primeng/inputnumber';

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
    TextareaModule,
    InputNumberModule
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
}`.trim();

  await writeFileToWorkspace(
    path.join(basePath, `${kebab}-form.component.ts`),
    content
  );
}