# Loading Skeletons

Skeleton loading is centralized in `@food/components/ui/loading-skeletons`.

Primary presets:
- `AppShellSkeleton`: route transitions and lazy-loaded shells
- `RestaurantGridSkeleton`: restaurant/card listing pages
- `RestaurantDetailSkeleton`: restaurant detail and menu entry states
- `OrdersDashboardSkeleton`: table-heavy admin/order screens
- `WalletSkeleton`: wallet/balance pages
- `ContentPageSkeleton`: policy/profile/about-style content pages
- `HeroBannerSkeleton`, `CategoryChipRowSkeleton`, `TableSkeleton`: section-level building blocks

Supporting utilities:
- `Skeleton`: low-level shimmer block
- `LoadingSkeletonRegion`: accessible wrapper for loading sections
- `useDelayedLoading`: delays short-lived loading UI to reduce flicker on fast responses

Extension guidelines:
1. Match the final layout dimensions closely to avoid CLS.
2. Prefer composing from existing presets before adding a new skeleton.
3. Keep empty states and error states separate from loading states.
4. Use `useDelayedLoading` for fast network calls where skeleton flash would feel noisy.
