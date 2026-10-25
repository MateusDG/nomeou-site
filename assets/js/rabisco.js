// A gramática da margem do app (turno-concurso/src/components/rabisco/geometria.ts), transpilada por
// scripts/dados-do-app.mjs sem mudança de comportamento: mesma semente, mesmo traço. Não edite à mão.
(function () {
/**
 * A gramática da margem em geometria pura (seção 6 da direção da rodada 3). Cada gesto da mão vira
 * caminhos SVG a partir de uma semente: circular (escolha), grifar (o que é seu), sublinhar e
 * sublinhar duas vezes (o dado que importa), riscar (erro), ondular (pegadinha), visto (conferido),
 * seta (liga a nota ao fato) e rubrica (dia estudado). Mesma semente e mesma medida, mesmo traço em
 * qualquer aparelho: o círculo do órgão sai igual no Android e no iPhone, e o teste confere.
 *
 * Sem React e sem imports: `scripts/gerar-rabiscos.mjs` usa estas mesmas funções para gerar o
 * catálogo fixo (`src/theme/rabiscos.ts`), e os componentes de `Rabisco.tsx` as chamam com a medida do
 * texto (onTextLayout). Nada de estrela, coração, raio ou exclamação: o conjunto é fechado.
 *
 * Unidades: px. A origem é o canto de cima à esquerda da caixa do texto (no círculo e no grifo) ou o
 * começo da linha de base (no sublinhado, no risco, no ondulado e na rubrica). O gesto pode sair da
 * caixa (o círculo passa dela); `limites` diz o retângulo que ele ocupa, já com a meia espessura do
 * traço e o eco da esferográfica.
 */
/** Espessura de cada traço (px), por gesto. O lápis é mais fino que a caneta. */
const ESPESSURAS = {
    circular: 2.4,
    riscar: 2,
    ondular: 1.5,
    visto: 2,
    sublinhar: 1.4,
    seta: 1.4,
    rubrica: 1.3,
};
/**
 * O eco da esferográfica: um segundo traço fino, deslocado e mais claro, por baixo do principal (a
 * tinta que a bolinha deixa a mais de um lado). Quem desenha aplica; os limites já contam com ele.
 */
const ECO = { dx: 0.4, dy: 0.35, espessura: 0.42, opacidade: 0.45 };
const TAU = Math.PI * 2;
/** Um décimo de px basta: o caminho fica curto e igual em qualquer motor de JS. */
const arred = (n) => {
    const v = Math.round(n * 10) / 10;
    return v === 0 ? 0 : v;
};
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/**
 * Gerador da semente (xorshift32): só operações inteiras, então a sequência é a mesma no Hermes, no
 * V8 e no JavaScriptCore.
 */
function criarSemente(semente) {
    let s = Math.imul((Math.trunc(semente) | 0) + 1, 2654435761) >>> 0 || 1;
    return () => {
        s ^= s << 13;
        s >>>= 0;
        s ^= s >>> 17;
        s ^= s << 5;
        s >>>= 0;
        return s / 4294967296;
    };
}
/**
 * Semente estável de um texto (FNV-1a): o mesmo órgão ganha sempre o mesmo círculo, e textos
 * diferentes ganham círculos diferentes.
 */
function sementeDoTexto(texto) {
    let h = 0x811c9dc5;
    for (let i = 0; i < texto.length; i++) {
        h ^= texto.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h % 1000003;
}
/** Ruído lento e liso (três senoides de fase sorteada): a mão que treme pouco, nunca aos saltos. */
function ruido(r) {
    const a = r() * TAU;
    const b = r() * TAU;
    const c = r() * TAU;
    return (t) => Math.sin(t * 1.3 + a) * 0.6 + Math.sin(t * 2.9 + b) * 0.3 + Math.sin(t * 5.1 + c) * 0.1;
}
/**
 * Curva lisa que passa por todos os pontos (Catmull-Rom convertida em Bézier cúbicas). A curva fica
 * dentro dos pontos de controle, então os limites saem deles.
 */
function curva(pts) {
    const q = pts.map(([x, y]) => [arred(x), arred(y)]);
    let d = `M${q[0][0]},${q[0][1]}`;
    let comprimento = 0;
    const pontos = [q[0]];
    for (let i = 0; i < q.length - 1; i++) {
        const p0 = q[i - 1] ?? q[i];
        const p1 = q[i];
        const p2 = q[i + 1];
        const p3 = q[i + 2] ?? p2;
        const c1 = [arred(p1[0] + (p2[0] - p0[0]) / 6), arred(p1[1] + (p2[1] - p0[1]) / 6)];
        const c2 = [arred(p2[0] - (p3[0] - p1[0]) / 6), arred(p2[1] - (p3[1] - p1[1]) / 6)];
        d += `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
        comprimento += dist(p1, c1) + dist(c1, c2) + dist(c2, p2);
        pontos.push(c1, c2, p2);
    }
    return { d, comprimento: Math.ceil(comprimento) + 1, pontos };
}
/** Linha reta por pontos (a ponta da seta). */
function reta(pts) {
    const q = pts.map(([x, y]) => [arred(x), arred(y)]);
    let comprimento = 0;
    for (let i = 1; i < q.length; i++)
        comprimento += dist(q[i - 1], q[i]);
    return { d: 'M' + q.map((p) => `${p[0]},${p[1]}`).join('L'), comprimento: Math.ceil(comprimento) + 1, pontos: q };
}
/** O retângulo dos pontos com `margem` de folga, em px inteiros por fora. */
function caixa(pontos, margem) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of pontos) {
        if (x < x0)
            x0 = x;
        if (y < y0)
            y0 = y;
        if (x > x1)
            x1 = x;
        if (y > y1)
            y1 = y;
    }
    const x = Math.floor(x0 - margem);
    const y = Math.floor(y0 - margem);
    return { x, y, largura: Math.ceil(x1 + margem) - x, altura: Math.ceil(y1 + margem) - y };
}
/** A folga dos limites: meia espessura, o eco e meio px de arredondamento. */
const margemDo = (espessura) => espessura / 2 + Math.hypot(ECO.dx, ECO.dy) + 0.5;
function gesto(tracos, espessura) {
    return {
        tracos: tracos.map((t) => t.d),
        comprimentos: tracos.map((t) => t.comprimento),
        limites: caixa(tracos.flatMap((t) => t.pontos), margemDo(espessura)),
    };
}
/** Linha à mão de `de` até `para`: um arco leve (a mão não é régua) e um tremor pequeno. */
function linhaAMao(de, para, r, { arco = 0.015, tremor = 0.5 } = {}) {
    const nz = ruido(r);
    const len = dist(de, para) || 1;
    const nx = -(para[1] - de[1]) / len;
    const ny = (para[0] - de[0]) / len;
    const b = (r() - 0.5) * 2 * arco * len;
    const n = Math.round(limitar(len / 14, 4, 24));
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const u = i / n;
        const off = b * 4 * u * (1 - u) + tremor * nz(u * 5);
        pts.push([de[0] + (para[0] - de[0]) * u + nx * off, de[1] + (para[1] - de[1]) * u + ny * off]);
    }
    return pts;
}
// ---------------------------------------------------------------------------
// Os gestos
/** sinal(c) · |c|^e: o cosseno da superelipse. */
const potencia = (c, e) => Math.sign(c) * Math.abs(c) ** e;
/**
 * Circular (escolha, caneta): uma volta e um pouco em volta da caixa `largura` × `altura`, sem fechar
 * perfeito. Começa à esquerda, passa do ponto de partida e termina um pouco mais aberta (a mão que
 * relaxa). Em texto comprido, a volta vira uma superelipse (mais cheia nos cantos), para os cantos do
 * texto ficarem dentro sem a volta ficar alta demais. A inclinação vem da semente, com teto para o
 * texto longo não sair pelo canto.
 */
function circular(largura, altura, semente = 1, espessura = ESPESSURAS.circular) {
    const r = criarSemente(semente);
    const nz = ruido(r);
    const meiaL = largura / 2;
    const meiaA = altura / 2;
    const folgaX = limitar(altura * 0.5, 6, 18);
    const folgaY = limitar(altura * 0.3, 4, 10);
    // Quanto mais comprido o texto, mais quadrada a volta (expoente de 2, a elipse, até 2,7).
    const expoente = 2 + limitar((largura / Math.max(1, altura) - 1.5) / 4.5, 0, 1) * 0.7;
    /**
     * A menor altura da volta que, com o giro dado, ainda deixa os quatro cantos do texto dentro, com
     * 2 px de folga (o canto passado para o eixo da volta tem de caber na superelipse).
     */
    const alturaMinima = (giro, rx) => {
        let minima = 0;
        for (const [sx, sy] of [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ]) {
            const x = sx * meiaL;
            const y = sy * meiaA;
            const xr = Math.abs(x * Math.cos(giro) + y * Math.sin(giro)) + 2;
            const yr = Math.abs(-x * Math.sin(giro) + y * Math.cos(giro)) + 2;
            const sobra = 1 - (xr / rx) ** expoente;
            if (sobra <= 0.02)
                return Infinity;
            minima = Math.max(minima, yr / sobra ** (1 / expoente));
        }
        return minima;
    };
    // A volta não passa de 16 px acima e abaixo do texto: o giro sorteado diminui (e, se preciso, a
    // volta alarga) até caber.
    const teto = meiaA + 16;
    let rx = meiaL + folgaX;
    let giro = (-(1.5 + r() * 4) * Math.PI) / 180;
    let minima = alturaMinima(giro, rx);
    for (let i = 0; i < 12 && minima > teto; i++) {
        giro *= 0.6;
        minima = alturaMinima(giro, rx);
    }
    for (let i = 0; i < 40 && minima > teto; i++) {
        rx += 3;
        minima = alturaMinima(giro, rx);
    }
    const ry = Math.max(meiaA + folgaY, minima);
    const cx = meiaL;
    const cy = meiaA;
    const inicio = 195 + r() * 25;
    const volta = 372 + r() * 22;
    // Tremor e abertura em px, com teto: num órgão de 300 px, 3,5% do raio entraria no texto. A volta
    // só abre (nunca fecha para dentro), então o começo não encosta na letra.
    const tremor = Math.min(0.035 * rx, 2);
    const abertura = Math.min(0.07 * rx, 4.5);
    const perimetro = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = Math.round(limitar(perimetro / 8, 28, 90));
    const e = 2 / expoente;
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const u = i / n;
        const a = ((inicio + volta * u) * Math.PI) / 180;
        const delta = tremor * (nz(u * TAU) + 1) * 0.5 + abertura * u;
        const x = (rx + delta) * potencia(Math.cos(a), e);
        const y = (ry + delta * 0.6) * potencia(Math.sin(a), e);
        pts.push([cx + x * Math.cos(giro) - y * Math.sin(giro), cy + x * Math.sin(giro) + y * Math.cos(giro)]);
    }
    return gesto([curva(pts)], espessura);
}
/** Sublinhar (lápis): uma linha à mão sob o texto, na linha de base (y = 0), subindo de leve. */
function sublinhar(largura, semente = 1, espessura = ESPESSURAS.sublinhar) {
    const r = criarSemente(semente);
    const sobe = 0.6 + r() * 0.8;
    return gesto([curva(linhaAMao([-2, 0], [largura + 2, -sobe], r))], espessura);
}
/**
 * Sublinhar duas vezes (o dado que importa, lápis): a segunda linha 4,5 px abaixo, começando um pouco
 * depois e terminando um pouco antes, como quem volta sobre o mesmo trecho.
 */
function sublinharDuasVezes(largura, semente = 1, espessura = ESPESSURAS.sublinhar) {
    const r = criarSemente(semente);
    const primeira = linhaAMao([-2, 0], [largura + 2, -(0.6 + r() * 0.8)], r);
    const segunda = linhaAMao([1.5 + r() * 2, 4.5], [largura + 1 - r() * 3, 3.6 + r() * 0.6], r);
    return gesto([curva(primeira), curva(segunda)], espessura);
}
/**
 * Riscar (erro, vermelho): dois traços rápidos sobre o meio da linha (y = 0), o de ida subindo e o
 * de volta um pouco abaixo, como quem risca a alternativa errada na prova.
 */
function riscar(largura, semente = 1, espessura = ESPESSURAS.riscar) {
    const r = criarSemente(semente);
    const ida = linhaAMao([-3, 1.5 + r()], [largura + 3, -2 - r() * 1.2], r, { arco: 0.01, tremor: 0.4 });
    const volta = linhaAMao([largura + 2, 0.4 + r() * 0.6], [-2, 2.6 + r() * 1.2], r, { arco: 0.012, tremor: 0.4 });
    return gesto([curva(ida), curva(volta)], espessura);
}
/**
 * Ondular (a pegadinha, vermelho): a onda miúda sob o trecho (y = 0), de `amplitude` px e um vale a
 * cada `passo` px.
 */
function ondular(largura, semente = 1, espessura = ESPESSURAS.ondular, amplitude = 1.6, passo = 5) {
    const r = criarSemente(semente);
    const pts = [];
    const meio = passo / 2;
    const n = Math.max(2, Math.round((largura + 2) / meio));
    for (let i = 0; i <= n; i++) {
        const x = -1 + ((largura + 2) * i) / n;
        const lado = i % 2 ? 1 : -1;
        pts.push([x, lado * amplitude * (0.85 + r() * 0.3)]);
    }
    return gesto([curva(pts)], espessura);
}
/**
 * Visto (conferido, caneta), num quadrado de `tamanho` px: a perna curta desce, a longa sobe e passa
 * um pouco da caixa, como o visto que sai da caixinha.
 */
function visto(tamanho, semente = 1, espessura = ESPESSURAS.visto) {
    const r = criarSemente(semente);
    const s = tamanho;
    const j = () => (r() - 0.5) * s * 0.06;
    const p = [
        [0, s * 0.45 + j()],
        [s * 0.12, s * 0.55],
        [s * 0.24, s * 0.72],
        [s * 0.34, s * 0.92],
        [s * 0.5, s * 0.5 + j()],
        [s * 0.75, s * 0.12],
        [s * 1.08, -s * 0.12 + j()],
    ].map(([x, y]) => [arred(x), arred(y)]);
    const d = `M${p[0][0]},${p[0][1]}C${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}C${p[4][0]},${p[4][1]} ${p[5][0]},${p[5][1]} ${p[6][0]},${p[6][1]}`;
    let comprimento = 0;
    for (let i = 1; i < p.length; i++)
        comprimento += dist(p[i - 1], p[i]);
    return gesto([{ d, comprimento: Math.ceil(comprimento) + 1, pontos: p }], espessura);
}
/**
 * Seta (liga a nota ao fato, lápis ou caneta): a haste curva de `de` até `para` e a ponta aberta, em
 * dois traços (a haste e depois a ponta). `curvatura` é a barriga da haste em fração do comprimento
 * (o sinal escolhe o lado).
 */
function seta(de, para, semente = 1, espessura = ESPESSURAS.seta, curvatura = 0.18, ponta = 7) {
    const r = criarSemente(semente);
    const nz = ruido(r);
    const len = dist(de, para) || 1;
    const nx = -(para[1] - de[1]) / len;
    const ny = (para[0] - de[0]) / len;
    const barriga = curvatura * len;
    const meio = [(de[0] + para[0]) / 2 + nx * barriga, (de[1] + para[1]) / 2 + ny * barriga];
    const n = Math.round(limitar(len / 8, 4, 16));
    const haste = [];
    for (let i = 0; i <= n; i++) {
        const u = i / n;
        const a = (1 - u) * (1 - u);
        const b = 2 * u * (1 - u);
        const c = u * u;
        const tremor = i === 0 || i === n ? 0 : 0.35 * nz(u * 4);
        haste.push([a * de[0] + b * meio[0] + c * para[0] + nx * tremor, a * de[1] + b * meio[1] + c * para[1] + ny * tremor]);
    }
    const fim = haste[haste.length - 1];
    const antes = haste[haste.length - 2];
    const ang = Math.atan2(fim[1] - antes[1], fim[0] - antes[0]);
    const abre = 0.45 + r() * 0.1;
    const h1 = [fim[0] - ponta * Math.cos(ang - abre), fim[1] - ponta * Math.sin(ang - abre)];
    const h2 = [fim[0] - ponta * 0.9 * Math.cos(ang + abre), fim[1] - ponta * 0.9 * Math.sin(ang + abre)];
    return gesto([curva(haste), reta([h1, fim, h2])], espessura);
}
/**
 * Rubrica (dia estudado, caneta), na linha de base (y = 0): três ou quatro laços que andam para a
 * direita e encolhem, o arremate para cima e o traço de baixo. `altura` é a do laço mais alto.
 */
function rubrica(largura, semente = 1, espessura = ESPESSURAS.rubrica, altura = 13) {
    const r = criarSemente(semente);
    const k = altura / 13;
    const voltas = 3 + Math.floor(r() * 2);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        const t = u * voltas * TAU;
        pts.push([u * largura * 0.8 + Math.cos(t) * 3 * (1 - u * 0.4), -Math.sin(t) * (6.5 - u * 3) * (0.8 + r() * 0.3) * k]);
    }
    pts.push([largura * 0.85, 1.5 * k], [largura, -3 * k]);
    const traco = linhaAMao([-2, 5 * k], [largura + 2, 3.5 * k], r, { tremor: 0.4 });
    return gesto([curva(pts), curva(traco)], espessura);
}
/**
 * Grifar (o que é seu, amarelo): a mancha chapada do marca-texto de ponta chanfrada sobre a caixa
 * `largura` × `altura`, passando 5 px de cada lado, subindo de leve para a direita. O `reforco` é a
 * tinta que empoça onde a ponta encostou primeiro (pintado por cima, mais escuro e translúcido).
 */
function grifar(largura, altura, semente = 1) {
    const r = criarSemente(semente);
    const nz = ruido(r);
    const esquerda = -5;
    const direita = largura + 5;
    const w = direita - esquerda;
    const chanfro = Math.min(altura * 0.28, 7);
    const n = Math.max(6, Math.round(w / 18));
    const cima = [];
    const baixo = [];
    for (let i = 0; i <= n; i++) {
        const u = i / n;
        cima.push([esquerda + chanfro + (w - chanfro) * u, 1 + nz(u * 4) * altura * 0.05 + (r() - 0.5) * 0.5 - u * 0.6]);
    }
    for (let i = n; i >= 0; i--) {
        const u = i / n;
        baixo.push([esquerda + (w - chanfro) * u, altura - 1 + nz(u * 4 + 2) * altura * 0.06 + (r() - 0.5) * 0.5 - u * 0.6]);
    }
    const poligono = [...cima, ...baixo].map(([x, y]) => [arred(x), arred(y)]);
    const d = 'M' + poligono.map((p) => `${p[0]},${p[1]}`).join('L') + 'Z';
    const reforcoPts = [
        [esquerda + chanfro * 0.9, 1.4],
        [esquerda + Math.min(30, w * 0.25), 1.2],
        [esquerda + Math.min(26, w * 0.22), altura - 1],
        [esquerda, altura - 0.8],
    ].map(([x, y]) => [arred(x), arred(y)]);
    const reforco = 'M' + reforcoPts.map((p) => `${p[0]},${p[1]}`).join('L') + 'Z';
    return { d, reforco, limites: caixa([...poligono, ...reforcoPts], 0.5) };
}
const bolinha = (x, y, raio) => {
    const [a, b, c] = [arred(x - raio), arred(y), arred(raio)];
    return `M${a},${b}a${c},${c} 0 1,0 ${arred(2 * raio)},0a${c},${c} 0 1,0 ${arred(-2 * raio)},0`;
};
/**
 * Onde a tinta do carimbo falha, numa caixa de `largura` × `altura`: mais perto da borda (onde a
 * borracha encosta com menos força) e esparso no meio. Vai numa máscara (preto fura), e não por cima
 * em cor de papel: assim o carimbo falha certo sobre o papel, a folha ou o amarelo.
 */
function falhasDaTinta(largura, altura, semente = 1, densidade = 1) {
    const r = criarSemente(semente);
    const n = Math.round(limitar(((largura * altura) / 70) * densidade, 16, 160));
    const borda = Math.min(7, altura * 0.25);
    const buracos = [];
    const meios = [];
    for (let i = 0; i < n; i++) {
        const naBorda = r() < 0.6;
        let x = r() * largura;
        let y = r() * altura;
        if (naBorda) {
            const lado = Math.floor(r() * 4);
            if (lado === 0)
                y = r() * borda;
            else if (lado === 1)
                y = altura - r() * borda;
            else if (lado === 2)
                x = r() * borda;
            else
                x = largura - r() * borda;
        }
        const raio = 0.35 + r() * r() * 1.1;
        (r() < 0.55 ? buracos : meios).push(bolinha(x, y, raio));
    }
    const riscos = [];
    for (let i = 0; i < 2; i++) {
        const y = altura * (0.25 + r() * 0.5);
        const x = r() * largura * 0.6;
        const w = largura * (0.12 + r() * 0.2);
        riscos.push(`M${arred(x)},${arred(y)}L${arred(x + w)},${arred(y - 0.6 + r() * 1.2)}`);
    }
    return { buracos: buracos.join(''), meios: meios.join(''), riscos: riscos.join('') };
}

window.Rabisco = { ESPESSURAS, ECO, criarSemente, sementeDoTexto, circular, sublinhar, sublinharDuasVezes, riscar, ondular, visto, seta, rubrica, grifar, falhasDaTinta };
})();
