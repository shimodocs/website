export function Eyebrow({children}) { return <div className="eyebrow">{children}</div> }
export function Button({to, children, secondary=false}) { return <a className={secondary ? 'button secondary' : 'button'} href={to}>{children}</a> }
