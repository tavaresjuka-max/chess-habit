// Primeira abertura: o professor recebe o aluno — não um formulário.
// "Começar agora" usa o perfil padrão; ajustes finos ficam na Config.

type WelcomeProps = {
  notice?: string;
  onStart: () => Promise<void>;
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
        <img
          src="/art/lemos-pose-boas-vindas.webp"
          alt=""
          aria-hidden="true"
          className="welcome-art"
          width={180}
          height={180}
        />
      </div>
      <h1 id="welcome-title">A aula pode começar.</h1>
      <p className="welcome-lede">
        Sou o Professor Lemos. Aqui o treino é curto, o foco é um só por vez, e
        cada sessão conta. Melhor pouco bem feito que muito no automático.
      </p>
      <ul className="welcome-points">
        <li>Sessões de 5 a 60 minutos, treinadas direto no Lichess.</li>
        <li>Eu escolho o que estudar; você só confirma e executa.</li>
        <li>Seu progresso fica neste aparelho — exporte backups quando quiser.</li>
      </ul>
      {notice !== undefined ? (
        <p className="config-hint" aria-live="polite">
          {notice}
        </p>
      ) : null}
      <div className="button-row welcome-actions">
        <button
          type="button"
          onClick={() => {
            void onStart();
          }}
        >
          Começar agora
        </button>
        <button type="button" className="secondary-button" onClick={onConfigure}>
          Ajustar antes
        </button>
      </div>
      <p className="config-hint">
        A avaliação de entrada (2 min) encontra seu ponto certo no curso — dá
        para fazer agora em “Ajustar antes” ou depois, na Config.
      </p>
    </section>
  );
}
