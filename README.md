# TASKER

Premium Task Manager — PWA inspirado em Todoist e Things 3.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Zustand** — gerenciamento de estado
- **Framer Motion** — animações
- **Supabase** — backend/auth
- **date-fns** — manipulação de datas
- **lucide-react** — ícones

## Como rodar

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Estrutura de pastas

```
src/
├── components/       # Componentes reutilizáveis
├── features/
│   ├── tasks/        # Feature de tarefas
│   └── projects/     # Feature de projetos
├── stores/           # Stores Zustand
├── lib/              # Utilitários e clientes (Supabase, etc.)
└── styles/           # Estilos globais adicionais
```

## Build para produção

```bash
bun run build
```

## PWA

O app inclui `manifest.json` para instalação como PWA em desktop e mobile.
Adicione ícones `icon-192.png` e `icon-512.png` em `public/` antes de publicar.
