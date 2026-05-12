import { useState, useRef } from "react"
import { Upload, Heart, Star, Calendar, CheckCircle2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@food/components/ui/dialog"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

// Using placeholders for advertisement images
const profilePlaceholder = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop"
const coverPlaceholder = "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=400&fit=crop"

export default function NewAdvertisement() {
  const [activeLanguage, setActiveLanguage] = useState("default")
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    restaurant: "",
    priority: "Priority",
    advertisementType: "Restaurant Promotion",
    validity: "",
    showReview: true,
    showRatings: true,
  })
  const [profileImage, setProfileImage] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const profileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const languageTabs = [
    { key: "default", label: "Default" },
    { key: "en", label: "English(EN)" },
    { key: "bn", label: "Bengali - বাংলা(BN)" },
    { key: "ar", label: "Arabic - العربية (AR)" },
    { key: "es", label: "Spanish - espa�ol(ES)" },
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileUpload = (type, file) => {
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        [type]: "Invalid file type. Please upload PNG, JPG, JPEG, or WEBP."
      }))
      return
    }

    if (file.size > maxSize) {
      setFormErrors(prev => ({
        ...prev,
        [type]: "File size exceeds 2MB limit."
      }))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === "profileImage") {
        setProfileImage(file)
        setProfilePreview(reader.result)
      } else {
        setCoverImage(file)
        setCoverPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)

    if (formErrors[type]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[type]
        return newErrors
      })
    }
  }

  const handleRemoveImage = (type) => {
    if (type === "profileImage") {
      setProfileImage(null)
      setProfilePreview(null)
      if (profileInputRef.current) {
        profileInputRef.current.value = ""
      }
    } else {
      setCoverImage(null)
      setCoverPreview(null)
      if (coverInputRef.current) {
        coverInputRef.current.value = ""
      }
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = "Advertisement title is required"
    }

    if (!formData.restaurant) {
      errors.restaurant = "Restaurant selection is required"
    }

    if (!formData.validity) {
      errors.validity = "Validity date is required"
    } else {
      const validityDate = new Date(formData.validity)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (validityDate < today) {
        errors.validity = "Validity date must be today or later"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would typically send the data to your API
      debugLog("Form submitted:", {
        ...formData,
        profileImage,
        coverImage
      })
      
      setShowSuccessDialog(true)
      
      setTimeout(() => {
        handleReset()
        setShowSuccessDialog(false)
      }, 3000)
    } catch (error) {
      debugError("Error submitting form:", error)
      setFormErrors({ submit: "Failed to create advertisement. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      title: "",
      shortDescription: "",
      restaurant: "",
      priority: "Priority",
      advertisementType: "Restaurant Promotion",
      validity: "",
      showReview: true,
      showRatings: true,
    })
    setProfileImage(null)
    setCoverImage(null)
    setProfilePreview(null)
    setCoverPreview(null)
    setFormErrors({})
    if (profileInputRef.current) {
      profileInputRef.current.value = ""
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = ""
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Advertisement</h1>

              {/* Language Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
                {languageTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveLanguage(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeLanguage === tab.key
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Advertisement Title ({activeLanguage === "default" ? "Default" : languageTabs.find(t => t.key === activeLanguage)?.label}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Exclusive Offer"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        formErrors.title ? "border-red-500" : "border-slate-300"
                      }`}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Short Description ({activeLanguage === "default" ? "Default" : languageTabs.find(t => t.key === activeLanguage)?.label})
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                      placeholder="Get Discount"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Restaurant <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.restaurant}
                        onChange={(e) => handleInputChange("restaurant", e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          formErrors.restaurant ? "border-red-500" : "border-slate-300"
                        }`}
                      >
                        <option value="">Select Restaurant</option>
                        <option value="cafe-monarch">Caf� Monarch</option>
                        <option value="hungry-puppets">Hungry Puppets</option>
                      </select>
                      {formErrors.restaurant && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.restaurant}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange("priority", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="Priority">Priority</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Advertisement Type
                    </label>
                    <select
                      value={formData.advertisementType}
                      onChange={(e) => handleInputChange("advertisementType", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="Restaurant Promotion">Restaurant Promotion</option>
                      <option value="Video promotion">Video promotion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Validity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.validity}
                        onChange={(e) => handleInputChange("validity", e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          formErrors.validity ? "border-red-500" : "border-slate-300"
                        }`}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {formErrors.validity && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.validity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Show Review & Ratings
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showReview}
                          onChange={(e) => handleInputChange("showReview", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Review</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showRatings}
                          onChange={(e) => handleInputChange("showRatings", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Rating</span>
                      </label>
                    </div>
                  </div>

                  {/* Upload Related Files */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">
                      Upload Related Files
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                          Profile Image (Ratio - 1:1)
                        </label>
                        <input
                          ref={profileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload("profileImage", e.target.files[0])
                            }
                          }}
                          className="hidden"
                        />
                        {profilePreview ? (
                          <div className="relative border-2 border-slate-300 rounded-lg overflow-hidden">
                            <img
                              src={profilePreview}
                              alt="Profile preview"
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("profileImage")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => profileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer ${
                              formErrors.profileImage ? "border-red-500" : "border-slate-300"
                            }`}
                          >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-blue-600 mb-1">Click to Upload Profile Image</p>
                            <p className="text-xs text-slate-500">Supports: PNG, JPG, JPEG, WEBP Maximum 2 MB</p>
                          </div>
                        )}
                        {formErrors.profileImage && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.profileImage}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                          Upload Cover (Ratio - 2:1)
                        </label>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload("coverImage", e.target.files[0])
                            }
                          }}
                          className="hidden"
                        />
                        {coverPreview ? (
                          <div className="relative border-2 border-slate-300 rounded-lg overflow-hidden">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("coverImage")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => coverInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer ${
                              formErrors.coverImage ? "border-red-500" : "border-slate-300"
                            }`}
                          >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-blue-600 mb-1">Click to Upload Cover Image</p>
                            <p className="text-xs text-slate-500">Supports: PNG, JPG, JPEG, WEBP Maximum 2 MB</p>
                          </div>
                        )}
                        {formErrors.coverImage && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.coverImage}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    {formErrors.submit && (
                      <p className="text-sm text-red-500 mr-auto">{formErrors.submit}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Advertisement Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Advertisement Preview</h2>
              <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                <div className="relative bg-gradient-to-br from-slate-50 to-slate-100" style={{ aspectRatio: "2/1" }}>
                  {/* Cover Image Area */}
                  <div className="absolute inset-0">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={coverPlaceholder}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none"
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md overflow-hidden">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={profilePlaceholder}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                            }}
                          />
                        )}
                      </div>
                      <button className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {formData.title || "Title"}
                      </h3>
                      <p className="text-xs text-slate-600 mb-2">
                        {formData.shortDescription || "Description"}
                      </p>
                      {formData.showRatings && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-slate-900">4.7 (25+)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:scale-100 data-[state=closed]:scale-100">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-emerald-500 rounded-full p-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                Advertisement Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                The advertisement has been successfully created and is now active in the system.
              </DialogDescription>
            </DialogHeader>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

