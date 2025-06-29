"use client";

import { motion } from 'framer-motion';

const dots = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const dot = {
  visible: {
    opacity: [0.5, 1, 0.5],
    y: [0, -4, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const LoadingDots = () => (
  <motion.div
    variants={dots}
    initial="hidden"
    animate="visible"
    className="flex items-center"
  >
    <motion.span variants={dot} className="h-2 w-2 mx-0.5 bg-current rounded-full" />
    <motion.span variants={dot} className="h-2 w-2 mx-0.5 bg-current rounded-full" />
    <motion.span variants={dot} className="h-2 w-2 mx-0.5 bg-current rounded-full" />
  </motion.div>
);
