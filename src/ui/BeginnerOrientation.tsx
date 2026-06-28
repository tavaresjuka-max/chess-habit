import { openExternalUrl } from '../app/externalOpen';

// Orientação para iniciante absoluto (banda 0-400 / experiência "nunca joguei").
// O fluxo anterior oferecia "Abrir puzzles de calibração" (mateIn1 no Lichess),
// que é um dead-end para quem ainda não sabe mover as peças. Aqui, em vez de
// treinar táticas cedo demais, encaminhamos para o Lichess Learn + partidas
// rápidas, e pedimos que o aluno volte quando tiver um rating.
export function BeginnerOrientation() {
  return (
    <section className="config-section" aria-labelledby="beginner-orientation-title">
      <h2 id="beginner-orientation-title">Você está começando do zero — perfeito.</h2>
      <p>
        Antes de treinar táticas, jogue cerca de 10 partidas rápidas e use o Lichess Learn para
        aprender os movimentos. Volte quando tiver um rating — aí eu monto seu plano.
      </p>
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            openExternalUrl('https://lichess.org/learn');
          }}
        >
          Aprender no Lichess
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            openExternalUrl('https://lichess.org');
          }}
        >
          Jogar no Lichess
        </button>
      </div>
    </section>
  );
}
