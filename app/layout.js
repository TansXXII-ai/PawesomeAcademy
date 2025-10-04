import './globals.css'

export const metadata = {
  title: 'Pawcademy - Dog Training Platform',
  description: 'Professional dog training management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
