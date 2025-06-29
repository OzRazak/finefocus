"use client";

import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import Link from "next/link";
import { Url } from "next/dist/shared/lib/router/router";
import { AnchorHTMLAttributes } from "react";

type AnimatedButtonProps = ButtonProps & {
    children: React.ReactNode;
    className?: string;
    href?: Url;
    asChild?: boolean;
};

const AnimatedButton = ({ children, className, href, asChild, ...props }: AnimatedButtonProps) => {
    const MotionButton = motion(Button);
    if (asChild) {
        return (
            <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
            {...props}
            >
                <Link href={href ?? "/"}>
                    {children}
                </Link>
            </MotionButton>
        )
    }
  return (
    <MotionButton
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </MotionButton>
  );
};

export default AnimatedButton;
