const clampGuestCount = (value, minimum, maximum) => {
  if (!Number.isFinite(value)) return minimum
  return Math.min(Math.max(value, minimum), maximum)
}

const readPositiveNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }
  return null
}

export const resolveMaxDiningGuests = (restaurant, fallback = 6) => {
  const safeFallback = Math.max(1, Number(fallback) || 6)
  const resolved =
    readPositiveNumber(
      restaurant?.diningSettings?.maxGuests,
      restaurant?.maxGuests,
      restaurant?.restaurant?.diningSettings?.maxGuests,
      restaurant?.restaurant?.maxGuests,
      restaurant?.pendingDiningRequest?.maxGuests,
      restaurant?.pendingRequest?.maxGuests,
    ) || safeFallback

  return Math.max(1, Math.floor(resolved))
}

export const buildDiningGuestOptions = (restaurant, fallback = 6) =>
  Array.from(
    { length: resolveMaxDiningGuests(restaurant, fallback) },
    (_, index) => index + 1,
  )

export const normalizeSelectedDiningGuests = (selectedGuests, restaurant, fallback = 6) => {
  const maxGuests = resolveMaxDiningGuests(restaurant, fallback)
  return clampGuestCount(Number(selectedGuests), 1, maxGuests)
}
