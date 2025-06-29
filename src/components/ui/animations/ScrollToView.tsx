"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ScrollToView = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
    ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
      transition={{ duration: 0.9 }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollToView;