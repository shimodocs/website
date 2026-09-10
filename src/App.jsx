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

// Article pages are standalone static documents with no client bundle, so they
// are not routes in this app. If client-side navigation ever reaches one, fall
// back to a real page load rather than rendering an empty shell.
function ArticleFallback() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.location.replace(`${pathname}${search}`)
  }, [pathname, search])
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
        <Route path="/blog/:slug" element={<ArticleFallback />} />
      </Routes>
    </Shell>
  )
}
