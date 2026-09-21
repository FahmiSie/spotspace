const fs = require('fs');
let content = fs.readFileSync('src/lib/hooks/use-reservasi.ts', 'utf8');

if (!content.includes('import { Reservasi } from "../types";')) {
  content = `import { Reservasi } from "../types";\n` + content;
}

content = content.replace(/const \{ data \} = await api.patch\(`\/reservasi\/\$\{id\}\/cancel`\);/, 'const { data } = await api.patch<Reservasi>(`/reservasi/${id}/cancel`);');

fs.writeFileSync('src/lib/hooks/use-reservasi.ts', content);
console.log('Updated use-reservasi.ts');
