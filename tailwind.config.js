/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        aria: {
          bg:     '#f8faff',
          card:   '#ffffff',
          border: '#e2e8f0',
          text:   '#0f172a',
          muted:  '#64748b',
        },
      },
      keyframes: {
        'fade-up':    { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in':    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'shimmer':    { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        'pulse-glow': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.35)' }, '50%': { boxShadow: '0 0 0 10px rgba(99,102,241,0)' } },
      },
      animation: {
        'fade-up':    'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':    'fade-in 0.3s ease-out forwards',
        'shimmer':    'shimmer 1.6s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
