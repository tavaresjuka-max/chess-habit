import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { PlanBlock } from '../domain';

type BlockCarouselProps = {
  blocks: PlanBlock[];
  renderBlock: (block: PlanBlock, index: number) => ReactNode;
  ariaLabel?: string;
  /** Slide inicial (ex.: o próximo bloco pendente do dia). */
  initialIndex?: number;
};

/**
 * Modo foco: um bloco grande por vez, navegável por arraste/setas/pontos
 * ("arrastar para o lado e ver os próximos passos"). Convive com um modo lista
 * ("ver lista completa") para quem prefere o panorama do dia (decisão do dono).
 */
export function BlockCarousel({
  blocks,
  renderBlock,
  ariaLabel = 'Blocos do dia',
  initialIndex = 0,
}: BlockCarouselProps) {
  const [showList, setShowList] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
    containScroll: 'trimSnaps',
    startIndex: initialIndex,
  });
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);

  // Ajusta a altura do viewport ao slide atual: sem isso o carrossel fica tão alto
  // quanto o maior bloco e sobra um vão grande abaixo dos blocos curtos (feedback
  // do dono). jsdom devolve offsetHeight 0; só fixamos altura real para não
  // esconder o conteúdo nos testes.
  const syncHeight = useCallback(() => {
    if (emblaApi === undefined) {
      return;
    }

    const slide = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()];
    const height = slide?.offsetHeight ?? 0;

    if (height > 0) {
      setViewportHeight(height);
    }
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi === undefined) {
      return;
    }

    const onSelect = (): void => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      syncHeight();
    };

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, syncHeight]);

  // Recalcula quando os blocos mudam (status/conteúdo) e ao redimensionar a tela.
  useEffect(() => {
    syncHeight();
  }, [blocks, syncHeight]);

  useEffect(() => {
    const onResize = (): void => {
      syncHeight();
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [syncHeight]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (blocks.length === 0) {
    return null;
  }

  if (showList) {
    return (
      <div className="block-carousel">
        <div className="block-carousel-toolbar">
          <button type="button" className="link-button" onClick={() => { setShowList(false); }}>
            <LayoutGrid aria-hidden="true" size={15} /> Modo foco
          </button>
        </div>
        <div className="block-list">
          {blocks.map((block, index) => (
            <div key={block.id}>{renderBlock(block, index)}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="block-carousel" role="region" aria-roledescription="carrossel" aria-label={ariaLabel}>
      <div className="block-carousel-toolbar">
        <span className="block-carousel-status" aria-live="polite">
          Bloco {selectedIndex + 1} de {blocks.length}
        </span>
        <button type="button" className="link-button" onClick={() => { setShowList(true); }}>
          <List aria-hidden="true" size={15} /> Ver lista
        </button>
      </div>

      <div
        className="block-carousel-viewport"
        ref={emblaRef}
        style={viewportHeight === undefined ? undefined : { height: viewportHeight }}
      >
        <div className="block-carousel-container">
          {blocks.map((block, index) => (
            <div
              className="block-carousel-slide"
              key={block.id}
              aria-roledescription="slide"
              aria-label={`Bloco ${String(index + 1)} de ${String(blocks.length)}`}
            >
              {renderBlock(block, index)}
            </div>
          ))}
        </div>
      </div>

      <div className="block-carousel-controls">
        <button
          type="button"
          className="block-carousel-arrow"
          aria-label="Bloco anterior"
          onClick={() => scrollPrev()}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <div className="block-carousel-dots">
          {blocks.map((block, index) => {
            const isSelected = index === selectedIndex;
            const isDone = block.status === 'done';

            return (
              <button
                key={block.id}
                type="button"
                className={`block-carousel-dot${isSelected ? ' is-selected' : ''}${isDone ? ' is-done' : ''}`}
                aria-label={`Ir para bloco ${String(index + 1)}${isDone ? ' (concluído)' : ''}`}
                aria-current={isSelected}
                onClick={() => scrollTo(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="block-carousel-arrow"
          aria-label="Próximo bloco"
          onClick={() => scrollNext()}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
