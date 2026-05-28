export default function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: '#f0fdf9' }}>
          <Icon className="w-8 h-8" style={{ color: '#00C48C' }} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#00C48C' }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
