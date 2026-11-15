const LINKS = [['/', 'Início'], ['/globo', 'Globo'], ['/risco', 'Risco'], ['/metodo', 'Método'], ['/referencias', 'Referências'], ['/time', 'Time']];

export default function Casca({ aqui, children }) {
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a className="logo" href="/" aria-label="De Olho no Fogo, início">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#D4410B" /><path d="M16 4C17.8 8.6 23.5 11.4 23.5 18.6 23.5 23.3 20.2 27 16 27S8.5 23.3 8.5 18.9C8.5 15.2 10.6 13 12.2 11.1 12.4 13.6 13.5 15 14.9 15.4 14.2 11.6 14.7 7.6 16 4Z" fill="#fff" /><path d="M11 20.6Q16 16.2 21 20.6 16 25 11 20.6Z" fill="#D4410B" /><circle cx="16" cy="20.6" r="1.9" fill="#FFC02E" /></svg>
            <span>De Olho no Fogo</span>
          </a>
          <nav aria-label="Páginas">
            {LINKS.map(([href, label]) => <a key={href} href={href} aria-current={aqui === href ? 'page' : undefined}>{label}</a>)}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer><div className="wrap">Space Uai · NASA Space Apps Challenge 2026</div></footer>
    </>
  );
}
