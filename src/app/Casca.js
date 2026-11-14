const LINKS = [['/', 'Início'], ['/globo', 'Globo'], ['/calendario', 'Calendário'], ['/metodo', 'Método']];

export default function Casca({ aqui, children }) {
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a className="logo" href="/" aria-label="De Olho no Fogo, início">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#E5004B" /><path d="M5 16c3-5 6.6-7.5 11-7.5S24 11 27 16c-3 5-6.6 7.5-11 7.5S8 21 5 16z" fill="#fff" /><circle cx="16" cy="16" r="4.4" fill="#E5004B" /><path d="M16 13.2c1.2 1.1 1.7 2 1.7 2.9a1.7 1.7 0 0 1-3.4 0c0-.9.5-1.8 1.7-2.9z" fill="#FFC02E" /></svg>
            <span>De Olho no Fogo</span>
          </a>
          <nav aria-label="Páginas">
            {LINKS.map(([href, label]) => <a key={href} href={href} aria-current={aqui === href ? 'page' : undefined}>{label}</a>)}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer><div className="wrap">Space Uai · NASA Space Apps Challenge 2026 · Ouro Preto, MG</div></footer>
    </>
  );
}
