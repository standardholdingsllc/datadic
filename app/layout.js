export const metadata = {
  title: 'Griffin Data Converter',
  description: 'Convert worker data files to the required format',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
