export const DEFAULT_INSPIRE = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop",
];

export function defaultInspireItems() {
  return DEFAULT_INSPIRE.map((url, index) => ({
    id: `default-${index}`,
    url,
    title: "Default",
    active: true,
    isDefault: true,
  }));
}
