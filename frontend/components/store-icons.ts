import { Coffee, Cookie, Flame, IceCreamCone, Salad, type LucideIcon } from "lucide-react"
import type { StoreIcon } from "@/lib/stores"

export const storeIcons: Record<StoreIcon, LucideIcon> = {
  coffee: Coffee,
  flame: Flame,
  salad: Salad,
  "ice-cream": IceCreamCone,
  cookie: Cookie,
}
