// Casca das páginas em React (/metodo e /referencias). Tokens iguais aos de src/legacy/landing.html e DESIGN.md.
import './globals.css';

// Padrão das páginas em React; /metodo e /referencias definem o próprio título.
export const metadata = {
  title: 'De Olho no Fogo',
  description: 'Focos de calor do MODIS e do VIIRS (NASA FIRMS) harmonizados ponto a ponto na grade de 1 km do MODIS: o mundo em 2025 e o Brasil de 2000 a 2025.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
