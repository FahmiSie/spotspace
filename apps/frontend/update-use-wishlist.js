const fs = require('fs');

let content = fs.readFileSync('src/lib/hooks/use-wishlist.ts', 'utf8');

if (!content.includes('import { WishlistItem, ToggleWishlistResponse } from "../types";')) {
  content = `import { WishlistItem, ToggleWishlistResponse } from "../types";\n` + content;
}

content = content.replace(/const \{ data \} = await api.get\("\/wishlist\/my"\);/, 'const { data } = await api.get<WishlistItem[]>("/wishlist/my");');
content = content.replace(/const \{ data \} = await api.post\("\/wishlist"/, 'const { data } = await api.post<ToggleWishlistResponse>("/wishlist"');

fs.writeFileSync('src/lib/hooks/use-wishlist.ts', content);
console.log('Updated use-wishlist.ts');
