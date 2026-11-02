import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
const mock=vi.hoisted(() => ({ linkedinConnection:vi.fn().mockResolvedValue({ configured:true,connected:false,name:null }), startLinkedIn:vi.fn(),completeLinkedIn:vi.fn(),disconnectLinkedIn:vi.fn() }))
vi.mock('../api/client',()=>({api:mock}))
import { LinkedInConnection } from './LinkedInConnection'
function setup(): void { render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><LinkedInConnection /></QueryClientProvider>) }
afterEach(()=>{ sessionStorage.clear(); window.history.replaceState(null,'','/#/evidence'); vi.clearAllMocks() })
it('rejects callback from a different tab before API exchange',async()=>{
 window.history.replaceState(null,'','/#/evidence?linkedin_code=code&linkedin_state=state')
 setup(); await userEvent.click(await screen.findByRole('button',{name:'Finish LinkedIn connection'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('did not start in this tab')
 expect(mock.completeLinkedIn).not.toHaveBeenCalled()
 expect(window.location.hash).toBe('#/evidence')
})
it('completes only a tab-bound callback and removes local state',async()=>{
 window.history.replaceState(null,'','/#/evidence?linkedin_code=code&linkedin_state=state')
 sessionStorage.setItem('linkedin-oauth-state','state'); mock.completeLinkedIn.mockResolvedValue({connected:true,name:'Example'})
 setup(); await userEvent.click(await screen.findByRole('button',{name:'Finish LinkedIn connection'}))
 await waitFor(()=>expect(mock.completeLinkedIn).toHaveBeenCalledWith('code','state'))
 expect(sessionStorage.getItem('linkedin-oauth-state')).toBeNull()
})
