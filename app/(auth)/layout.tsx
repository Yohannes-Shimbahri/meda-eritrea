export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>
      {children}
    </div>
  )
}