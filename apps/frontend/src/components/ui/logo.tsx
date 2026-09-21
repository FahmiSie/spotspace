import React from "react";
import Image from "next/image";
import { cn } from "cn";

interface LogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * 'light' = Logo for dark backgrounds (white text, white card, dark S)
   * 'dark' = Logo for light backgrounds (dark text, dark card, white S)
   */
  variant?: "light" | "dark";
}

export function Logo({ variant = "dark", className, ...props }: LogoProps) {
  const isLight = variant === "light";
  
  return (
    <div className={cn("relative flex items-center", className)} {...props}>
      <Image
        src={isLight ? "/images/spotspace-logo-light.svg" : "/images/spotspace-logo.svg"}
        alt="SpotSpace Logo"
        width={140}
        height={30}
        className="w-auto h-full object-contain"
        priority
      />
    </div>
  );
}
