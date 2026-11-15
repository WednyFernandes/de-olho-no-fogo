import Casca from '../Casca';
import Risco from './Risco';

export const metadata = {
  title: 'Análise e Risco de Queimadas · De Olho no Fogo',
  description: 'Recorrência de focos, condições do tempo nos dias com detecção e um modelo de risco semanal por célula do NASA POWER (Brasil, 2012–2025), com métricas, calibração e limites.',
};

export default function Pagina() {
  return (
    <Casca aqui="/risco">
      <Risco />
    </Casca>
  );
}
