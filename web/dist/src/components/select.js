import { cn } from "../lib/utils.js"

const Select = ({ className, ...props }) => (
  `<select class="${cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

const SelectItem = ({ className, value, ...props }) => (
  `<option value="${value}" class="${cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>`
)

export { Select, SelectItem }