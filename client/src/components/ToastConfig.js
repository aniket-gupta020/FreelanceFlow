export const TOAST_OPTIONS = {
  duration: 4000,
  position: 'top-center',
  style: {
    background: 'rgba(255, 255, 255, 0.4)',
    color: '#334155',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
  },
  darkStyle: {
    background: 'rgba(0, 0, 0, 0.4)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
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
