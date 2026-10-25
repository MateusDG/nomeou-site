// O site de divulgação do Nomeou: as cenas (a palavra sobe da máscara, a mão anota, o oficial bate por
// último), o sorteio da matéria com a física do app e as lojas. Script clássico (abre também do disco).
//
// GESTOS (os tempos da mão, iguais aos do app; servem de conferência na revisão):
//   bolha    marca          caneta     anel em 80 ms, miolo de 0,2 a 1 em 170 ms
//   circular escolha/total  caneta     280 ms, linear
//   riscar   erro           vermelho   2 traços de 90 ms
//   grifar   o que é seu    amarelo    220 ms, por máscara
//   nota     a regra        lápis      30 caracteres por segundo, no máximo 700 ms
//   carimbo  o oficial      verde/tinta cai de 1,25, encosta aos 110 ms
//
// CADA CENA TEM DOIS TEMPOS: a manchete (a cena entra, .is-in) e o objeto (o disco, a grade, a linha da
// Errata, o 212, as lojas: .is-objeto, quando o próprio objeto aparece). Os atrasos do objeto contam a partir
// dele, para o carimbo bater e a nota se escrever com a pessoa olhando.
(function () {
  'use strict';

  var CONFIG = {
    // Os links das lojas. Vazios, a página diz "Em breve no iPhone e no Android.".
    lojas: {
      ios: '', // https://apps.apple.com/br/app/...
      android: '', // https://play.google.com/store/apps/details?id=...
    },
  };

  var doc = document;
  var raiz = doc.documentElement;
  // A rede de segurança do <head> já tirou a classe .js (o script chegou depois de 3 s): a página segue
  // como sem script, com o risco e o grifo do CSS, e só o sorteio e as lojas ganham vida.
  var tarde = !raiz.classList.contains('js');
  var conteudo = window.NOMEOU_CONTEUDO;
  var Rabisco = window.Rabisco;
  var Disco = window.Disco;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SVG = 'http://www.w3.org/2000/svg';
  var COR = { tinta: '#16161B', folha: '#FAF8F3', caneta: '#2346C8', vermelho: '#BF2A1D', amarelo: '#FFD21A', reticula: '#E3B200', verde: '#1C7745' };

  var $ = function (sel, el) {
    return (el || doc).querySelector(sel);
  };
  var $$ = function (sel, el) {
    return Array.prototype.slice.call((el || doc).querySelectorAll(sel));
  };
  var esperar = function (ms) {
    return new Promise(function (ok) {
      setTimeout(ok, ms);
    });
  };
  var esc = function (t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var proximoQuadro = function (fn) {
    requestAnimationFrame(function () {
      requestAnimationFrame(fn);
    });
  };
  /** As fontes da marca ou o prazo, o que vier primeiro (lido na hora: uma fonte pode ter começado a carregar depois). */
  var fontesOuTempo = function (ms) {
    return Promise.race([doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve(), esperar(ms)]);
  };

  // ------------------------------------------------------------------ O carimbo (Carimbo.tsx)

  var medidor = doc.createElement('canvas').getContext('2d');
  function medir(texto, fonte) {
    medidor.font = fonte;
    return medidor.measureText(texto).width;
  }

  var contadorDeCarimbos = 0;
  /** O carimbo da repartição: League Gothic, borda dupla de cantos vivos e a tinta falhada (máscara). */
  function carimbo(texto, opcoes) {
    opcoes = opcoes || {};
    var cor = opcoes.cor || COR.tinta;
    var corpo = 25;
    var letras = texto.toLocaleUpperCase('pt-BR');
    var ls = corpo * 0.06;
    var larguraDoTexto = medir(letras, corpo + 'px "League Gothic"') + ls * letras.length;
    var BORDA = 1.2 + 2 + 2.5;
    var W = Math.ceil(larguraDoTexto + 2 * (BORDA + 10));
    var H = Math.ceil(corpo * 1.08 + 2 * (BORDA + 3));
    var base = BORDA + 3 + 0.9075 * corpo;
    var falhas = Rabisco.falhasDaTinta(W, H, Rabisco.sementeDoTexto(letras), 1.2);
    var meio = BORDA - 2.5 / 2;
    var id = 'carimbo-' + ++contadorDeCarimbos;
    return (
      '<svg class="carimbo' + (opcoes.batida ? ' carimbo--batida' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="#fff"/>' +
      '<path d="' + falhas.buracos + '" fill="#000"/><path d="' + falhas.meios + '" fill="#000" fill-opacity="0.55"/>' +
      '<path d="' + falhas.riscos + '" stroke="#000" stroke-width="0.7" stroke-opacity="0.8" fill="none"/></mask></defs>' +
      '<g mask="url(#' + id + ')" opacity="0.94">' +
      '<rect x="0.6" y="0.6" width="' + (W - 1.2) + '" height="' + (H - 1.2) + '" fill="none" stroke="' + cor + '" stroke-width="1.2"/>' +
      '<rect x="' + meio + '" y="' + meio + '" width="' + (W - 2 * meio) + '" height="' + (H - 2 * meio) + '" fill="none" stroke="' + cor + '" stroke-width="2.5"/>' +
      '<text x="' + (W / 2 + ls / 2) + '" y="' + base + '" text-anchor="middle" fill="' + cor + '" font-family="League Gothic, \'Arial Narrow\', sans-serif" font-size="' + corpo + '" letter-spacing="' + ls + '">' + esc(letras) + '</text>' +
      '</g></svg>'
    );
  }

  // ------------------------------------------------------------------ Os gestos da mão (rabisco/geometria.ts)

  function svgNo(x, y, limites, classe) {
    var s = doc.createElementNS(SVG, 'svg');
    s.setAttribute('class', classe || 'rabisco');
    s.setAttribute('viewBox', limites.x + ' ' + limites.y + ' ' + limites.largura + ' ' + limites.altura);
    s.setAttribute('width', limites.largura);
    s.setAttribute('height', limites.altura);
    s.setAttribute('aria-hidden', 'true');
    s.style.left = x + limites.x + 'px';
    s.style.top = y + limites.y + 'px';
    return s;
  }

  /** Desenha os traços de um gesto na velocidade de uma mão (strokeDashoffset), um depois do outro. */
  function tracar(svg, gesto, cor, espessura, duracao, animar, comEco) {
    var porTraco = duracao / gesto.tracos.length;
    gesto.tracos.forEach(function (d, i) {
      (comEco ? [true, false] : [false]).forEach(function (eco) {
        var p = doc.createElementNS(SVG, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', cor);
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
        p.setAttribute('stroke-width', eco ? espessura * Rabisco.ECO.espessura : espessura);
        if (eco) {
          p.setAttribute('opacity', Rabisco.ECO.opacidade);
          p.setAttribute('transform', 'translate(' + Rabisco.ECO.dx + ' ' + Rabisco.ECO.dy + ')');
        }
        var L = gesto.comprimentos[i];
        if (animar) {
          p.style.strokeDasharray = L + ' ' + L;
          p.style.strokeDashoffset = L;
          p.style.transition = 'stroke-dashoffset ' + Math.round(porTraco) + 'ms linear ' + Math.round(i * porTraco) + 'ms';
        }
        svg.appendChild(p);
        if (animar) {
          proximoQuadro(function () {
            p.style.strokeDashoffset = '0';
          });
        }
      });
    });
  }

  /** A caixa de um elemento sem o deslocamento da entrada (a palavra pode estar subindo da máscara). */
  function semDeslocamento(el) {
    var r = el.getBoundingClientRect();
    var t = getComputedStyle(el).transform;
    if (!t || t === 'none' || !window.DOMMatrixReadOnly) return r;
    var m = new DOMMatrixReadOnly(t);
    return { left: r.left - m.m41, top: r.top - m.m42, right: r.right - m.m41, width: r.width, height: r.height };
  }

  /** As linhas de um texto, em caixas relativas ao contêiner (o grifo e o risco vão linha por linha). */
  function linhasDe(el, conteiner) {
    var palavras = $$('.m > span', el);
    var faixa = doc.createRange();
    faixa.selectNodeContents(el);
    var retangulos = palavras.length ? palavras.map(semDeslocamento) : Array.prototype.slice.call(faixa.getClientRects());
    var base = conteiner.getBoundingClientRect();
    var caixas = [];
    retangulos.forEach(function (r) {
      if (r.width < 2) return;
      var ultima = caixas[caixas.length - 1];
      if (ultima && Math.abs(ultima.top - (r.top - base.top)) < r.height * 0.5) {
        ultima.right = Math.max(ultima.right, r.right - base.left);
        ultima.left = Math.min(ultima.left, r.left - base.left);
        ultima.width = ultima.right - ultima.left;
        return;
      }
      caixas.push({ left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, width: r.width, height: r.height });
    });
    return caixas;
  }

  /** O grifo amarelo atrás da manchete, correndo da esquerda para a direita (RoloDeTinta). */
  function grifar(alvo, atraso, animar) {
    var corpo = parseFloat(getComputedStyle(alvo).fontSize);
    linhasDe(alvo, alvo).forEach(function (c, n) {
      // A caixa do grifo: da linha de base −0,74 em a +0,06 em, e 0,06 em para fora de cada lado.
      var base = c.top + c.height * 0.5 + corpo * 0.33;
      var largura = c.width + corpo * 0.12;
      var altura = corpo * 0.8;
      var mancha = Rabisco.grifar(largura, altura, Rabisco.sementeDoTexto(alvo.textContent) + n);
      var s = svgNo(c.left - corpo * 0.06, base - corpo * 0.74, mancha.limites, 'grifo');
      s.innerHTML = '<path d="' + mancha.d + '" fill="' + COR.amarelo + '"/><path d="' + mancha.reforco + '" fill="' + COR.reticula + '" opacity="0.4"/>';
      if (animar) {
        s.style.clipPath = 'inset(0 100% 0 0)';
        s.style.transition = 'clip-path 220ms linear ' + (atraso + n * 220) + 'ms';
        proximoQuadro(function () {
          s.style.clipPath = 'inset(0 0 0 0)';
        });
      }
      alvo.appendChild(s);
    });
  }

  function riscar(alvo, animar) {
    // Medido e desenhado no parágrafo (um bloco): a frase pode quebrar em duas linhas no celular.
    var conteiner = alvo.parentElement;
    linhasDe(alvo, conteiner).forEach(function (c, n) {
      var gesto = Rabisco.riscar(c.width + 8, Rabisco.sementeDoTexto(alvo.textContent) + n);
      var s = svgNo(c.left - 4, c.top + c.height * 0.56, gesto.limites);
      conteiner.appendChild(s);
      tracar(s, gesto, COR.vermelho, Rabisco.ESPESSURAS.riscar * 1.4, 180, animar, false);
    });
  }

  /** O círculo de caneta em volta de um total (o 4/5 circulado do boletim do app). */
  function circularTotal(alvo, conteiner, animar) {
    var r = semDeslocamento(alvo);
    var b = conteiner.getBoundingClientRect();
    var gesto = Rabisco.circular(r.width, r.height, Rabisco.sementeDoTexto('4/5'), 3.2);
    // Atrás do número: a volta passa em torno dele e não cobre letra nenhuma.
    var s = svgNo(r.left - b.left, r.top - b.top, gesto.limites, 'rabisco rabisco--atras');
    conteiner.appendChild(s);
    tracar(s, gesto, COR.caneta, 3.2, 280, animar, true);
  }

  /** A nota a lápis escreve a 30 caracteres por segundo, em até 700 ms (NotaAMao). */
  function escrever(cena, nota, atraso) {
    var duracao = Math.min(700, Math.round((nota.textContent.length / 30) * 1000));
    nota.style.setProperty('--escrita', duracao + 'ms');
    agendar(cena, atraso, function () {
      nota.classList.add('is-escrita');
    });
  }

  function bater(lugar, texto, cor, animar) {
    lugar.innerHTML = carimbo(texto, { cor: cor, batida: animar });
    lugar.style.opacity = '1';
  }

  // ------------------------------------------------------------------ As cenas

  var cenas = $$('.cena');
  var abertura = $('[data-cena="abertura"]');
  var cenaDoDuelo = $('[data-cena="duelo"]');

  // Os timers e a geração de cada cena: pronta(), o resize e as fontes cancelam o que a entrada ainda ia
  // fazer, e um .then atrasado de uma geração velha não desenha nada.
  var timers = new Map();
  var geracoes = new Map();
  cenas.forEach(function (cena) {
    timers.set(cena, []);
    geracoes.set(cena, 0);
  });
  function agendar(cena, ms, fn) {
    // Sem atraso (o estado parado, reduzir movimento), desenha na hora: nada fica na fila para sair em dobro.
    if (!ms || calmo.matches) {
      fn();
      return;
    }
    var lista = timers.get(cena);
    var id = setTimeout(function () {
      var i = lista.indexOf(id);
      if (i >= 0) lista.splice(i, 1);
      fn();
    }, ms);
    lista.push(id);
  }
  function cancelar(cena) {
    timers.get(cena).forEach(clearTimeout);
    timers.set(cena, []);
  }
  function novaGeracao(cena) {
    var g = geracoes.get(cena) + 1;
    geracoes.set(cena, g);
    return g;
  }

  /** O que cada cena desenha além do CSS, nos seus dois tempos (os atrasos contam do começo de cada um). */
  var GESTOS = {
    duelo: {
      objeto: function (cena, animar) {
        if (animar) assentarCaneta(cena);
      },
    },
    diario: {
      objeto: function (cena, animar) {
        var total = $('[data-total]', cena);
        if (!total) return;
        agendar(cena, animar ? 1120 : 0, function () {
          circularTotal($('.m > span', total), total, animar);
        });
      },
    },
    errata: {
      cena: function (cena, animar) {
        var risco = $('[data-risco]', cena);
        if (risco) {
          agendar(cena, animar ? 700 : 0, function () {
            riscar(risco, animar);
          });
        }
      },
      objeto: function (cena, animar) {
        var sanada = $('[data-carimbo-sanada]', cena);
        if (sanada) {
          agendar(cena, animar ? 1550 : 0, function () {
            bater(sanada, 'Sanada', COR.verde, animar);
          });
        }
      },
    },
    edital: {
      cena: function (cena, animar) {
        var alvo = $('[data-grifo]', cena);
        if (alvo) grifar(alvo, animar ? 900 : 0, animar);
      },
      objeto: function (cena, animar) {
        var nota = $('[data-nota]', cena);
        if (!nota) return;
        if (animar) escrever(cena, nota, 700);
        else nota.classList.add('is-escrita');
      },
    },
  };

  function apagarGestos(cena, fase) {
    var gestos = GESTOS[cena.dataset.cena];
    if (!gestos) return;
    if (!fase || fase === 'cena') {
      if (cena.dataset.cena === 'errata') $$('.errata__frase .rabisco', cena).forEach(remover);
      if (cena.dataset.cena === 'edital') $$('.grifo', cena).forEach(remover);
    }
    if (!fase || fase === 'objeto') {
      if (cena.dataset.cena === 'diario') $$('[data-total] .rabisco', cena).forEach(remover);
    }
  }
  function remover(el) {
    el.remove();
  }

  /** Redesenha parado o que já foi desenhado (resize, fontes que chegaram tarde), fase por fase. */
  function desenharParado(cena) {
    var gestos = GESTOS[cena.dataset.cena];
    if (!gestos) return;
    var pronta = cena.dataset.estado === 'pronta';
    if (gestos.cena && (pronta || cena.classList.contains('is-in'))) {
      apagarGestos(cena, 'cena');
      gestos.cena(cena, false);
    }
    if (gestos.objeto && (pronta || cena.classList.contains('is-objeto'))) {
      apagarGestos(cena, 'objeto');
      gestos.objeto(cena, false);
    }
  }

  // O objeto que apareceu antes da manchete tocar espera por ela (no desktop, o disco começa acima do título).
  var objetosEsperando = new Set();

  function tocar(cena) {
    if (tarde || cena.dataset.estado) return;
    cena.dataset.estado = 'tocando';
    cena.classList.add('is-in');
    var g = novaGeracao(cena);
    var gestos = GESTOS[cena.dataset.cena];
    fontesOuTempo(1500).then(function () {
      if (geracoes.get(cena) !== g || !gestos || !gestos.cena) return;
      gestos.cena(cena, !calmo.matches);
    });
    if (objetosEsperando.has(cena)) {
      objetosEsperando.delete(cena);
      var gatilho = $('[data-gatilho]', cena);
      agendar(cena, Number((gatilho && gatilho.getAttribute('data-depois')) || 200), function () {
        tocarObjeto(cena);
      });
    }
  }

  function tocarObjeto(cena) {
    if (tarde || cena.classList.contains('is-objeto') || cena.dataset.estado === 'pronta') return;
    if (cena.dataset.estado !== 'tocando') {
      objetosEsperando.add(cena);
      return;
    }
    cena.classList.add('is-objeto');
    var g = geracoes.get(cena);
    var gestos = GESTOS[cena.dataset.cena];
    fontesOuTempo(1500).then(function () {
      if (geracoes.get(cena) !== g || !gestos || !gestos.objeto) return;
      gestos.objeto(cena, !calmo.matches);
    });
  }

  /** O estado final, sem transição: o que ninguém viu tocar entra parado. */
  function pronta(cena) {
    if (tarde || cena.dataset.estado === 'pronta') return;
    cena.dataset.estado = 'pronta';
    objetosEsperando.delete(cena);
    cancelar(cena);
    var g = novaGeracao(cena);
    cena.classList.add('is-pronta', 'is-in', 'is-objeto');
    if (cena === cenaDoDuelo && sorteio && sorteio.estado === 'parado') poerCaneta(sorteio.angulo);
    apagarGestos(cena);
    fontesOuTempo(1500).then(function () {
      if (geracoes.get(cena) !== g) return;
      desenharParado(cena);
    });
  }

  function iniciarCenas() {
    if (tarde) return;
    if (calmo.matches || !('IntersectionObserver' in window)) {
      cenas.forEach(pronta);
      return;
    }
    var esperas = new Map();
    // A margem de cima é enorme: o que fica acima da tela conta como interseção, e a posição decide. Assim o
    // que passou pelo alto (rolagem rápida, âncora, o "Baixar o app" do topo) entra pronto, nunca vazio.
    function aoVer(entradas, observador) {
      entradas.forEach(function (e) {
        var alvo = e.target;
        var cena = alvo.closest('.cena');
        var ehObjeto = alvo.hasAttribute('data-gatilho');
        clearTimeout(esperas.get(alvo));
        if (cena.dataset.estado === 'pronta') {
          observador.unobserve(alvo);
          return;
        }
        if (!e.isIntersecting) return;
        if (e.boundingClientRect.bottom < 0) {
          observador.unobserve(alvo);
          pronta(cena);
          return;
        }
        // Parar um instante na tela: quem passa rolando não dispara nada.
        esperas.set(
          alvo,
          setTimeout(
            function () {
              observador.unobserve(alvo);
              if (alvo.getBoundingClientRect().bottom < 0) pronta(cena);
              else if (ehObjeto) tocarObjeto(cena);
              else tocar(cena);
            },
            ehObjeto ? 150 : 300,
          ),
        );
      });
    }
    var manchetes = new IntersectionObserver(aoVer, { rootMargin: '100000px 0px -25% 0px', threshold: 0 });
    var objetos = new IntersectionObserver(aoVer, { rootMargin: '100000px 0px -15% 0px', threshold: 0 });
    cenas.forEach(function (cena) {
      if (cena === abertura || cena.dataset.estado) return;
      var titulo = $('h2', cena);
      var gatilho = $('[data-gatilho]', cena);
      if (titulo) manchetes.observe(titulo);
      if (gatilho) objetos.observe(gatilho);
    });
    // A abertura toca quando as fontes chegam, ou aos 600 ms.
    fontesOuTempo(600).then(function () {
      if (window.scrollY > window.innerHeight * 0.5) pronta(abertura);
      else tocar(abertura);
    });
  }

  /** Refaz parado o que já está no lugar, quando a largura muda ou as fontes chegam depois dos gestos. */
  function redesenhar(porResize) {
    cenas.forEach(function (cena) {
      if (!cena.dataset.estado) return;
      // No meio da entrada, o resize leva a cena ao fim; as fontes só refazem o que não tem timer na fila.
      if (cena.dataset.estado === 'tocando') {
        if (porResize) pronta(cena);
        else if (timers.get(cena).length === 0) desenharParado(cena);
        return;
      }
      desenharParado(cena);
    });
  }

  var larguraAntes = window.innerWidth;
  var esperaDoResize = null;
  window.addEventListener('resize', function () {
    if (window.innerWidth === larguraAntes) return;
    larguraAntes = window.innerWidth;
    clearTimeout(esperaDoResize);
    esperaDoResize = setTimeout(function () {
      redesenhar(true);
    }, 150);
  });
  if (doc.fonts && doc.fonts.addEventListener) {
    doc.fonts.addEventListener('loadingdone', function () {
      redesenhar(false);
    });
  }

  // ------------------------------------------------------------------ O sorteio da matéria (ritmoRoleta.ts)

  var PICO = 1.25;
  var ANTECIPACAO = { graus: -6, ms: 90 };
  var RAMPA = 60;
  var IMPULSO = { primeiro: 250, seguido: 200 };
  var FREIO = { primeiro: 1300, seguido: 950 };
  var ASSENTAR = 120;
  var DESVIO_MAX = 0.25;
  var JANELA_SEGUIDO = 45000;
  var REPOUSO = -5;
  var PRETENSAO = -4;

  var mod = function (a, n) {
    return ((a % n) + n) % n;
  };
  var curvaDoFreio = function (m) {
    return function (u) {
      return (m - 2) * u * u * u + (3 - 2 * m) * u * u + m * u;
    };
  };
  /** O ângulo do freio: o número de voltas vem da força (do peteleco), dentro da janela do app. */
  function thetaDoFreio(delta, w, Df, forca) {
    var minimo = (w * Df) / 3;
    var maximo = (2 * w * Df) / 3;
    var preferido = minimo + (typeof forca === 'number' ? forca : 0.5) * (maximo - minimo);
    var melhor = -1;
    for (var k = 0; k < 12; k++) {
      var t = 360 * k + delta;
      if (t >= minimo && t <= maximo && (melhor < 0 || Math.abs(t - preferido) < Math.abs(melhor - preferido))) melhor = t;
    }
    if (melhor >= 0) return melhor;
    return Math.max(delta, 360 * Math.round((preferido - delta) / 360) + delta);
  }
  function giroDoImpulso(ms, w) {
    if (ms <= RAMPA) return (w * ms * ms * ms) / (3 * RAMPA * RAMPA);
    return (w * RAMPA) / 3 + w * (ms - RAMPA);
  }
  /**
   * O giro inteiro, do toque à parada: recuo, rampa, impulso e o freio que só desacelera. O peteleco
   * parte do ângulo arrastado, sem o recuo (recuar = false).
   */
  function planoDoGiro(inicio, alvo, ritmo, forca, recuar) {
    var w = PICO;
    var recuo = recuar === false ? 0 : ANTECIPACAO.ms;
    var graus = recuar === false ? 0 : ANTECIPACAO.graus;
    var inicioDoFreio = recuo + IMPULSO[ritmo];
    var Df = FREIO[ritmo];
    var noImpulso = function (t) {
      if (recuo > 0 && t <= recuo) {
        var u = t / recuo;
        return inicio + graus * (1 - (1 - u) * (1 - u));
      }
      return inicio + graus + giroDoImpulso(t - recuo, w);
    };
    var anguloDoFreio = noImpulso(inicioDoFreio);
    var theta = thetaDoFreio(mod(alvo - anguloDoFreio, 360), w, Df, forca);
    var m = (w * Df) / theta;
    var p = curvaDoFreio(m);
    var final = anguloDoFreio + theta;
    var parada = inicioDoFreio + Df;
    return {
      parada: parada,
      final: final,
      angulo: function (t) {
        if (t <= inicioDoFreio) return noImpulso(t);
        if (t >= parada) return final;
        return anguloDoFreio + theta * p((t - inicioDoFreio) / Df);
      },
    };
  }

  var roda = $('[data-roda]');
  var botao = $('[data-sortear]');
  var nome = $('[data-nome]');
  var viva = $('[data-viva]');
  var lugarDaConvocacao = $('[data-carimbo-convocacao]');
  var sorteio =
    roda && conteudo && Disco && Rabisco && conteudo.roleta && conteudo.roleta.length === Disco.CONVOCACAO
      ? { estado: 'parado', angulo: REPOUSO, visivel: REPOUSO, ultimo: -Infinity, movimento: 0 }
      : null;

  function poerCaneta(a) {
    if (!roda) return;
    if (sorteio) sorteio.visivel = a;
    var caneta = $('.disco__caneta', roda);
    var sombra = $('.disco__sombra', roda);
    if (caneta) caneta.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 150 150)');
    if (sombra) sombra.setAttribute('transform', 'translate(1.5 2) rotate(' + a.toFixed(2) + ' 150 150)');
  }

  /** Leva a caneta de um ângulo a outro (ease-out). Um movimento novo cancela o anterior. */
  function levarCaneta(para, ms, depoisDe) {
    var de = sorteio.visivel;
    var este = ++sorteio.movimento;
    var inicio = null;
    function quadro(t) {
      if (sorteio.movimento !== este) return;
      if (inicio === null) inicio = t;
      var u = Math.min(1, (t - inicio) / ms);
      poerCaneta(de + (para - de) * (1 - Math.pow(1 - u, 3)));
      if (u < 1) requestAnimationFrame(quadro);
      else if (depoisDe) depoisDe();
    }
    requestAnimationFrame(quadro);
  }

  /** Na entrada, a caneta assenta 30° até a casa de PT e para: não é sorteio, não tem toc. */
  function assentarCaneta(cena) {
    if (!sorteio || sorteio.estado !== 'parado') return;
    poerCaneta(REPOUSO - 30);
    agendar(cena, 560, function () {
      if (sorteio.estado !== 'parado' || cena.dataset.estado === 'pronta') return;
      levarCaneta(REPOUSO, 420);
    });
  }

  function botaoOcupado(ocupado) {
    if (!botao) return;
    botao.textContent = ocupado ? 'Sorteando…' : 'Sortear a matéria';
    botao.setAttribute('aria-busy', String(ocupado));
    botao.setAttribute('aria-disabled', String(ocupado));
  }

  function anunciar(texto) {
    if (!viva) return;
    viva.textContent = '';
    setTimeout(function () {
      viva.textContent = texto;
    }, 30);
  }

  function sortearCasa() {
    var r = Math.random();
    var acumulado = 0;
    for (var i = 0; i < Disco.CHANCES.length; i++) {
      acumulado += Disco.CHANCES[i];
      if (r < acumulado) return i;
    }
    return Disco.CHANCES.length - 1;
  }

  /** Antes de girar: o círculo some, a casa e o véu voltam, o carimbo sai. */
  function limparRevelacao() {
    var svg = $('.disco', roda);
    var circulo = $('.disco__circulo', svg);
    var pintar = $('.disco__pintar', svg);
    var apagar = $('.disco__apagar', svg);
    circulo.style.transition = 'opacity 120ms linear';
    circulo.style.opacity = '0';
    pintar.style.transition = 'opacity 200ms linear';
    pintar.style.opacity = '0';
    apagar.style.transition = 'opacity 200ms linear';
    apagar.style.opacity = '0';
    if (lugarDaConvocacao.firstChild) {
      lugarDaConvocacao.style.transition = 'opacity 120ms linear';
      lugarDaConvocacao.style.opacity = '0';
      setTimeout(function () {
        lugarDaConvocacao.innerHTML = '';
      }, 130);
    }
  }

  /** O nome da matéria troca pela máscara: o antigo sai para cima inteiro, o novo sobe de baixo. */
  function trocarNome(texto) {
    if (calmo.matches) {
      nome.style.transition = 'opacity 120ms linear';
      nome.style.opacity = '0';
      setTimeout(function () {
        nome.textContent = texto;
        nome.style.opacity = '1';
      }, 120);
      return;
    }
    nome.style.transition = 'transform 240ms cubic-bezier(.55,0,1,.45)';
    nome.style.transform = 'translateY(-140%)';
    setTimeout(function () {
      nome.textContent = texto;
      nome.style.transition = 'none';
      nome.style.transform = 'translateY(140%)';
      proximoQuadro(function () {
        nome.style.transition = 'transform 520ms cubic-bezier(.22,1,.36,1)';
        nome.style.transform = 'none';
      });
    }, 240);
  }

  /** A revelação: o círculo de caneta na sigla, a casa que se pinta, as outras sob o véu, o nome. */
  function revelar(i, animar) {
    var materias = conteudo.roleta;
    var svg = $('.disco', roda);
    var caixa = Disco.caixaDaCasa(i, materias);
    var semente = Rabisco.sementeDoTexto((i === Disco.CONVOCACAO ? 'conv' : materias[i].sigla) + String(Math.round(performance.now())));
    var camadas = Disco.camadas(i, materias, Rabisco.circular(caixa.largura, caixa.altura, semente));
    var circulo = $('.disco__circulo', svg);
    var pintar = $('.disco__pintar', svg);
    var apagar = $('.disco__apagar', svg);

    pintar.innerHTML = camadas.pintar;
    pintar.style.transition = animar ? 'opacity 160ms linear' : 'none';
    apagar.innerHTML = camadas.apagar;
    apagar.style.transition = animar ? 'opacity 200ms linear' : 'none';
    circulo.setAttribute('transform', camadas.transform);
    circulo.innerHTML = camadas.circulo;
    circulo.style.transition = 'none';
    circulo.style.opacity = '1';
    $$('path', circulo).forEach(function (p) {
      p.style.strokeDasharray = '1';
      p.style.strokeDashoffset = animar ? '1' : '0';
      p.style.transition = animar ? 'stroke-dashoffset 280ms linear' : 'none';
    });
    proximoQuadro(function () {
      pintar.style.opacity = '1';
      apagar.style.opacity = '0.6';
      $$('path', circulo).forEach(function (p) {
        p.style.strokeDashoffset = '0';
      });
    });

    var convocacao = i === Disco.CONVOCACAO;
    anunciar('Sorteada: ' + (convocacao ? 'Convocação. Selo em jogo' : materias[i].nome) + '.');
    // O nome antigo sai aos 40 ms e o novo chega aos 280 ms, logo depois do círculo.
    setTimeout(
      function () {
        trocarNome(convocacao ? 'Convocação' : materias[i].curto);
      },
      animar ? 40 : 0,
    );
    if (convocacao) {
      setTimeout(
        function () {
          lugarDaConvocacao.style.transition = 'none';
          bater(lugarDaConvocacao, 'Selo em jogo', COR.tinta, animar);
        },
        animar ? 400 : 150,
      );
    }
    setTimeout(
      function () {
        sorteio.estado = 'parado';
        botaoOcupado(false);
      },
      animar ? 800 : 300,
    );
  }

  /** O sorteio. `forca` (0 a 1) escolhe só quantas voltas; o peteleco parte de onde o dedo deixou a caneta. */
  function sortear(forca, peteleco) {
    if (!sorteio || sorteio.estado !== 'parado') return;
    // Um toque no meio da entrada leva a cena direto ao estado final e já sorteia.
    if (cenaDoDuelo) pronta(cenaDoDuelo);
    sorteio.estado = 'girando';
    sorteio.movimento++;
    botaoOcupado(true);
    limparRevelacao();
    var agora = performance.now();
    var ritmo = agora - sorteio.ultimo < JANELA_SEGUIDO ? 'seguido' : 'primeiro';
    var i = sortearCasa();
    var casa = Disco.CASAS[i];
    var alvo = casa.centro + (2 * Math.random() - 1) * DESVIO_MAX * (casa.fim - casa.inicio);

    if (calmo.matches) {
      sorteio.angulo = mod(alvo, 360);
      poerCaneta(sorteio.angulo);
      sorteio.ultimo = performance.now();
      setTimeout(function () {
        revelar(i, false);
      }, 150);
      return;
    }

    var plano = planoDoGiro(sorteio.visivel, alvo, ritmo, forca, !peteleco);
    var t0 = performance.now();
    function quadro(t) {
      var dt = t - t0;
      if (dt >= plano.parada) {
        sorteio.angulo = mod(plano.final, 360);
        poerCaneta(sorteio.angulo);
        sorteio.ultimo = performance.now();
        setTimeout(function () {
          revelar(i, true);
        }, ASSENTAR);
        return;
      }
      poerCaneta(plano.angulo(dt));
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }

  if (sorteio) {
    roda.classList.add('is-ativo');
    if (botao) {
      botao.hidden = false;
      botao.addEventListener('click', function () {
        if (botao.getAttribute('aria-disabled') === 'true') return;
        sortear(0.5, false);
      });
    }

    // O toque e o peteleco no disco. O toque simples sorteia pelo click, que o navegador não manda quando
    // o toque só freou a rolagem; o peteleco sorteia no pointerup. O arrasto vertical rola a página
    // (touch-action: pan-y) e a pinça amplia (pinch-zoom): os dois viram pointercancel.
    var gesto = null;
    var cliqueDoArrasto = false;
    var anguloDoPonteiro = function (e) {
      var r = roda.getBoundingClientRect();
      return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    };
    var voltarCaneta = function () {
      if (sorteio.estado === 'parado' && !calmo.matches) levarCaneta(sorteio.angulo, 180);
    };
    roda.addEventListener('pointerdown', function (e) {
      if (gesto || sorteio.estado !== 'parado' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (cenaDoDuelo) pronta(cenaDoDuelo);
      cliqueDoArrasto = false;
      var a = anguloDoPonteiro(e);
      var agora = performance.now();
      gesto = { id: e.pointerId, x: e.clientX, y: e.clientY, varrido: 0, ultimoA: a, ultimoT: agora, vel: 0 };
      // O arrasto que sai do disco ainda termina nele (sem isso, o gesto ficaria preso).
      try {
        roda.setPointerCapture(e.pointerId);
      } catch (erro) {
        /* sem captura, o pointercancel ou o próximo toque resolvem */
      }
      // A caneta pré-tensiona sob o dedo, como no app.
      if (!calmo.matches) levarCaneta(sorteio.angulo + PRETENSAO, 100);
    });
    roda.addEventListener('pointermove', function (e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var a = anguloDoPonteiro(e);
      var d = a - gesto.ultimoA;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      var agora = performance.now();
      gesto.varrido += d;
      gesto.vel = Math.abs(d) / Math.max(1, agora - gesto.ultimoT);
      gesto.ultimoA = a;
      gesto.ultimoT = agora;
      // No arrasto, a caneta acompanha o dedo.
      if (!calmo.matches && Math.abs(gesto.varrido) > 2) {
        sorteio.movimento++;
        poerCaneta(sorteio.angulo + PRETENSAO + gesto.varrido);
      }
    });
    roda.addEventListener('pointerup', function (e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var movido = Math.hypot(e.clientX - gesto.x, e.clientY - gesto.y);
      var g = gesto;
      gesto = null;
      cliqueDoArrasto = movido >= 10;
      if (movido >= 10 && (Math.abs(g.varrido) >= 45 || g.vel >= 0.35)) {
        sortear(Math.min(1, Math.max(0, (g.vel - 0.35) / 0.9)), true);
        return;
      }
      // Sem sorteio (toque que freou a rolagem, arrasto curto), a caneta volta ao repouso.
      setTimeout(voltarCaneta, 80);
    });
    var desistir = function (e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      gesto = null;
      voltarCaneta();
    };
    roda.addEventListener('pointercancel', desistir);
    roda.addEventListener('lostpointercapture', desistir);
    roda.addEventListener('click', function () {
      if (cliqueDoArrasto) {
        cliqueDoArrasto = false;
        return;
      }
      sortear(0.5, false);
    });
  }

  // ------------------------------------------------------------------ As lojas

  function iniciarLojas() {
    var ios = /^https:\/\/apps\.apple\.com\//.test(CONFIG.lojas.ios) ? CONFIG.lojas.ios : '';
    var android = /^https:\/\/play\.google\.com\//.test(CONFIG.lojas.android) ? CONFIG.lojas.android : '';
    if (!ios && !android) return;
    var ua = navigator.userAgent;
    var noAndroid = /android/i.test(ua);
    var noIphone = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var botoes = [];
    if (ios) botoes.push('<a class="loja" href="' + esc(ios) + '" rel="noopener">Baixar na App Store</a>');
    if (android) botoes.push('<a class="loja" href="' + esc(android) + '" rel="noopener">Baixar no Google Play</a>');
    if (noAndroid) botoes.reverse();
    var falta = !ios ? '<p class="loja__depois">iPhone em breve.</p>' : !android ? '<p class="loja__depois">Android em breve.</p>' : '';
    $$('[data-lojas]').forEach(function (lugar) {
      lugar.innerHTML = botoes.join('') + falta;
    });
    var topo = $('[data-baixar]');
    if (topo) {
      topo.hidden = false;
      var doAparelho = noAndroid ? android : noIphone ? ios : '';
      topo.setAttribute('href', doAparelho || '#baixar');
    }
    var dados = $('#dados-do-app');
    if (dados) {
      try {
        var json = JSON.parse(dados.textContent);
        var app =
          (json['@graph'] || []).filter(function (n) {
            return n['@type'] === 'MobileApplication';
          })[0] || json;
        app.installUrl = ios || android;
        app.offers = { '@type': 'Offer', price: '0', priceCurrency: 'BRL' };
        dados.textContent = JSON.stringify(json);
      } catch (erro) {
        /* fica o JSON-LD impresso */
      }
    }
  }

  // ------------------------------------------------------------------ Partida

  try {
    iniciarLojas();
  } catch (erro) {
    /* sem lojas: fica o "Em breve" */
  }
  // Sem a gramática da margem não há gesto nem carimbo: a página fica como sem script, que já tem o risco e
  // o grifo em CSS, o SANADA impresso e o disco parado.
  if (!Rabisco || !Disco) {
    raiz.classList.remove('js');
    window.__nomeouPronto = true;
    return;
  }
  try {
    iniciarCenas();
  } catch (erro) {
    cenas.forEach(function (cena) {
      cena.classList.add('is-pronta', 'is-in', 'is-objeto');
    });
  }
  window.__nomeouPronto = true;

  // Quem chega pelo teclado não espera a entrada: a cena que recebe o foco vai ao estado final.
  doc.addEventListener('focusin', function (e) {
    var cena = e.target.closest && e.target.closest('.cena');
    if (cena) pronta(cena);
  });
  var aoMudarOMovimento = function () {
    if (calmo.matches) cenas.forEach(pronta);
  };
  if (calmo.addEventListener) calmo.addEventListener('change', aoMudarOMovimento);
  else if (calmo.addListener) calmo.addListener(aoMudarOMovimento);
  // De volta do bfcache, a cena que estava no meio da entrada termina parada; as outras seguem esperando.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    cenas.forEach(function (cena) {
      if (cena.dataset.estado === 'tocando') pronta(cena);
    });
  });
})();
