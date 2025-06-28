# Prime Gen VSCode Extension

🚀 **Prime Gen: Generate Angular Components with Tailwind & PrimeNG**

This VS Code extension helps you scaffold fully-styled Angular components (form + table + service + routes) using Tailwind CSS and PrimeNG, based on an existing HTML form file.

---

## ✨ Features

- 🧠 Extracts form fields from a selected `.html` file.
- 🎨 Generates Tailwind-based Angular form component.
- 📊 Generates table component with PrimeNG DataTable.
- 🔁 Creates model interface (`.model.ts`) and service (`.service.ts`).
- 🧭 Injects route definitions into `apps.routes.ts` automatically.
- 📋 Prints a suggested menu entry for `app.menu.ts`.
- ✅ Provides live progress feedback while generating.

---

## 🛠 Usage

1. Open your Angular workspace in VS Code.
2. Press `Ctrl+Shift+P` → Search `Prime Gen: Generate Tailwind Form`.
3. Enter the Angular component name (in CamelCase).
4. Select the HTML file with your form layout.
5. Let the extension handle the rest!

> 🎉 Your components, routes, service, and model will be ready in `src/app/apps/<your-component>/`.

---

## 📂 File Structure Example

```
src/app/apps/location/
├── location-form.component.html
├── location-form.component.ts
├── location-form.component.scss
├── location-table.component.html
├── location-table.component.ts
├── location-table.component.scss
├── location.model.ts
├── location.service.ts
├── location.routes.ts
```

---

## 📋 Menu Entry Snippet

```ts
{
  label: 'Location',
  icon: 'pi pi-fw pi-file',
  items: [
    { label: 'Table', icon: 'pi pi-fw pi-list', routerLink: ['/apps/location/table'] },
    { label: 'Form',  icon: 'pi pi-fw pi-pencil', routerLink: ['/apps/location/form']  }
  ]
}
```

> 📌 This will be printed in the **Output Panel** after generation.

---

## 🧩 Extension Setup (Dev Mode)

Clone and build the extension:

```bash
git clone <repo-url>
cd prime-gen-vscode
npm install
npm run compile
```

Launch the extension using the VS Code debug sidebar (F5).

---

## 🧪 Technology Stack

- [TypeScript](https://www.typescriptlang.org/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Cheerio](https://cheerio.js.org/) for DOM parsing
- [Tailwind CSS](https://tailwindcss.com/)
- [PrimeNG](https://www.primefaces.org/primeng/)

---

## 👨‍💻 Author

Developed by Thilina (@thilina01)

---

## 📄 License

MIT License