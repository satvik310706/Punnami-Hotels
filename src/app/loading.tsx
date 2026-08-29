export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 select-none">
      <div className="flex flex-col items-center max-w-xs text-center">
        {/* Subtle Ring Loader */}
        <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
          <div className="absolute inset-0 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
        </div>

        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
          Loading
        </p>
      </div>
    </div>
  );
}

