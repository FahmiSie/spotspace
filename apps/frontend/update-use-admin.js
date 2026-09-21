const fs = require('fs');

let content = fs.readFileSync('src/lib/hooks/use-admin.ts', 'utf8');

// Add import if not exists
if (!content.includes('import { Member, Space, Diskon, Reservasi, SpaceOwner, SpaceFoto } from "../types";')) {
  content = `import { Member, Space, Diskon, Reservasi, SpaceOwner, SpaceFoto } from "../types";\n` + content;
}

// Members
content = content.replace(/queryFn: async \(\) => \{/g, 'queryFn: async () => {'); // normalize
content = content.replace(/const \{ data \} = await api.get\("\/admin\/members"/, 'const { data } = await api.get<Member[]>("/admin/members"');
content = content.replace(/const \{ data \} = await api.post\("\/admin\/members"/, 'const { data } = await api.post<Member>("/admin/members"');
content = content.replace(/const \{ data \} = await api.put\(`\/admin\/members\/\$\{id\}`/, 'const { data } = await api.put<Member>(`/admin/members/${id}`');

// Spaces
content = content.replace(/const \{ data \} = await api.get\("\/admin\/spaces"\);/, 'const { data } = await api.get<Space[]>("/admin/spaces");');
content = content.replace(/const \{ data \} = await api.post\("\/admin\/spaces"/, 'const { data } = await api.post<Space>("/admin/spaces"');
content = content.replace(/const \{ data \} = await api.put\(`\/admin\/spaces\/\$\{id\}`/, 'const { data } = await api.put<Space>(`/admin/spaces/${id}`');

// SpaceFoto
content = content.replace(/const \{ data \} = await api.post\(`\/admin\/spaces\/\$\{spaceId\}\/foto`/, 'const { data } = await api.post<SpaceFoto>(`/admin/spaces/${spaceId}/foto`');

// Diskon
content = content.replace(/const \{ data \} = await api.get\("\/admin\/diskon"\);/, 'const { data } = await api.get<Diskon[]>("/admin/diskon");');
content = content.replace(/const \{ data \} = await api.post\("\/admin\/diskon"/, 'const { data } = await api.post<Diskon>("/admin/diskon"');
content = content.replace(/const \{ data \} = await api.put\(`\/admin\/diskon\/\$\{id\}`/, 'const { data } = await api.put<Diskon>(`/admin/diskon/${id}`');

// Reservasi
content = content.replace(/const \{ data \} = await api.get\("\/admin\/reservasi"\);/, 'const { data } = await api.get<Reservasi[]>("/admin/reservasi");');
content = content.replace(/const \{ data \} = await api.put\(`\/admin\/reservasi\/\$\{id\}\/status`/, 'const { data } = await api.put<Reservasi>(`/admin/reservasi/${id}/status`');
content = content.replace(/const \{ data \} = await api.post\(`\/admin\/reservasi\/\$\{id\}\/check-in`/, 'const { data } = await api.post<Reservasi>(`/admin/reservasi/${id}/check-in`');
content = content.replace(/const \{ data \} = await api.post\(`\/admin\/reservasi\/\$\{id\}\/check-out`/, 'const { data } = await api.post<Reservasi>(`/admin/reservasi/${id}/check-out`');

// Profile
content = content.replace(/const \{ data \} = await api.get\("\/admin\/profile"\);/, 'const { data } = await api.get<SpaceOwner>("/admin/profile");');
content = content.replace(/const \{ data \} = await api.put\("\/admin\/profile"/, 'const { data } = await api.put<SpaceOwner>("/admin/profile"');

fs.writeFileSync('src/lib/hooks/use-admin.ts', content);
console.log('Updated use-admin.ts');
