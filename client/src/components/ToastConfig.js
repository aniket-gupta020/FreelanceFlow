export const TOAST_OPTIONS = {
  duration: 4000,
  position: 'top-center',
  style: {
    background: 'rgba(255, 255, 255, 0.4)', // bg-white/40
    color: '#334155', // text-slate-700
    backdropFilter: 'blur(24px)', // backdrop-blur-xl
    border: '1px solid rgba(255, 255, 255, 0.5)', // border-white/50
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // shadow-xl
    padding: '16px',
    borderRadius: '16px', // rounded-2xl
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
  },
  darkStyle: {
    background: 'rgba(0, 0, 0, 0.4)', // dark:bg-black/40
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)', // dark:border-white/10
  }
};

export const GLASS_TOAST_STYLE = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'inherit',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  padding: '16px',
  borderRadius: '12px',
};
