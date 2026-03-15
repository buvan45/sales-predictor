import type { Variants } from 'framer-motion';

export const containerVars: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      staggerChildren: 0.05,
    },
  },
};

export const itemVars: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};
