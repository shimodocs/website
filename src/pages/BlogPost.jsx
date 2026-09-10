// Article dispatcher.
//
// Every article picks a layout in its frontmatter and gets a genuinely
// different document structure, not the same markup with different classes.
// These pages are rendered to static HTML at build time and the client bundle
// is stripped from them, so nothing here is ever hydrated.
import LayoutBriefing from '../components/article/LayoutBriefing'
import LayoutFeature from '../components/article/LayoutFeature'
import LayoutMagazine from '../components/article/LayoutMagazine'
import LayoutStandard from '../components/article/LayoutStandard'

const LAYOUTS = {
  standard: LayoutStandard,
  feature: LayoutFeature,
  briefing: LayoutBriefing,
  magazine: LayoutMagazine,
}

export default function BlogPost(props) {
  const Layout = LAYOUTS[props.post.layout] || LayoutStandard
  return <Layout {...props} />
}
