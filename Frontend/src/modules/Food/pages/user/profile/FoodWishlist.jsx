import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ArrowRight } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import ScrollReveal from "@food/components/user/ScrollReveal";
import { Card, CardHeader, CardTitle, CardContent } from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { useProfile } from "@food/context/ProfileContext";
import { toast } from "sonner";

export default function FoodWishlist() {
  const { foodWishlist, toggleFoodWishlistItem } = useProfile();
  const navigate = useNavigate();

  const handleRemoveDishFavorite = async (e, dish) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Remove this dish from wishlist?")) {
      try {
        await toggleFoodWishlistItem({
            restaurantId: dish.restaurantId,
            dishName: dish.dishName
        });
        toast.success("Dish removed from wishlist");
      } catch (err) {
        toast.error("Failed to remove dish");
      }
    }
  };

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-red-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Food Wishlist</h1>
                <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm font-semibold">
                  {foodWishlist.length || 0} {foodWishlist.length === 1 ? "dish" : "dishes"}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {foodWishlist.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg mb-4 font-medium">No dishes saved yet</p>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                Explore restaurants and click the like icon on featured dishes to add them to your wishlist.
              </p>
              <Link to="/food/user">
                <Button className="bg-gradient-to-r bg-[#FE5502] hover:opacity-90 text-white rounded-full px-8 py-5 text-sm font-bold shadow-lg">
                  Explore Food
                </Button>
              </Link>
            </div>
          ) : (
            foodWishlist.map((dish, index) => {
              const restaurantSlug = dish.restaurantSlug || "";
              return (
                <ScrollReveal key={`${dish.restaurantId}-${dish.dishName}`} delay={index * 0.1}>
                  <Link to={`/food/user/restaurants/${restaurantSlug}`}>
                    <Card className="overflow-hidden h-full cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 ring-1 ring-gray-100 dark:ring-gray-800 bg-white dark:bg-[#1a1a1a]">
                      <div className="h-32 w-full relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <img
                          src={"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80"}
                          alt={dish.dishName}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-red-500 shadow-md"
                            onClick={(e) => handleRemoveDishFavorite(e, dish)}
                          >
                            <Heart className="h-4 w-4 fill-[#FE5502] text-[#FE5502]" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3 flex flex-col justify-between h-[120px]">
                        <div>
                          <CardTitle className="text-base font-bold mb-1 line-clamp-1 text-gray-900 dark:text-white">
                            {dish.dishName}
                          </CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-medium">
                            {dish.restaurantName || "Restaurant"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                          <div className="text-base font-black text-[#FE5502]">
                            {"\u20B9"}{Math.round(dish.price || 0)}
                          </div>
                          <div className="text-xs font-bold text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex items-center gap-1">
                            Visit <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
