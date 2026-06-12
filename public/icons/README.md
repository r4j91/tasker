# Icones do TASKER

## Estrutura
public/icons/
  icon.svg                           -> icone oficial (P5 marinho) em vetor
  icon-192.png / icon-512.png        -> PWA padrao
  icon-maskable-192.png / -512.png   -> Android (full-bleed, sem cantos)
  apple-touch-icon.png               -> iOS tela inicial (180px, fundo solido)
  favicon-32.png / favicon-16.png    -> aba do navegador (variante bold)
  alt/                               -> icone alternativo (P3 grafite) para uso futuro

## Trecho do manifest (vite-plugin-pwa)
icons: [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
  { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
]

## Tags no index.html
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
