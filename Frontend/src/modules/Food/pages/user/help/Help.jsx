import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  HelpCircle,
  Package,
  CreditCard,
  User,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  Shield,
  Clock,
  MapPin
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Badge } from "@food/components/ui/badge"

const helpCategories = [
  {
    id: "ordering",
    title: "Ordering",
    icon: Package,
    color: "text-[#FE5502]",
    bgColor: "bg-red-50",
    description: "Learn how to place and manage orders",
    topics: [
      {
        question: "How do I place an order?",
        answer: "To place an order, browse restaurants, add items to your cart, and proceed to checkout. Select your delivery address and payment method, then confirm your order."
      },
      {
        question: "Can I modify or cancel my order?",
        answer: "You can modify or cancel your order within 5 minutes of placing it. After that, please contact support for assistance."
      },
      {
        question: "How do I track my order?",
        answer: "Go to 'My Orders' in your profile, select the order you want to track, and you'll see real-time updates on your order status."
      },
      {
        question: "What is the minimum order amount?",
        answer: "The minimum order amount varies by restaurant, typically ranging from $10 to $15. This information is displayed on each restaurant's page."
      }
    ]
  },
  {
    id: "payments",
    title: "Payments",
    icon: CreditCard,
    color: "text-[#FE5502]",
    bgColor: "bg-red-50",
    description: "Payment methods and billing questions",
    topics: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, digital wallets (Apple Pay, Google Pay), and cash on delivery in select areas."
      },
      {
        question: "Is my payment information secure?",
        answer: "Yes, we use industry-standard encryption to protect your payment information. We never store your full card details."
      },
      {
        question: "Can I get a refund?",
        answer: "Refunds are processed for cancelled orders, incorrect items, or quality issues. Contact support within 24 hours of delivery for assistance."
      },
      {
        question: "Why was my payment declined?",
        answer: "Payment can be declined due to insufficient funds, incorrect card details, or bank restrictions. Please verify your payment method and try again."
      }
    ]
  },
  {
    id: "delivery",
    title: "Delivery",
    icon: Truck,
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "Delivery times, fees, and tracking",
    topics: [
      {
        question: "What are your delivery times?",
        answer: "Delivery times typically range from 30-60 minutes, depending on the restaurant and your location. Estimated time is shown before checkout."
      },
      {
        question: "How much is the delivery fee?",
        answer: "Delivery fees vary by restaurant and distance, typically ranging from $2.99 to $5.99. The exact fee is shown before you place your order."
      },
      {
        question: "Can I schedule a delivery for later?",
        answer: "Yes, you can schedule orders for up to 7 days in advance during checkout. Select your preferred delivery time."
      },
      {
        question: "What if my order is late?",
        answer: "If your order is significantly delayed, contact support. We'll investigate and may provide compensation or a refund."
      }
    ]
  },
  {
    id: "account",
    title: "Account & Profile",
    icon: User,
    color: "text-[#FE5502]",
    bgColor: "bg-red-50",
    description: "Manage your account and preferences",
    topics: [
      {
        question: "How do I update my profile?",
        answer: "Go to 'Profile' in the menu, then select 'Edit Profile' to update your name, email, phone number, and other information."
      },
      {
        question: "How do I change my password?",
        answer: "Go to Profile > Settings > Security to change your password. You'll need to verify your current password first."
      },
      {
        question: "How do I manage my addresses?",
        answer: "Navigate to Profile > Addresses to view, add, edit, or delete delivery addresses. Set a default address for faster checkout."
      },
      {
        question: "How do I save my favorite restaurants?",
        answer: "Click the heart icon on any restaurant page to add it to your favorites. View all favorites in Profile > Favorites."
      }
    ]
  },
  {
    id: "refunds",
    title: "Refunds & Returns",
    icon: Shield,
    color: "text-[#FE5502]",
    bgColor: "bg-red-50",
    description: "Refund policy and return process",
    topics: [
      {
        question: "What is your refund policy?",
        answer: "We offer full refunds for cancelled orders, incorrect items, or quality issues reported within 24 hours of delivery."
      },
      {
        question: "How long do refunds take?",
        answer: "Refunds are typically processed within 5-7 business days, depending on your payment method. You'll receive a confirmation email."
      },
      {
        question: "Can I return food items?",
        answer: "Due to food safety regulations, we cannot accept returns of food items. However, we'll provide a full refund for quality issues."
      },
      {
        question: "What if I received the wrong order?",
        answer: "Contact support immediately with your order number. We'll arrange a replacement or full refund, and you can keep the incorrect order."
      }
    ]
  },
  {
    id: "general",
    title: "General Questions",
    icon: HelpCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    description: "Other frequently asked questions",
    topics: [
      {
        question: "Do you offer discounts or promotions?",
        answer: "Yes! Check the 'Offers' section for current promotions, discount codes, and special deals from restaurants."
      },
      {
        question: "How do I contact customer support?",
        answer: "You can contact us via phone, email, or live chat. Visit the 'Contact Support' section below for all contact options."
      },
      {
        question: "Is there a mobile app?",
        answer: "Yes, our mobile app is available for iOS and Android. Download it from the App Store or Google Play for the best experience."
      },
      {
        question: "Do you deliver to my area?",
        answer: "Enter your delivery address to see available restaurants in your area. We're constantly expanding our delivery zones."
      }
    ]
  }
]

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedQuestion, setExpandedQuestion] = useState(null)

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.topics.some(topic =>
      topic.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    setExpandedQuestion(null)
  }

  const toggleQuestion = (questionIndex) => {
    setExpandedQuestion(expandedQuestion === questionIndex ? null : questionIndex)
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-red-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a] p-4 md:p-6 lg:p-8">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
        <ScrollReveal>
          <div className="text-center space-y-3 md:space-y-4 mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Help Center</h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
              Find answers to common questions or contact our support team
            </p>
          </div>
        </ScrollReveal>

        {/* Search Bar */}
        <ScrollReveal delay={0.1}>
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for help topics, questions, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Quick Actions */}
        <ScrollReveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            <Link to="/user/orders">
              <CardContent className="p-4 md:p-5 lg:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-primary-orange" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold">Track Your Order</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">View order status</p>
                  </div>
                </div>
              </CardContent>
            </Link>
            <Link to="/user/profile">
              <CardContent className="p-4 md:p-5 lg:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                    <User className="h-5 w-5 md:h-6 md:w-6 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold">Manage Account</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Update profile & settings</p>
                  </div>
                </div>
              </CardContent>
            </Link>
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-[#FE5502]" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold">Contact Support</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Get help from our team</p>
                </div>
              </div>
            </CardContent>
          </div>
        </ScrollReveal>

        {/* Help Categories */}
        <ScrollReveal delay={0.3}>
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Browse by Category</h2>
            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No results found</p>
                  <p className="text-muted-foreground mb-4">
                    Try searching with different keywords
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredCategories.map((category, categoryIndex) => {
                const Icon = category.icon
                const isExpanded = expandedCategory === category.id

                return (
                  <Card key={category.id} className="shadow-lg">
                    <CardHeader
                      onClick={() => toggleCategory(category.id)}
                      className="p-4 md:p-5 lg:p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`p-2 md:p-3 ${category.bgColor} rounded-lg`}>
                            <Icon className={`h-5 w-5 md:h-6 md:w-6 ${category.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg md:text-xl lg:text-2xl">{category.title}</CardTitle>
                            <CardDescription className="text-sm md:text-base">{category.description}</CardDescription>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-3 md:space-y-4 pt-0 p-4 md:p-5 lg:p-6">
                        {category.topics.map((topic, topicIndex) => {
                          const questionIndex = `${category.id}-${topicIndex}`
                          const isQuestionExpanded = expandedQuestion === questionIndex

                          return (
                            <div
                              key={topicIndex}
                              className="border rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => toggleQuestion(questionIndex)}
                              >
                                <span className="font-semibold pr-4">{topic.question}</span>
                                {isQuestionExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </button>
                              {isQuestionExpanded && (
                                <div className="p-4 text-muted-foreground border-t bg-muted/30">
                                  <p>{topic.answer}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </ScrollReveal>

        {/* Contact Support Section */}
        <ScrollReveal delay={0.4}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardHeader className="p-4 md:p-5 lg:p-6">
              <CardTitle className="text-xl md:text-2xl lg:text-3xl flex items-center gap-2">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary-orange" />
                Still Need Help?
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Our support team is here to assist you 24/7
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5 lg:space-y-6 p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Phone className="h-5 w-5 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Call us anytime
                    </p>
                    <a
                      href="tel:+1-800-123-4567"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      +1 (800) 123-4567
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Mail className="h-5 w-5 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      We'll respond within 24 hours
                    </p>
                    <a
                      href="mailto:support@appzeto.com"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      support@appzeto.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-[#FE5502]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Live Chat</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Available 24/7
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => alert("Live chat would open here")}
                    >
                      Start Chat
                    </Button>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Average response time: Less than 5 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </AnimatedPage>
  )
}
