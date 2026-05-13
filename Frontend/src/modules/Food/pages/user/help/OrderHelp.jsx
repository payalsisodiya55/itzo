import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  RefreshCw,
  CreditCard,
  MapPin,
  HelpCircle
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"
import { useOrders } from "@food/context/OrdersContext"

const commonIssues = [
  {
    id: "late-delivery",
    title: "Order is Late",
    icon: Clock,
    description: "Your order hasn't arrived within the estimated time",
    solutions: [
      "Check the order tracking page for real-time updates",
      "Contact the delivery driver if contact information is available",
      "Wait an additional 15-20 minutes as delays can occur",
      "Contact support if the order is more than 30 minutes late"
    ],
    actions: [
      { label: "Track Order", path: "track" },
      { label: "Contact Support", path: "support" }
    ]
  },
  {
    id: "missing-items",
    title: "Missing Items",
    icon: Package,
    description: "Some items from your order are missing",
    solutions: [
      "Check your order receipt to verify what was ordered",
      "Check if items were delivered separately",
      "Contact support immediately with your order number",
      "Take photos if possible to help with the investigation"
    ],
    actions: [
      { label: "View Invoice", path: "invoice" },
      { label: "Report Issue", path: "support" }
    ]
  },
  {
    id: "wrong-order",
    title: "Wrong Order Received",
    icon: XCircle,
    description: "You received items different from what you ordered",
    solutions: [
      "Keep the incorrect order - you won't be charged for it",
      "Contact support immediately with your order number",
      "We'll arrange a replacement or full refund",
      "You may be eligible for a discount on your next order"
    ],
    actions: [
      { label: "View Order Details", path: "track" },
      { label: "Report Issue", path: "support" }
    ]
  },
  {
    id: "quality-issue",
    title: "Quality Issue",
    icon: AlertCircle,
    description: "Food quality doesn't meet expectations",
    solutions: [
      "Contact support within 24 hours of delivery",
      "Describe the issue in detail",
      "Take photos if possible",
      "We'll process a full refund or replacement"
    ],
    actions: [
      { label: "Report Issue", path: "support" },
      { label: "Request Refund", path: "refund" }
    ]
  },
  {
    id: "payment-issue",
    title: "Payment Problem",
    icon: CreditCard,
    description: "Issues with payment or billing",
    solutions: [
      "Check your payment method in your profile",
      "Verify the charge on your bank statement",
      "Contact support if you were charged incorrectly",
      "We'll investigate and process a refund if needed"
    ],
    actions: [
      { label: "View Invoice", path: "invoice" },
      { label: "Contact Support", path: "support" }
    ]
  },
  {
    id: "cancel-order",
    title: "Cancel Order",
    icon: RefreshCw,
    description: "Need to cancel your order",
    solutions: [
      "Orders can be cancelled within 5 minutes of placement",
      "After 5 minutes, contact support for cancellation",
      "If the order is already being prepared, cancellation may not be possible",
      "Refunds are processed automatically for cancelled orders"
    ],
    actions: [
      { label: "Contact Support", path: "support" },
      { label: "View Order", path: "track" }
    ]
  }
]

export default function OrderHelp() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { getOrderById } = useOrders()
  const order = getOrderById(orderId)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-[#FE5502]"
      case "preparing":
        return "bg-primary-orange"
      case "outForDelivery":
        return "bg-red-500"
      case "delivered":
        return "bg-[#FE5502]"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "preparing":
        return "Preparing"
      case "outForDelivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      default:
        return status
    }
  }

  const handleAction = (action) => {
    switch (action) {
      case "track":
        navigate(`/user/orders/${orderId}`)
        break
      case "invoice":
        navigate(`/user/orders/${orderId}/invoice`)
        break
      case "support":
        // Scroll to support section or open contact modal
        document.getElementById("contact-support")?.scrollIntoView({ behavior: "smooth" })
        break
      case "refund":
        alert("Refund request would be processed here. Contact support for assistance.")
        break
      default:
        break
    }
  }

  if (!order) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-red-50/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find an order with ID: {orderId}
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/user/orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
                <Link to="/user/help">
                  <Button>Go to Help Center</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-red-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a] p-4 md:p-6 lg:p-8">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <Link to="/user/help">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Order Help</h1>
              <p className="text-sm md:text-base text-muted-foreground">Order {order.id}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Order Summary */}
        <ScrollReveal delay={0.1}>
          <Card className="shadow-lg">
            <CardHeader className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-primary-orange" />
                  Order Summary
                </CardTitle>
                <Badge className={`${getStatusColor(order.status)} text-white text-xs md:text-sm`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5 p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-semibold">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Placed On</p>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold text-primary-orange text-xl">${order.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Items</p>
                  <p className="font-semibold">{order.items?.length || 0} items</p>
                </div>
              </div>
              {order.address && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                      <p className="text-sm">
                        {order.address.street}
                        {order.address.additionalDetails && `, ${order.address.additionalDetails}`}
                        <br />
                        {order.address.city}, {order.address.state} {order.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Common Issues */}
        <ScrollReveal delay={0.2}>
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">What can we help you with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
              {commonIssues.map((issue, index) => {
                const Icon = issue.icon
                return (
                  <Card
                    key={issue.id}
                  >
                    <CardHeader className="p-4 md:p-5 lg:p-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                          <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary-orange" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base md:text-lg lg:text-xl">{issue.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm md:text-base">{issue.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 p-4 md:p-5 lg:p-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">What to do:</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {issue.solutions.map((solution, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        {issue.actions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant={idx === 0 ? "default" : "outline"}
                            size="sm"
                            className={idx === 0 ? "bg-primary-orange hover:opacity-90" : ""}
                            onClick={() => handleAction(action.path)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Quick Actions */}
        <ScrollReveal delay={0.3}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardHeader className="p-4 md:p-5 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl">
                <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-primary-orange" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                <Link to={`/user/orders/${orderId}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                  >
                    <Truck className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold">Track Order</div>
                      <div className="text-xs text-muted-foreground">View real-time status</div>
                    </div>
                  </Button>
                </Link>
                <Link to={`/user/orders/${orderId}/invoice`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold">View Invoice</div>
                      <div className="text-xs text-muted-foreground">Download receipt</div>
                    </div>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-auto py-3"
                  onClick={() => document.getElementById("contact-support")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <MessageCircle className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Contact Support</div>
                    <div className="text-xs text-muted-foreground">Get help now</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Contact Support Section */}
        <ScrollReveal delay={0.4}>
          <Card id="contact-support" className="shadow-lg">
            <CardHeader className="p-4 md:p-5 lg:p-6">
              <CardTitle className="text-xl md:text-2xl lg:text-3xl flex items-center gap-2">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary-orange" />
                Contact Support for This Order
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Our support team is ready to help you with order {order.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5 lg:space-y-6 p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Phone className="h-5 w-5 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Mention order {order.id}
                    </p>
                    <a
                      href="tel:+1-800-123-4567"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      +1 (800) 123-4567
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Mail className="h-5 w-5 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Include order {order.id} in subject
                    </p>
                    <a
                      href={`mailto:support@appzeto.com?subject=Help with Order ${order.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      support@appzeto.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  className="w-full bg-primary-orange hover:opacity-90"
                  onClick={() => alert("Live chat would open here with order context")}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Back to Orders */}
        <ScrollReveal delay={0.5}>
          <div className="flex gap-4">
            <Link to="/user/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Orders
              </Button>
            </Link>
            <Link to="/user/help" className="flex-1">
              <Button variant="outline" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </AnimatedPage>
  )
}
