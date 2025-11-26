'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideshowSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  video?: string | null;
  mediaType?: string;
  link: string | null;
  buttonText: string | null;
  isActive?: boolean;
  order?: number;
}

interface SlideshowSectionProps {
  slides: SlideshowSlide[];
  locale: string;
  transitionInterval?: number; // Váltási idő másodpercben (alapértelmezett: 5)
}

// Default game images - 7 gaming images
const defaultGameImages = [
  { 
    id: 'default-1',
    title: 'Minecraft', 
    subtitle: 'Végtelen lehetőségek, korlátlan kreativitás',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-2',
    title: 'ARK: Survival Evolved', 
    subtitle: 'Dinosszauruszokkal teli szörnyű világ',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-3',
    title: 'Rust', 
    subtitle: 'Túlélés és építkezés egyedi világban',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-4',
    title: 'Valheim', 
    subtitle: 'Viking kalandok és építkezés',
    image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-5',
    title: '7 Days to Die', 
    subtitle: 'Zombie túlélés és építkezés',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-6',
    title: 'V Rising', 
    subtitle: 'Vámpír hatalom és építkezés',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
  { 
    id: 'default-7',
    title: 'SCUM', 
    subtitle: 'Realista túlélés és PvP',
    image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1920&q=80',
    video: null,
    mediaType: 'image',
    link: null,
    buttonText: null,
  },
];

export function SlideshowSection({ slides, locale, transitionInterval: initialTransitionInterval = 5 }: SlideshowSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [transitionInterval, setTransitionInterval] = useState(initialTransitionInterval);

  // Fetch transition interval from API on mount and periodically
  useEffect(() => {
    const fetchInterval = async () => {
      try {
        const response = await fetch('/api/admin/cms/slideshow/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.transitionInterval) {
            const interval = parseInt(data.transitionInterval.toString(), 10);
            if (!isNaN(interval) && interval >= 1 && interval <= 60) {
              console.log('Slideshow: updating transition interval to', interval, 'seconds');
              setTransitionInterval(interval);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch slideshow interval:', error);
      }
    };

    fetchInterval();
    // Refresh interval every 10 seconds to pick up changes quickly
    const interval = setInterval(fetchInterval, 10000);
    return () => clearInterval(interval);
  }, []);

  // Use slides from database if available, otherwise use default images
  // Memoize to prevent unnecessary recalculations
  const activeSlides = useMemo(() => {
    return slides.length > 0 
      ? slides.filter((slide) => slide && (slide.image || slide.video) && slide.isActive !== false)
      : [];
  }, [slides]);
  
  // Always use default images if no slides from database
  const displaySlides = useMemo(() => {
    return activeSlides.length > 0 ? activeSlides : defaultGameImages;
  }, [activeSlides]);

  // Convert seconds to milliseconds - memoize to ensure useEffect updates when it changes
  const intervalMs = useMemo(() => transitionInterval * 1000, [transitionInterval]);

  // Reset current slide when slides change
  useEffect(() => {
    setCurrentSlide(0);
  }, [displaySlides.length]);

  // Auto-play slideshow
  useEffect(() => {
    if (!isAutoPlaying || displaySlides.length <= 1) {
      console.log('Slideshow: auto-play disabled or only one slide', { 
        isAutoPlaying, 
        slideCount: displaySlides.length,
        transitionInterval,
        intervalMs 
      });
      return;
    }

    console.log('Slideshow: starting auto-play', { 
      slideCount: displaySlides.length, 
      transitionInterval,
      intervalMs, 
      currentSlide 
    });

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % displaySlides.length;
        console.log('Slideshow: transitioning from slide', prev, 'to', next, 'of', displaySlides.length);
        return next;
      });
    }, intervalMs); // Váltási idő beállítása

    return () => {
      console.log('Slideshow: clearing interval');
      clearInterval(interval);
    };
  }, [isAutoPlaying, displaySlides.length, intervalMs, transitionInterval]);

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
      {/* Background media - slideshow */}
      <div className="absolute inset-0 w-full h-full z-0">
        {displaySlides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {s.mediaType === 'video' && s.video ? (
              <video
                src={s.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                key={s.id}
              />
            ) : s.image ? (
              <img
                src={s.image.startsWith('/uploads/') ? `/api${s.image}` : s.image}
                alt={s.title || 'Slide'}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                key={s.id}
                onError={(e) => {
                  console.error('Slideshow image load error:', s.image);
                  // Try API route if original failed
                  if (s.image && !s.image.startsWith('/api/') && !s.image.startsWith('http')) {
                    const apiUrl = `/api${s.image}`;
                    console.log('Retrying with API route:', apiUrl);
                    (e.target as HTMLImageElement).src = apiUrl;
                  } else {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x1080/1a1f2e/5b6fff?text=Gaming+Server';
                  }
                }}
                onLoad={() => {
                  console.log('Slideshow image loaded successfully:', s.image);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-white">No media</span>
              </div>
            )}
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

