export const metadata = {
  title: 'NCGA Data Converter',
  description: 'Convert worker data files to the required format',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
