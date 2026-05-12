# Live Tracking Polyline System - Rapido/Zomato Style

## Overview
This system implements real-time polyline tracking similar to Rapido/Zomato, where the route polyline dynamically updates as the rider moves, removing points behind the rider and keeping only the forward route visible.

## Architecture

### Core Components

1. **Utility Functions** (`liveTrackingPolyline.js`)
   - Polyline decoding from Google Directions API
   - Nearest point detection on polyline
   - Polyline trimming logic
   - Distance calculations
   - Marker animation helpers

2. **Integration** (`DeliveryHome.jsx`)
   - Live tracking polyline refs
   - Update functions
   - Integration with GPS tracking

## How It Works

### 1. Route Calculation
When a route is calculated using Google Directions API:
```javascript
const directionsResult = await calculateRouteWithDirectionsAPI(origin, destination);
updateLiveTrackingPolyline(directionsResult, riderLocation);
```

### 2. Polyline Extraction
The system extracts the encoded polyline from the Directions API result:
- First tries `overview_polyline.points` (encoded string)
- Falls back to extracting from route legs/steps
- Decodes the polyline into an array of `{lat, lng}` points

### 3. Nearest Point Detection
On every GPS update (every 2-5 seconds):
- Finds the nearest point on the polyline to the rider's current position
- Uses distance-to-line-segment calculation for accuracy
- Returns the segment index and projected point

### 4. Polyline Trimming
- Removes all polyline points behind the nearest point
- Keeps only points from the nearest point onwards (forward route)
- Updates the Google Maps Polyline object with the trimmed path

### 5. Marker Animation
- Smoothly animates the rider marker using interpolation
- Calculates bearing/heading for marker rotation
- Uses `requestAnimationFrame` for smooth 60fps animation

## Key Functions

### `decodePolyline(encoded)`
Decodes Google Maps encoded polyline string to array of coordinates.

### `findNearestPointOnPolyline(polyline, riderPosition)`
Finds the closest point on the polyline to the rider's current position.
Returns: `{segmentIndex, nearestPoint, distance}`

### `trimPolylineBehindRider(polyline, nearestPoint, segmentIndex)`
Removes all points behind the rider, keeping only forward route.

### `updateLiveTrackingPolyline(directionsResult, riderPosition)`
Main function that:
1. Extracts polyline from directions result
2. Finds nearest point
3. Trims polyline
4. Updates Google Maps Polyline object

### `animateRiderMarker(newPosition, heading)`
Smoothly animates marker movement with rotation.

## Integration Points

### GPS Updates
In `watchPosition` callback:
```javascript
// Update live tracking polyline
const currentDirectionsResponse = directionsResponseRef.current;
if (currentDirectionsResponse) {
  updateLiveTrackingPolyline(currentDirectionsResponse, newLocation);
}

// Animate marker
animateRiderMarker(newLocation, heading);
```

### Route Calculation
After calculating route:
```javascript
setDirectionsResponse(directionsResult);
directionsResponseRef.current = directionsResult;
updateLiveTrackingPolyline(directionsResult, currentLocation);
```

## Performance Optimizations

1. **Refs for Callbacks**: Uses `directionsResponseRef` to access latest directions in callbacks without re-renders
2. **Animation Cancellation**: Cancels previous animations before starting new ones
3. **Polyline Reuse**: Updates existing polyline instead of creating new ones

## Visual Behavior

- **Blue Polyline**: Bright blue (#4285F4) route line, 8px width
- **Dynamic Trimming**: Polyline shrinks as rider progresses
- **Smooth Animation**: Marker moves smoothly without jumping
- **Rotation**: Marker rotates based on heading/bearing

## Error Handling

- Gracefully handles missing polyline data
- Falls back if Directions API fails
- Validates coordinates before processing

## Future Enhancements

1. Add ETA calculation based on remaining route
2. Add distance-to-destination display
3. Add route deviation detection
4. Add route recalculation if rider goes off-route

