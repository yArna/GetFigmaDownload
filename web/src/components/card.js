import { cn } from "../lib/utils.js"

const Card = ({ className, ...props }) => (
  `<div class="${cn(
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    className
  )}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const CardHeader = ({ className, ...props }) => (
  `<div class="${cn("flex flex-col space-y-1.5 p-6", className)}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const CardTitle = ({ className, ...props }) => (
  `<h3 class="${cn(
    "text-2xl font-semibold leading-none tracking-tight",
    className
  )}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const CardDescription = ({ className, ...props }) => (
  `<p class="${cn("text-sm text-muted-foreground", className)}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const CardContent = ({ className, ...props }) => (
  `<div class="${cn("p-6 pt-0", className)}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const CardFooter = ({ className, ...props }) => (
  `<div class="${cn("flex items-center p-6 pt-0", className)}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }