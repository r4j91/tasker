import { useEffect } from 'react'
import { useUiStore } from '../stores/useUiStore'

/** Registra as tarefas visíveis da tela atual para navegação por teclado. */
export function useRegisterVisible(ids: string[]) {
  const setVisibleIds = useUiStore(s => s.setVisibleIds)
  const key = ids.join(',')
  useEffect(() => {
    setVisibleIds(ids)
    return () => setVisibleIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setVisibleIds])
}
