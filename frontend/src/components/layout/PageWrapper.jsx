import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <MobileHeader />
      <main className="md:ml-60 min-h-screen pb-24 md:pb-0 pt-[52px] md:pt-0">
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
