// Os utilitários de sempre: buscar no DOM, esperar, o próximo quadro e o escape de texto.

export const doc = document;

export function $<T extends Element = HTMLElement>(seletor: string, dentro: ParentNode = doc): T | null {
  return dentro.querySelector<T>(seletor as never) as T | null;
}

export function $$<T extends Element = HTMLElement>(seletor: string, dentro: ParentNode = doc): T[] {
  return Array.from(dentro.querySelectorAll(seletor)) as T[];
}

export function esperar(ms: number): Promise<void> {
  return new Promise((ok) => setTimeout(ok, ms));
}

/** Dois quadros: o estilo inicial já foi aplicado e a transição vai correr. */
export function proximoQuadro(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function esc(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** As fontes da marca ou o prazo, o que vier primeiro (lido na hora: uma fonte pode ter começado depois). */
export function fontesOuTempo(ms: number): Promise<unknown> {
  return Promise.race([doc.fonts?.ready ?? Promise.resolve(), esperar(ms)]);
}

/** Um anúncio para o leitor de tela numa região viva: limpa e escreve, para repetir o mesmo texto. */
export function anunciar(regiao: Element | null, texto: string): void {
  if (!regiao) return;
  regiao.textContent = '';
  setTimeout(() => {
    regiao.textContent = texto;
  }, 30);
}
