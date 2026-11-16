import Casca from '../Casca';

export const metadata = {
  title: 'Pitch · De Olho no Fogo',
  description: 'Apresentação de 7 slides e vídeo de 30 segundos do De Olho no Fogo, time Space Uai, NASA Space Apps Challenge 2026.',
};

const PDF = '/pitch/De-Olho-no-Fogo-apresentacao.pdf';
const PPTX = '/pitch/De-Olho-no-Fogo-apresentacao.pptx';
const VIDEO = '/pitch/De-Olho-no-Fogo-30s.mp4';
const GITHUB = 'https://github.com/WednyFernandes/de-olho-no-fogo';

export default function Pitch() {
  return (
    <Casca aqui="/pitch">
      <section className="v-sec">
        <div className="v-wrap">
          <h1 className="v-h2">Pitch</h1>
          <p className="v-lead">A apresentação em 7 slides. Clique nela ou use as setas do teclado para avançar.</p>
          <div className="pitch-quadro">
            <iframe src="/pitch/deck" title="Apresentação De Olho no Fogo, 7 slides" allowFullScreen loading="lazy" />
          </div>
          <p className="pitch-dica">Dica: dentro da apresentação, a tecla F abre em tela cheia.</p>
          <div className="pitch-acoes">
            <a className="v-btn principal" href={PDF} download>Baixar em PDF <small>recomendado</small></a>
            <a className="v-btn" href={PDF} target="_blank" rel="noopener noreferrer">Ver o PDF no navegador</a>
            <a className="v-btn" href={PPTX} download>Baixar em PowerPoint (PPTX)</a>
            <a className="v-btn" href={GITHUB} target="_blank" rel="noopener noreferrer">Código no GitHub</a>
          </div>
          <p className="pitch-aviso">O PPTX pode desconfigurar fontes e posições dependendo do programa. Para ver igual ao original, prefira o PDF.</p>
        </div>
      </section>
      <section className="v-sec v-creme">
        <div className="v-wrap">
          <h2 className="v-h2">Vídeo de 30 segundos</h2>
          <video className="pitch-video" src={VIDEO} poster="/img/video30-en.jpg" controls preload="metadata" playsInline />
          <div className="pitch-acoes">
            <a className="v-btn" href={VIDEO} download>Baixar o vídeo (MP4, inglês)</a>
            <a className="v-btn" href="/pitch/De-Olho-no-Fogo-30s-pt.mp4" target="_blank" rel="noopener noreferrer">Versão em português</a>
          </div>
        </div>
      </section>
    </Casca>
  );
}
