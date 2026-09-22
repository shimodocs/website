// Feature layout: a full-width hero band carrying the title and a fact list,
// then a single narrow column. No sidebar and no table of contents, so the
// reading experience is deliberately different from the standard layout.
import { Breadcrumb, Pager, PostCta, PostTags, RelatedArticles } from './shared'
import { ProductFacts } from '../ProductFacts'
import { articleShowsProductFacts } from '../../product-facts.js'
import { formatDate } from '../../format'

export default function LayoutFeature({ post, related, older, newer }) {
  return (
    <div className="blog-post-page feat-page" data-layout="feature">
      <section className="feat-hero">
        <div className="feat-hero-inner">
          <Breadcrumb post={post} />
          <p className="feat-kicker">{post.categoryLabel}</p>
          <h1 className="feat-title">{post.title}</h1>
          <p className="feat-standfirst">{post.description}</p>
          <ul className="feat-facts">
            <li>
              <b>Published</b>
              <span>{formatDate(post.date)}</span>
            </li>
            <li>
              <b>Reading time</b>
              <span>{post.readingTime} minutes</span>
            </li>
            <li>
              <b>Length</b>
              <span>{post.words.toLocaleString('en-US')} words</span>
            </li>
            <li>
              <b>Figures</b>
              <span>{post.figures}</span>
            </li>
          </ul>
        </div>
      </section>

      <article className="feat-column">
        {articleShowsProductFacts(post.slug) ? <ProductFacts /> : null}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        <PostTags post={post} />
      </article>

      <section className="feat-closing">
        <div className="feat-closing-inner">
          <PostCta variant="inline" />
          <Pager older={older} newer={newer} variant="stack" />
          <RelatedArticles posts={related} variant="list" title="Keep reading" />
        </div>
      </section>
    </div>
  )
}
