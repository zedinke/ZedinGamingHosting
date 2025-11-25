'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideshowSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
}

interface SlideshowSectionProps {
  slides: SlideshowSlide[];
  locale: string;
}

export function SlideshowSection({ slides, locale }: SlideshowSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeSlides = slides.filter((slide) => slide);

  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000); // 5 másodpercenként vált

    return () => clearInterval(interval);
  }, [isAutoPlaying, activeSlides.length]);

  if (activeSlides.length === 0) {
    return null;
  }

  const slide = activeSlides[currentSlide];

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // 10 másodperc után újra automatikus
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + activeSlides.length) % activeSlides.length);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      <div className="relative w-full h-full">
        <Image
          src={slide.image}
          alt={slide.title || 'Slide'}
          fill
          className="object-cover"
          priority={currentSlide === 0}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center text-white">
            {slide.title && (
              <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in">
                {slide.subtitle}
              </p>
            )}
            {slide.buttonText && slide.link && (
              <Link href={slide.link}>
                <Button size="lg" variant="secondary" className="animate-fade-in">
                  {slide.buttonText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
            aria-label="Előző slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
            aria-label="Következő slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

