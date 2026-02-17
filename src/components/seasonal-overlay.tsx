"use client";

import { useEffect, useState } from 'react';

interface SeasonalOverlayProps {
  effect: 'snow' | 'confetti' | 'sparkles' | 'leaves' | 'hearts';
}

export function SeasonalOverlay({ effect }: SeasonalOverlayProps) {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Erstelle 30 Partikel mit zufälligen Positionen und Timings
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
    }));
    setParticles(newParticles);
  }, [effect]);

  const getEmoji = () => {
    switch (effect) {
      case 'snow':
        return ['❄️', '❅', '❆', '⛄', '☃️'];
      case 'confetti':
        return ['🎊', '🎉', '🎈', '✨', '🎭', '🎪', '🎨'];
      case 'sparkles':
        return ['✨', '⭐', '💫', '🌟', '⚡'];
      case 'leaves':
        return ['🍂', '🍁', '🍃'];
      case 'hearts':
        return ['💝', '💖', '💕', '💗', '❤️'];
      default:
        return ['✨'];
    }
  };

  const emojis = getEmoji();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        return (
          <div
            key={particle.id}
            className="absolute text-3xl opacity-90"
            style={{
              left: `${particle.left}%`,
              top: '-10vh',
              animation: `seasonal-fall ${particle.duration}s linear ${particle.delay}s infinite`,
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
}
