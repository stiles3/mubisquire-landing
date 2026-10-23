// Fonts are self-hosted (Fontsource) so the site never depends on Google Fonts at runtime or build time.
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/manrope'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './globals.css'

export const metadata = {
  title: 'Mubisquire',
  description: 'Mubisquire is a remote-first tech company. We build software for startups and larger companies, and run products of our own: Mailsquire, Squirepay, CQuence and BinjHub.',
}

export const viewport = { themeColor: '#F7F5FF' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
