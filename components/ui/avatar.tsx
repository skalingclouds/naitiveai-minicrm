import * as React from "react";
import { cn } from "../../lib/utils";

// Simple context to handle image loading errors between AvatarImage and AvatarFallback
const AvatarContext = React.createContext<{ 
  hasError: boolean; 
  setHasError: (error: boolean) => void; 
} | null>(null);

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <AvatarContext.Provider value={{ hasError, setHasError }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt, ...props }, ref) => {
  const context = React.useContext(AvatarContext);

  if (context?.hasError) {
    return null;
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onError={() => context?.setHasError(true)}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(AvatarContext);

  // In this simple implementation, if there is no error, we assume the image is showing.
  // We only show fallback if there is an error.
  if (!context?.hasError) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback, AvatarImage };
