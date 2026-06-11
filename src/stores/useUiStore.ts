import { create } from 'zustand'

interface UiStore {
  /** IDs das tarefas visíveis na tela atual, em ordem (para navegação por teclado) */
  visibleIds: string[]
  selectedId: string | null
  expandedId: string | null
  paletteOpen: boolean
  shortcutsOpen: boolean
  soundEnabled: boolean
  /** Modo de seleção múltipla (toque longo no celular) */
  selectionMode: boolean
  checkedIds: string[]

  enterSelection: (id: string) => void
  toggleChecked: (id: string) => void
  exitSelection: () => void

  setVisibleIds: (ids: string[]) => void
  moveSelection: (dir: 1 | -1) => void
  setSelected: (id: string | null) => void
  setExpanded: (id: string | null) => void
  toggleExpanded: (id: string) => void
  setPaletteOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setSoundEnabled: (on: boolean) => void
}

export const useUiStore = create<UiStore>()((set, get) => ({
  visibleIds: [],
  selectedId: null,
  expandedId: null,
  paletteOpen: false,
  shortcutsOpen: false,
  soundEnabled: localStorage.getItem('sound') === 'on',
  selectionMode: false,
  checkedIds: [],

  enterSelection: (id) => set({ selectionMode: true, checkedIds: [id], expandedId: null }),
  toggleChecked: (id) =>
    set(s => ({
      checkedIds: s.checkedIds.includes(id)
        ? s.checkedIds.filter(c => c !== id)
        : [...s.checkedIds, id],
    })),
  exitSelection: () => set({ selectionMode: false, checkedIds: [] }),

  setVisibleIds: (ids) =>
    set(s => ({
      visibleIds: ids,
      selectedId: s.selectedId && ids.includes(s.selectedId) ? s.selectedId : null,
    })),

  moveSelection: (dir) => {
    const { visibleIds, selectedId } = get()
    if (visibleIds.length === 0) return
    const idx = selectedId ? visibleIds.indexOf(selectedId) : -1
    const next = idx === -1
      ? (dir === 1 ? 0 : visibleIds.length - 1)
      : Math.min(Math.max(idx + dir, 0), visibleIds.length - 1)
    set({ selectedId: visibleIds[next] })
  },

  setSelected: (id) => set({ selectedId: id }),
  setExpanded: (id) => set({ expandedId: id }),
  toggleExpanded: (id) => set(s => ({ expandedId: s.expandedId === id ? null : id })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setSoundEnabled: (on) => {
    localStorage.setItem('sound', on ? 'on' : 'off')
    set({ soundEnabled: on })
  },
}))
