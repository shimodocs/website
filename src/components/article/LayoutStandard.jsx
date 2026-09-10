// Classic editorial layout: breadcrumb, header, two columns with the table of
// contents pinned left, then the standard closing blocks.
import {
  BackToArchive,
  Breadcrumb,
  MetaLine,
  Pager,
  PostCta,
  PostTags,
  RelatedArticles,
  TableOfContents,
} from './shared'

export default function LayoutStandard({ post, related, older, newer }) {
  return (
    <div className="page blog-post-page" data-layout="standard">
      <Breadcrumb post={post} />
      <article className="post">
        <header className="post-header">
          <MetaLine post={post} />
          <h1>{post.title}</h1>
          <p className="post-dek">{post.description}</p>
          {post.updated && post.updated !== post.date ? (
            <p className="post-updated">
              Last updated <time dateTime={post.updated}>{post.updated}</time>
            </p>
          ) : null}
        </header>

        <div className="post-layout">
          <TableOfContents headings={post.headings} />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>

        <PostTags post={post} />
        <PostCta />
        <Pager older={older} newer={newer} />
        <RelatedArticles posts={related} />
        <BackToArchive />
      </article>
    </div>
  )
}
