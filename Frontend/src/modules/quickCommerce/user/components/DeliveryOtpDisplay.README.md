# DeliveryOtpDisplay Component

## Overview

The `DeliveryOtpDisplay` component displays a proximity-based delivery OTP to customers when the delivery person arrives within 120-150 meters of the delivery location. It provides real-time updates via Socket.IO and includes security features like auto-hiding when the app is backgrounded.

## Features

- **Real-time OTP Display**: Receives OTP via Socket.IO when delivery person is nearby
- **Large, Readable Font**: OTP displayed at 48px (36pt) - exceeds 24pt requirement
- **Countdown Timer**: Shows remaining validity time (10 minutes)
- **Nearby Indicator**: Visual indicator when delivery person is within proximity range
- **Security**: Automatically hides OTP when app is backgrounded or device locked
- **Delivery Confirmation**: Shows success message when OTP is validated
- **Expiring Soon Warning**: Changes color scheme when less than 2 minutes remain

## Requirements Validation

This component satisfies the following requirements:

- **4.1**: Receives notification to display OTP via Socket.IO
- **4.2**: Displays OTP in prominent, easily readable format
- **4.3**: Font size at least 24 points (implemented at 36pt/48px)
- **4.4**: Shows visual indicator that delivery person is nearby
- **4.5**: Keeps OTP visible on active order screen while valid
- **7.5**: Displays countdown timer showing remaining validity
- **9.4**: Hides OTP when app is backgrounded or device locked

## Usage

```jsx
import DeliveryOtpDisplay from "@/modules/customer/components/DeliveryOtpDisplay";

function OrderDetailPage() {
  const { orderId } = useParams();
  
  return (
    <div>
      {/* Other order details */}
      <DeliveryOtpDisplay orderId={orderId} />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string | Yes | The order ID to listen for OTP events |

## Socket.IO Events

### Incoming Events

#### `delivery:otp:generated`
Triggered when delivery person generates an OTP within proximity range.

**Payload:**
```javascript
{
  orderId: "ORD123456",
  otp: "1234",
  expiresAt: "2024-01-15T10:20:00Z",
  deliveryPersonNearby: true
}
```

#### `delivery:otp:validated`
Triggered when delivery person successfully validates the OTP.

**Payload:**
```javascript
{
  orderId: "ORD123456",
  status: "delivered",
  deliveredAt: "2024-01-15T10:15:30Z"
}
```

## Component States

### 1. No OTP (Default)
Component renders nothing when no OTP is active.

### 2. OTP Active
Displays:
- Delivery person nearby indicator (if applicable)
- Large OTP display with security icon
- Countdown timer
- Security notice

### 3. Expiring Soon (< 2 minutes)
Same as OTP Active but with amber/warning color scheme.

### 4. Delivered
Shows success confirmation with checkmark icon.

### 5. App Backgrounded
Component hides OTP display for security (returns null).

## Styling

The component uses Tailwind CSS with the following color schemes:

- **Normal State**: Purple/blue gradient (`from-purple-50 to-blue-50`)
- **Expiring Soon**: Amber warning colors (`bg-amber-50`)
- **Nearby Indicator**: Blue colors (`bg-blue-50`)
- **Delivered**: Green success colors (`bg-green-50`)

## Security Features

1. **Visibility Detection**: Uses `document.visibilitychange` event to detect when app is backgrounded
2. **Auto-hide**: OTP is hidden when `document.hidden` is true
3. **Timer Cleanup**: Properly cleans up interval timers on unmount
4. **Event Cleanup**: Unsubscribes from Socket.IO events on unmount

## Timer Behavior

- **Duration**: 10 minutes (600 seconds)
- **Update Frequency**: Every 1 second
- **Format**: MM:SS (e.g., "9:45", "0:30")
- **Auto-expire**: Component automatically hides when timer reaches 0
- **Warning Threshold**: Shows amber colors when < 2 minutes remain

## Integration with OrderDetailPage

The component is integrated into `OrderDetailPage.jsx`:

```jsx
import DeliveryOtpDisplay from "../components/DeliveryOtpDisplay";

// In the render:
<DeliveryOtpDisplay orderId={orderId} />
```

It appears between the live tracking map and the items list, providing a prominent position for the OTP display.

## Testing Considerations

When testing this component:

1. **Socket.IO Mocking**: Mock the `getOrderSocket`, `onDeliveryOtpGenerated`, and `onDeliveryOtpValidated` functions
2. **Timer Testing**: Use `jest.useFakeTimers()` to test countdown behavior
3. **Visibility API**: Mock `document.hidden` and trigger `visibilitychange` events
4. **Time Calculations**: Test with various expiration timestamps
5. **Edge Cases**: Test expired OTPs, missing data, and rapid state changes

## Dependencies

- `react`: Core React library
- `lucide-react`: Icon components (CheckCircle, Clock, MapPin, Shield)
- `@/core/services/orderSocket`: Socket.IO client wrapper

## Browser Compatibility

- **Visibility API**: Supported in all modern browsers (Chrome 33+, Firefox 18+, Safari 7+)
- **Socket.IO**: Requires WebSocket support or falls back to polling
- **CSS**: Uses Tailwind CSS classes with standard browser support

## Performance Considerations

- **Timer Optimization**: Single interval timer, cleaned up properly
- **Conditional Rendering**: Only renders when OTP is active and visible
- **Event Listeners**: Minimal event listeners, all cleaned up on unmount
- **Re-renders**: Optimized to only re-render when state changes

## Future Enhancements

Potential improvements for future versions:

1. **Sound/Vibration**: Alert user when OTP is received
2. **Copy to Clipboard**: Button to copy OTP
3. **Accessibility**: ARIA labels and screen reader support
4. **Animations**: More sophisticated entry/exit animations
5. **Offline Support**: Handle offline scenarios gracefully
6. **Multi-language**: Internationalization support
