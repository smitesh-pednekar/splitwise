import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <MobileHeader />
      {/* 
        Offsets:
          mobile (< md):  no sidebar, top header 52px, bottom nav padding
          tablet (md–lg): icon sidebar = 64px (w-16)
          desktop (lg+):  full sidebar = 240px (w-60)
      */}
      <main className="md:ml-16 lg:ml-60 min-h-screen pb-24 md:pb-0 pt-[52px] md:pt-0">
        <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6 w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
