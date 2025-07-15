import * as path from 'path';
import { writeFileToWorkspace } from '../writeFile';

export async function generateInterfaceFile(
  fields: any[],
  basePath: string,
  pascal: string,
  kebab: string
) {
  const lines = fields.map((field) => {
    const name = field.formControlName;
    const type = field.type === 'number' ? 'number' : 'string';
    return `  ${name}: ${type};`;
  });

  const content = `export interface ${pascal} {
  id: number;
${lines.join('\n')}
}`;
  await writeFileToWorkspace(path.join(basePath, `${kebab}.model.ts`), content);
}
