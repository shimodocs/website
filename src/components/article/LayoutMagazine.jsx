// Magazine layout: a wide masthead with a metadata grid, then a full-width
// single column with no sidebar at all. Closing blocks run as full-width bands.
import {
  BackToArchive,
  MetaLine,
  Pager,
  PostCta,
  PostTags,
  RelatedArticles,
} from './shared'
import { ProductFacts } from '../ProductFacts'
import { articleShowsProductFacts } from '../../product-facts.js'
import { formatDate } from '../../format'

export default function LayoutMagazine({ post, related, older, newer }) {
  return (
    <div className="blog-post-page mag-page" data-layout="magazine">
      <section className="mag-masthead">
        <div className="mag-masthead-inner">
          <MetaLine post={post} showAuthor />
          <h1 className="mag-title">{post.title}</h1>
          <p className="mag-standfirst">{post.description}</p>
          <dl className="mag-meta">
            <div>
              <dt>Published</dt>
              <dd>{formatDate(post.date)}</dd>
            </div>
            <div>
              <dt>Section</dt>
              <dd>{post.categoryLabel}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{post.readingTime} minutes</dd>
            </div>
            <div>
              <dt>Words</dt>
              <dd>{post.words.toLocaleString('en-US')}</dd>
            </div>
          </dl>
        </div>
      </section>

      {articleShowsProductFacts(post.slug) ? (
        <div className="page">
          <ProductFacts />
        </div>
      ) : null}

      <article className="mag-body post-body" dangerouslySetInnerHTML={{ __html: post.html }} />

      <section className="mag-band">
        <PostTags post={post} />
        <PostCta />
      </section>

      <section className="mag-band mag-band-muted">
        <RelatedArticles posts={related} title="More in this section" />
        <Pager older={older} newer={newer} />
        <BackToArchive />
      </section>
    </div>
  )
}
