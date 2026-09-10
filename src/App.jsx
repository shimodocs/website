import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Shell from './components/Shell'
import { ROUTES } from './routes'
import { applySeo } from './seo-dom'

function SeoManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    applySeo(pathname)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <Shell>
      <SeoManager />
      <Routes>
        {ROUTES.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Shell>
  )
}
