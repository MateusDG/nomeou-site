// As lojas. Os links ficam em CONFIG.lojas; sem eles, a página diz "Em breve no iPhone e no Android.". Com a loja
// do aparelho, ela vira o botão cheio da abertura e do fecho, e "Sortear a matéria" desce a botão de texto. No
// celular, a barra de baixo "Baixar o app" aparece quando a abertura sai da tela.
import { CONFIG } from '../config';
import { $, $$, esc } from '../base/dom';

type Aparelho = 'iphone' | 'android' | 'desktop';

function aparelho(): Aparelho {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone';
  return 'desktop';
}

const ROTULO = { ios: 'Baixar na App Store', android: 'Baixar no Google Play' } as const;

function botaoDaLoja(qual: 'ios' | 'android', url: string, cheio: boolean): string {
  return `<a class="botao ${cheio ? 'botao--cheio botao--grande' : 'botao--contorno'} loja" href="${esc(url)}" rel="noopener">${ROTULO[qual]}</a>`;
}

/** Põe o installUrl e a oferta de preço zero no nó MobileApplication do JSON-LD. */
function atualizarJsonLd(url: string): void {
  const dados = $('#dados-do-app');
  if (!dados?.textContent) return;
  try {
    const json = JSON.parse(dados.textContent) as { '@graph'?: Record<string, unknown>[] } & Record<string, unknown>;
    const app = json['@graph']?.find((n) => n['@type'] === 'MobileApplication') ?? json;
    app['installUrl'] = url;
    app['offers'] = { '@type': 'Offer', price: '0', priceCurrency: 'BRL' };
    dados.textContent = JSON.stringify(json);
  } catch {
    // Fica o JSON-LD impresso.
  }
}

/** A barra de baixo: aparece quando a abertura sai; some com a abertura, o fecho ou o Resultado na tela, e com um campo em foco. */
function ligarBarra(url: string): void {
  const barra = $('[data-barra]');
  const link = $<HTMLAnchorElement>('[data-barra-link]');
  if (!barra || !link || !('IntersectionObserver' in window)) return;
  link.href = url;
  barra.hidden = false;
  barra.classList.add('is-fora');
  document.body.classList.add('tem-barra');
  const visiveis = new Set<Element>();
  let campoEmFoco = false;
  const atualizar = (): void => {
    const fora = visiveis.size > 0 || campoEmFoco;
    barra.classList.toggle('is-fora', fora);
  };
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
    atualizar();
  });
  for (const s of ['#sorteio', '#baixar', '#resultado']) {
    const el = $(s);
    if (el) observador.observe(el);
  }
  document.addEventListener('focusin', (e) => {
    campoEmFoco = (e.target as Element).matches?.('input, textarea') ?? false;
    atualizar();
  });
  document.addEventListener('focusout', () => {
    campoEmFoco = false;
    atualizar();
  });
}

/** O "Baixar o app" do cabeçalho: aparece quando os botões da abertura saem e some enquanto outro botão de loja está à vista. */
function ligarTopo(url: string): void {
  const topo = $<HTMLAnchorElement>('[data-baixar]');
  if (!topo || !('IntersectionObserver' in window)) return;
  topo.href = url;
  const lojasVisiveis = new Set<Element>();
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? lojasVisiveis.add(e.target) : lojasVisiveis.delete(e.target);
    topo.hidden = lojasVisiveis.size > 0;
  });
  $$('[data-lojas]').forEach((l) => observador.observe(l));
}

export function iniciar(): void {
  const ios = /^https:\/\/apps\.apple\.com\//.test(CONFIG.lojas.ios) ? CONFIG.lojas.ios : '';
  const android = /^https:\/\/play\.google\.com\//.test(CONFIG.lojas.android) ? CONFIG.lojas.android : '';
  if (!ios && !android) return;
  const qual = aparelho();
  const lojaDoAparelho = qual === 'android' ? android : qual === 'iphone' ? ios : '';
  const naAbertura = $('[data-lojas="abertura"]');
  const noFecho = $('[data-lojas="fecho"]');
  const sortear = $<HTMLButtonElement>('[data-sortear]');
  const falta = !ios ? '<p class="loja__depois">iPhone em breve.</p>' : !android ? '<p class="loja__depois">Android em breve.</p>' : '';

  if (qual !== 'desktop') {
    if (lojaDoAparelho) {
      // A loja do aparelho é o botão cheio; "Sortear a matéria" desce a botão de texto logo abaixo.
      const chave = qual === 'android' ? 'android' : 'ios';
      if (naAbertura) naAbertura.innerHTML = botaoDaLoja(chave, lojaDoAparelho, true);
      if (sortear) {
        sortear.classList.remove('botao--cheio', 'botao--grande');
        sortear.classList.add('botao--texto');
        naAbertura?.after(sortear);
      }
      if (noFecho) noFecho.innerHTML = botaoDaLoja(chave, lojaDoAparelho, true);
      ligarBarra(lojaDoAparelho);
      ligarTopo(lojaDoAparelho);
    } else {
      const linha = `<p class="loja__depois">${qual === 'android' ? 'Android' : 'iPhone'} em breve.</p>`;
      if (naAbertura) naAbertura.innerHTML = linha;
      if (noFecho) noFecho.innerHTML = linha;
    }
  } else {
    const contornos = [ios ? botaoDaLoja('ios', ios, false) : '', android ? botaoDaLoja('android', android, false) : ''].join('');
    if (naAbertura) naAbertura.innerHTML = contornos + falta;
    if (noFecho) {
      const primeira = ios ? botaoDaLoja('ios', ios, true) : botaoDaLoja('android', android, true);
      const segunda = ios && android ? botaoDaLoja('android', android, false) : '';
      noFecho.innerHTML = primeira + segunda + falta;
    }
    ligarTopo('#baixar');
  }
  atualizarJsonLd(ios || android);
}
