export const PageTransition = ({ children }) => (
  <div style={{ animation: 'pageIn 0.25s ease forwards' }}>
    {children}
  </div>
)
