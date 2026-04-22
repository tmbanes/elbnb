import { Loader2 } from "lucide-react"

export function PageLoader() {
  return (
    <div className="page-loader w-full h-full flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="relative flex items-center justify-center mb-6 w-40 h-40">
        <img src="/logo/logo_house.png" alt="Loading..." className="w-12 h-auto animate-pulse drop-shadow-md z-10" />
        <Loader2 className="absolute inset-0 m-auto w-40 h-40 text-[#8ba665] animate-spin opacity-60" strokeWidth={1.5} />
      </div>
      <p className="mt-2 text-[#8ba665] font-medium tracking-wide animate-pulse">Loading...</p>
    </div>
  )
}
