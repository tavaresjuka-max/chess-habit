import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { PlanBlock } from '../domain';

type BlockCarouselProps = {
  blocks: PlanBlock[];
  renderBlock: (block: PlanBlock, index: number) => ReactNode;
  ariaLabel?: string;
};

/**
 * Modo foco: um bloco grande por vez, navegável por arraste/setas/pontos
 * ("arrastar para o lado e ver os próximos passos"). Convive com um modo lista
 * ("ver lista completa") para quem prefere o panorama do dia (decisão do dono).
 */
export function BlockCarousel({ blocks, renderBlock, ariaLabel = 'Blocos do dia' }: BlockCarouselProps) {
  const [showList, setShowList] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center', containScroll: 'trimSnaps' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (emblaApi === undefined) {
      return;
    }

    const onSelect = (): void => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

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

      <div className="block-carousel-viewport" ref={emblaRef}>
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
          {blocks.map((block, index) => (
            <button
              key={block.id}
              type="button"
              className={`block-carousel-dot${index === selectedIndex ? ' is-selected' : ''}`}
              aria-label={`Ir para bloco ${String(index + 1)}`}
              aria-current={index === selectedIndex}
              onClick={() => scrollTo(index)}
            />
          ))}
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
