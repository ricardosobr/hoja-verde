import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:shadow-lg",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-brand hover:bg-primary/90 hover:shadow-brand-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-hoja-verde-400 hover:shadow-brand",
        secondary:
          "bg-secondary text-secondary-foreground shadow-brand hover:bg-secondary/80 hover:shadow-brand-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced brand variants
        brand:
          "bg-gradient-to-r from-hoja-verde-700 to-hoja-verde-600 text-brand-cream shadow-brand hover:from-hoja-verde-800 hover:to-hoja-verde-700 hover:shadow-brand-lg",
        sage:
          "bg-gradient-to-r from-brand-sage to-hoja-verde-400 text-white shadow-brand hover:from-brand-sage/90 hover:to-hoja-verde-400/90 hover:shadow-brand-lg",
        earth:
          "bg-gradient-to-r from-brand-earth to-brand-copper text-white shadow-brand hover:from-brand-earth/90 hover:to-brand-copper/90 hover:shadow-brand-lg",
        cream:
          "bg-brand-cream text-hoja-verde-700 border-2 border-hoja-verde-200 shadow-sm hover:bg-white hover:border-hoja-verde-300 hover:shadow-brand",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        icon: "h-10 w-10",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }