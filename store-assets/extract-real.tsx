import { renderToStaticMarkup } from 'react-dom/server'
import { Check, LoaderCircle, Settings, Puzzle, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'
import { BrandMark } from '../src/ui/components/Brand'
import { builtInCriteria } from '../src/domain/criteria'
const out = {
  mark: renderToStaticMarkup(<BrandMark size={96} />),
  settings: renderToStaticMarkup(<Settings size={16} strokeWidth={1.75} />),
  check: renderToStaticMarkup(<Check size={15} strokeWidth={2} />),
  loader: renderToStaticMarkup(<LoaderCircle size={16} className="spinner" />),
  puzzle: renderToStaticMarkup(<Puzzle size={22} strokeWidth={1.75} />),
  back: renderToStaticMarkup(<ArrowLeft size={22} strokeWidth={1.75} />),
  fwd: renderToStaticMarkup(<ArrowRight size={22} strokeWidth={1.75} />),
  reload: renderToStaticMarkup(<RotateCw size={20} strokeWidth={1.75} />),
  lenses: builtInCriteria.map(({ id, name, description }) => ({ id, name, description })),
}
await Bun.write('store-assets/real.js', `window.REAL = ${JSON.stringify(out)};`)
