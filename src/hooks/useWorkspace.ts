import { useContext } from 'react'

import { WorkspaceContext, type WorkspaceState } from '../context/workspace-context'

export function useWorkspace(): WorkspaceState {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider.')
  return value
}
