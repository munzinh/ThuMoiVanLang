"use client";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
}

export function StarField({ count = 25 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${1.5 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    }));
    setStars(generated);
  }, [count]);

  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            "--duration": s.duration,
            "--delay": s.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
