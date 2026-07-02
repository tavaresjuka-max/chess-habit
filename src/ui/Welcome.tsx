// Passo 1 do funil: o professor recebe o aluno e convida a configurar.
// "Vamos configurar" segue para o passo 2; "Começar rápido" e "Analisar minha
// última partida" pulam com o perfil padrão direto para a aprovação do plano
// (mesmo caminho, mesmo estado) — só o destino final muda: Hoje ou Autópsia.

import { ConceptSeal } from './art/ConceptSeal';

type WelcomeProps = {
  notice?: string;
  onStart: (destination?: 'today' | 'autopsy') => Promise<void>;
  onConfigure: () => void;
};

export function Welcome({ notice, onStart, onConfigure }: WelcomeProps) {
  return (
    <section className="panel welcome-panel" aria-labelledby="welcome-title">
      <div className="welcome-hero">
        <img
          src="/art/boas-vindas-placement.webp"
          alt=""
          aria-hidden="true"
          className="welcome-scene"
          width={320}
          height={200}
        />
      </div>
      <h1 id="welcome-title">A aula pode começar.</h1>
      <p className="welcome-lede">
        Sou o Professor Tavarez. Aqui o treino é curto e o foco é um só por vez.
        Melhor pouco bem feito que muito no automático.
      </p>
      <p className="welcome-lede-secondary">
        Você treina no Lichess; eu organizo, corrijo e salvo seu plano.
      </p>
      <ul className="welcome-points">
        <li>
          <ConceptSeal concept="sessao" size={30} />
          Sessões de 5 a 60 minutos, direto no Lichess.
        </li>
        <li>
          <ConceptSeal concept="trilha" size={30} />
          Eu escolho o que estudar — você só executa.
        </li>
        <li>
          <ConceptSeal concept="dados" size={30} />
          Seu progresso fica neste aparelho. Exporte backups quando quiser.
        </li>
        <li>
          <ConceptSeal concept="dados" size={30} />
          Não tem conta no Lichess? É grátis — te levo lá.
        </li>
      </ul>
      {notice !== undefined ? (
        <p className="config-hint" aria-live="polite">
          {notice}
        </p>
      ) : null}
      <div className="button-row welcome-actions">
        <button type="button" onClick={onConfigure}>
          Vamos configurar
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void onStart();
          }}
        >
          Começar rápido
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void onStart('autopsy');
          }}
        >
          Analisar minha última partida
        </button>
      </div>
    </section>
  );
}
