'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideshowSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  isActive?: boolean;
  order?: number;
}

interface SlideshowSectionProps {
  slides: SlideshowSlide[];
  locale: string;
}

// Default game images - 7 gaming images
const defaultGameImages = [
  { 
    id: 'default-1',
    title: 'Minecraft', 
    subtitle: 'Végtelen lehetőségek, korlátlan kreativitás',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-2',
    title: 'ARK: Survival Evolved', 
    subtitle: 'Dinosszauruszokkal teli szörnyű világ',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-3',
    title: 'Rust', 
    subtitle: 'Túlélés és építkezés egyedi világban',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-4',
    title: 'Valheim', 
    subtitle: 'Viking kalandok és építkezés',
    image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-5',
    title: '7 Days to Die', 
    subtitle: 'Zombie túlélés és építkezés',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-6',
    title: 'V Rising', 
    subtitle: 'Vámpír hatalom és építkezés',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-7',
    title: 'SCUM', 
    subtitle: 'Realista túlélés és PvP',
    image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1920&q=80',
    link: null,
    buttonText: null,
  },
];

export function SlideshowSection({ slides, locale }: SlideshowSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Use slides from database if available, otherwise use default images
  const activeSlides = slides.length > 0 
    ? slides.filter((slide) => slide && slide.image)
    : defaultGameImages;
  
  // Always use default images if no slides from database
  const displaySlides = activeSlides.length > 0 ? activeSlides : defaultGameImages;

  useEffect(() => {
    if (!isAutoPlaying || displaySlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, 5000); // 5 másodpercenként vált

    return () => clearInterval(interval);
  }, [isAutoPlaying, displaySlides.length]);

  if (displaySlides.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // 10 másodperc után újra automatikus
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % displaySlides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + displaySlides.length) % displaySlides.length);
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-white">
      {/* Background images - slideshow */}
      <div className="absolute inset-0 w-full h-full z-0">
        {displaySlides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={s.image}
              alt={s.title || 'Slide'}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x1080/1a1f2e/5b6fff?text=Gaming+Server';
              }}
            />
          </div>
        ))}
        {/* 30% dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </div>

      {/* Navigation arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
            aria-label="Előző slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
            aria-label="Következő slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75 w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

