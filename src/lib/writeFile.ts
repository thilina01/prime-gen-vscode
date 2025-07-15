import * as fs from 'fs/promises';
import * as path from 'path';

export async function writeFileToWorkspace(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content.trimStart(), 'utf-8');
}
