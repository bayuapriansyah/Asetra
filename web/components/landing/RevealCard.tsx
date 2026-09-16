"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { ReactNode, RefObject } from "react";

interface RevealCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
}

/**
 * Scroll-triggered card reveal with scale + parallax effect.
 * Cards start at 0.95 scale and grow to 1.0 while parallaxing up.
 * Sequential stagger based on index.
 */
export function RevealCard({ children, className, delay = 0, index = 0 }: RevealCardProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const staggerDelay = delay + index * 0.12;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.8,
        delay: staggerDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
