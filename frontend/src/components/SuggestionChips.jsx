export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        animation: 'fadeInUp 0.3s ease-out'
      }}
    >
      {suggestions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          style={{
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            borderRadius: '20px',
            padding: '6px 14px',
            color: '#A78BFA',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(124,58,237,0.25)';
            e.target.style.borderColor = 'rgba(124,58,237,0.6)';
            e.target.style.color = '#C4B5FD';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(124,58,237,0.1)';
            e.target.style.borderColor = 'rgba(124,58,237,0.35)';
            e.target.style.color = '#A78BFA';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
          title={q}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
