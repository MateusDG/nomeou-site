// O cabeçalho fixo: o fio duplo depois da rolagem, o trilho das etapas (o fio de 3 px corre até a etapa da vez),
// o fólio "ETAPA 2 DE 6" no celular, o álbum dos selos ganhos (um botão que leva à próxima etapa pendente) e a
// chave do som.
import { $, $$ } from '../base/dom';
import * as Movimento from '../base/movimento';
import { selo } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { materia } from '../dados';

let topo: HTMLElement;

function ligarFioDuplo(): void {
  let pedido = 0;
  const conferir = (): void => {
    pedido = 0;
    topo.classList.toggle('is-rolado', window.scrollY > 8);
  };
  window.addEventListener('scroll', () => (pedido ||= requestAnimationFrame(conferir)), { passive: true });
  conferir();
}

/** A etapa da vez é a seção que cruza a linha a 40% da altura da tela. */
function ligarTrilho(): void {
  const trilho = $('[data-trilho]', topo);
  const fio = $('[data-trilho-fio]', topo);
  const folio = $('[data-folio]', topo);
  const numero = $('[data-folio-n]', topo);
  if (!('IntersectionObserver' in window)) return;
  const secoes = $$<HTMLElement>('main > section');
  let etapaAtual = '';
  const marcar = (secao: HTMLElement): void => {
    const n = secao.dataset['etapaN'];
    const id = secao.id;
    if (id === etapaAtual) return;
    etapaAtual = id;
    const links = $$<HTMLAnchorElement>('a[data-etapa]', trilho ?? topo);
    for (const a of links) a.removeAttribute('aria-current');
    const link = n ? links.find((a) => a.dataset['etapa'] === id) : undefined;
    if (link && fio && trilho) {
      link.setAttribute('aria-current', 'step');
      trilho.classList.add('is-ativo');
      fio.style.width = `${link.offsetWidth - 20}px`;
      fio.style.transform = `translateX(${link.offsetLeft + 10}px)`;
    } else trilho?.classList.remove('is-ativo');
    if (folio && numero) {
      folio.classList.toggle('is-fora', !n);
      if (n && numero.textContent !== n) Movimento.contar(numero, Number(n));
    }
  };
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) if (e.isIntersecting) marcar(e.target as HTMLElement);
    },
    { rootMargin: '-40% 0px -60% 0px', threshold: 0 },
  );
  secoes.forEach((s) => observador.observe(s));
}

/** O álbum: 3 casas de selo; aparece quando a convocação entra na tela ou chega o 1º selo. */
function ligarAlbum(): void {
  const album = $<HTMLButtonElement>('[data-album]', topo);
  if (!album) return;
  const casas = $$('[data-album-casa]', album);
  const desenhar = (): void => {
    const selos = Rodada.estado.selos;
    casas.forEach((casa, i) => {
      const s = selos[i];
      casa.classList.toggle('is-cheia', !!s);
      casa.innerHTML = s ? selo(materia(s.d), { lado: 26, estado: 'carimbado', legenda: false }) : '';
    });
    const total = selos.length;
    album.setAttribute('aria-label', total >= 3 ? 'Selos na página: 3 de 3. Ir para o resultado.' : `Selos na página: ${total} de 3. Ir para a convocação.`);
  };
  const mostrar = (): void => {
    if (!album.hidden) return;
    album.hidden = false;
    void Movimento.animar(album, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duracao: 200, curva: 'assenta' });
  };
  desenhar();
  if (Rodada.estado.selos.length) mostrar();
  const convocacao = $('#convocacao');
  if (convocacao && 'IntersectionObserver' in window) {
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        mostrar();
        observador.disconnect();
      }
    });
    observador.observe(convocacao);
  }
  Rodada.on('selo', () => {
    desenhar();
    mostrar();
  });
  album.addEventListener('click', () => {
    const destino = $(Rodada.estado.selos.length >= 3 ? '#resultado' : '#convocacao');
    if (destino) void Movimento.rolarAte(destino, { focar: true });
  });
}

/** A casa do álbum onde o próximo selo cola (o destino do voo). */
export function casaDoAlbum(): HTMLElement | null {
  const album = $<HTMLButtonElement>('[data-album]');
  if (!album || album.hidden) return null;
  return $$('[data-album-casa]', album)[Math.min(2, Rodada.estado.selos.length)] ?? null;
}

/** A chave do som, nas bolhas S e N do cartão-resposta. Começa em N. */
function ligarSom(): void {
  const chave = $<HTMLButtonElement>('[data-som]', topo);
  if (!chave) return;
  chave.hidden = false;
  const desenhar = (): void => {
    const ligado = Som.ligado();
    chave.setAttribute('aria-pressed', String(ligado));
    $('[data-som-s]', chave)?.classList.toggle('is-marcada', ligado);
    $('[data-som-n]', chave)?.classList.toggle('is-marcada', !ligado);
  };
  desenhar();
  Som.aoMudar(desenhar);
  chave.addEventListener('click', () => Som.ligar(!Som.ligado()));
}

export function iniciar(): void {
  topo = $('[data-topo]')!;
  ligarFioDuplo();
  ligarTrilho();
  ligarAlbum();
  ligarSom();
}
