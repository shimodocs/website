// Citable product definition and numeric facts.
//
// Rendered into the static HTML so a crawler that does not execute JavaScript
// still sees the same sentence and the same unit-bearing numbers. The strings
// come from src/product-facts.js; this file is only markup.
import { PRODUCT_DEFINITION, PRODUCT_FACTS } from '../product-facts.js'

export function ProductFacts({ showDefinition = true }) {
  return (
    <section className="product-facts" aria-label="ShimoDocs facts">
      <p className="product-facts-kicker">ShimoDocs in numbers</p>
      {showDefinition ? <p className="product-definition">{PRODUCT_DEFINITION}</p> : null}
      <dl>
        {PRODUCT_FACTS.map(fact => (
          <div key={fact.term}>
            <dt>{fact.term}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
