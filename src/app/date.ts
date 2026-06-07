export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Intencionalmente usa a data local do navegador: a rotina e diaria para o
  // usuario, nao para UTC. Se uma sessao atravessar meia-noite, o log fica no
  // dia em que o bloco foi iniciado/carregado.
  return `${String(year)}-${month}-${day}`;
}
