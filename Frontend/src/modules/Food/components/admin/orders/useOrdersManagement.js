import { useState, useMemo } from "react"
import { exportToCSV, exportToExcel, exportToPDF, exportToJSON } from "./ordersExportUtils"

import { getCachedSettings, loadBusinessSettings } from "@common/utils/businessSettings"
const debugError = () => {}


const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatMoney = (value) => `INR ${toNumber(value).toFixed(2)}`
const formatDisplayText = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback
  const normalized = String(value).trim()
  return normalized || fallback
}

const formatOrderAddress = (address) => {
  if (!address || typeof address !== "object") return "Not available"

  const formattedAddress = String(address.formattedAddress || "").trim()
  const rawAddress = String(address.address || "").trim()

  const primaryParts = [
    address.label,
    address.street,
    address.additionalDetails,
    address.landmark,
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.city,
    address.state,
    address.zipCode,
    address.postalCode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)

  const orderedParts = []
  const pushPart = (value) => {
    const normalized = String(value || "").trim()
    if (!normalized) return
    const key = normalized.toLowerCase()

    const isContained = orderedParts.some((existingPart) => {
      const existingKey = existingPart.toLowerCase()
      return existingKey === key || existingKey.includes(key) || key.includes(existingKey)
    })
    if (isContained) return

    orderedParts.push(normalized)
  }

  if (formattedAddress) pushPart(formattedAddress)
  if (rawAddress && rawAddress.toLowerCase() !== formattedAddress.toLowerCase()) pushPart(rawAddress)
  primaryParts.forEach(pushPart)

  return orderedParts.join(", ") || "Not available"
}

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const imageUrlToDataUrl = async (url) => {
  if (!url) return null
  if (url.startsWith("data:")) return url
  
  const u = String(url).trim()
  // Allow all valid URLs but handle errors gracefully
  if (!u.startsWith("http") && !u.startsWith("/")) return null

  try {
    const response = await fetch(url, { mode: 'cors', cache: "force-cache" })
    if (!response.ok) return null
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch (err) {
    debugError('Error converting image to data URL:', err)
    return null
  }
}

export function useOrdersManagement(orders, statusKey, title) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filters, setFilters] = useState({
    paymentStatus: "",
    deliveryType: "",
    minAmount: "",
    maxAmount: "",
    fromDate: "",
    toDate: "",
    restaurant: "",
  })
  const [visibleColumns, setVisibleColumns] = useState({
    si: true,
    orderId: true,
    orderDate: true,
    orderType: true,
    orderOtp: true,
    customer: true,
    restaurant: true,
    foodItems: true,
    totalAmount: true,
    paymentType: true,
    paymentCollectionStatus: true,
    orderStatus: true,
    actions: true,
  })

  // Get unique restaurants from orders
  const restaurants = useMemo(() => {
    return [...new Set(orders.map(o => o.restaurant))]
  }, [orders])

  // Apply search and filters
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(order => {
        const safeTotal =
          order.totalAmount ??
          order.total ??
          order.pricing?.total ??
          0
        const totalStr = String(safeTotal)
        return (
          String(order.orderId || "")
            .toLowerCase()
            .includes(query) ||
          String(order.customerName || "")
            .toLowerCase()
            .includes(query) ||
          String(order.restaurant || "")
            .toLowerCase()
            .includes(query) ||
          String(order.customerPhone || "").includes(query) ||
          totalStr.includes(query)
        )
      })
    }

    // Apply filters
    if (filters.paymentStatus) {
      const wanted = filters.paymentStatus.toLowerCase()
      result = result.filter((order) => {
        const paymentStatus = String(order.paymentStatus || "").toLowerCase()
        const collectionStatus = String(order.paymentCollectionStatus || "").toLowerCase()
        return paymentStatus === wanted || collectionStatus === wanted
      })
    }

    if (filters.deliveryType) {
      result = result.filter(
        (order) => String(order.deliveryType || "").toLowerCase() === filters.deliveryType.toLowerCase(),
      )
    }

    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount)
      result = result.filter(order => {
        const amount =
          order.totalAmount ??
          order.total ??
          order.pricing?.total ??
          0
        return Number(amount) >= min
      })
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount)
      result = result.filter(order => {
        const amount =
          order.totalAmount ??
          order.total ??
          order.pricing?.total ??
          0
        return Number(amount) <= max
      })
    }

    if (filters.restaurant) {
      result = result.filter(order => order.restaurant === filters.restaurant)
    }

    // Helper function to parse date format "16 JUL 2025"
    const parseOrderDate = (dateStr) => {
      const months = {
        "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06",
        "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
      }
      const parts = dateStr.split(" ")
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0")
        const month = months[parts[1].toUpperCase()] || "01"
        const year = parts[2]
        return new Date(`${year}-${month}-${day}`)
      }
      return new Date(dateStr)
    }

    if (filters.fromDate) {
      result = result.filter(order => {
        const orderDate = parseOrderDate(order.date)
        const fromDate = new Date(filters.fromDate)
        return orderDate >= fromDate
      })
    }

    if (filters.toDate) {
      result = result.filter(order => {
        const orderDate = parseOrderDate(order.date)
        const toDate = new Date(filters.toDate)
        toDate.setHours(23, 59, 59, 999) // Include entire day
        return orderDate <= toDate
      })
    }

    return result
  }, [orders, searchQuery, filters])

  const count = filteredOrders.length

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== "").length
  }, [filters])

  const handleApplyFilters = () => {
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    setFilters({
      paymentStatus: "",
      deliveryType: "",
      minAmount: "",
      maxAmount: "",
      fromDate: "",
      toDate: "",
      restaurant: "",
    })
  }

  const handleExport = (format) => {
    const filename = title.toLowerCase().replace(/\s+/g, "_")
    switch (format) {
      case "csv":
        exportToCSV(filteredOrders, filename)
        break
      case "excel":
        exportToExcel(filteredOrders, filename)
        break
      case "pdf":
        exportToPDF(filteredOrders, filename)
        break
      case "json":
        exportToJSON(filteredOrders, filename)
        break
      default:
        break
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsViewOrderOpen(true)
  }

  const handlePrintOrder = async (order) => {
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const orderId = order.orderId || order.id || order.subscriptionId || "N/A"
      const orderDate = order.date && order.time
        ? `${order.date}, ${order.time}`
        : (order.date || new Date().toLocaleDateString())

      const settings = getCachedSettings() || await loadBusinessSettings()
      const companyName = settings?.companyName || "Appzeto Food"
      const logoUrl = settings?.logo?.url || undefined
      const logoDataUrl = await imageUrlToDataUrl(logoUrl)

      const items = Array.isArray(order.items) ? order.items : []
      const itemsSubtotal = items.reduce((sum, item) => {
        const qty = toNumber(item?.quantity || 1)
        const unitPrice = toNumber(item?.price)
        return sum + (qty * unitPrice)
      }, 0)
      const subtotal = itemsSubtotal > 0
        ? itemsSubtotal
        : toNumber(
            order.totalItemAmount ??
            order.subtotal ??
            order.pricing?.subtotal ??
            order.totalAmount
          )
      const deliveryFee = toNumber(
        order.deliveryCharge ??
        order.deliveryFee ??
        order.pricing?.deliveryFee ??
        order.delivery?.fee
      )
      const taxAmount = toNumber(
        order.vatTax ??
        order.taxAmount ??
        order.tax ??
        order.pricing?.tax
      )
      const discountAmount = toNumber(
        order.couponDiscount ??
        order.itemDiscount ??
        order.discountAmount ??
        order.pricing?.discount
      )
      const computedTotal = subtotal + deliveryFee + taxAmount - discountAmount
      const totalAmount = toNumber(
        order.totalAmount ??
        order.pricing?.total ??
        computedTotal
      )
      const paymentType = order.paymentType || order.payment?.method || order.paymentMethod || "N/A"
      const deliveryPartnerName = formatDisplayText(
        order.deliveryPartnerName ||
        order.deliveryBoyName ||
        order.deliveryPartnerId?.name ||
        order.dispatch?.deliveryPartnerId?.name,
      )
      const deliveryPartnerPhone = formatDisplayText(
        order.deliveryPartnerPhone ||
        order.deliveryBoyNumber ||
        order.deliveryPartnerId?.phone ||
        order.dispatch?.deliveryPartnerId?.phone,
      )
      const orderStatus = formatDisplayText(order.orderStatus || order.status)
      const paymentStatus = formatDisplayText(
        order.paymentStatus
          || order.paymentCollectionStatus
          || (paymentType === "Cash on Delivery" ? "Not Collected" : null),
      )
      const customerName = formatDisplayText(order.customerName)
      const customerPhone = formatDisplayText(order.customerPhone)
      const restaurantName = formatDisplayText(order.restaurant)
      const deliveryType = formatDisplayText(order.deliveryType)
      const deliveryAddress = formatOrderAddress(order.address || order.customerAddress || order.deliveryAddress)
      const itemCount = items.reduce((sum, item) => sum + toNumber(item?.quantity || 1), 0) || items.length

      doc.setFillColor(15, 118, 110)
      doc.rect(0, 0, pageWidth, 46, "F")
      doc.setFillColor(255, 255, 255)
      doc.setGState(new doc.GState({ opacity: 0.08 }))
      doc.circle(pageWidth - 24, 12, 18, "F")
      doc.circle(pageWidth - 6, 36, 22, "F")
      doc.setGState(new doc.GState({ opacity: 1 }))

      if (logoDataUrl) {
        try {
          const logoFormat = logoDataUrl.includes("image/jpeg") ? "JPEG" : "PNG"
          doc.addImage(logoDataUrl, logoFormat, 14, 8, 24, 24, undefined, "FAST")
        } catch {
          // Ignore logo rendering issues and continue with text-only header.
        }
      }

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(17)
      doc.setFont(undefined, "bold")
      doc.text(companyName, logoDataUrl ? 42 : 14, 17)
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text("Order Invoice", logoDataUrl ? 42 : 14, 24)
      doc.setFontSize(8.5)
      doc.text("Admin order summary with billing and delivery details", logoDataUrl ? 42 : 14, 30)

      doc.setFontSize(9)
      doc.text(`Invoice #: ${orderId}`, pageWidth - 14, 14, { align: "right" })
      doc.text(`Date: ${orderDate}`, pageWidth - 14, 20, { align: "right" })
      doc.text(`Status: ${orderStatus}`, pageWidth - 14, 26, { align: "right" })
      doc.text(`Payment: ${paymentStatus}`, pageWidth - 14, 32, { align: "right" })

      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)

      const drawInfoCard = (titleText, x, y, width, rows, accentColor = [15, 118, 110]) => {
        const cardPaddingX = 4
        const titleBarHeight = 8
        const contentStartY = y + 14
        const labelX = x + cardPaddingX
        const valueX = x + 18
        const valueWidth = width - 26

        let measuredHeight = contentStartY
        const measuredRows = rows.map((row) => {
          const label = `${row.label}:`
          const valueLines = doc.splitTextToSize(formatDisplayText(row.value), valueWidth)
          const rowHeight = Math.max(5, valueLines.length * 4)
          measuredHeight += rowHeight
          return { label, valueLines, rowHeight }
        })

        const cardHeight = Math.max(39, measuredHeight - y + 4)

        doc.setFillColor(255, 255, 255)
        doc.roundedRect(x, y, width, cardHeight, 3, 3, "FD")
        doc.setFillColor(...accentColor)
        doc.roundedRect(x, y, width, titleBarHeight, 3, 3, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont(undefined, "bold")
        doc.text(titleText, labelX, y + 5.5)
        doc.setTextColor(71, 85, 105)
        doc.setFont(undefined, "normal")
        doc.setFontSize(8.5)

        let currentY = contentStartY
        measuredRows.forEach((row) => {
          doc.setFont(undefined, "bold")
          doc.text(row.label, labelX, currentY)
          doc.setFont(undefined, "normal")
          doc.text(row.valueLines, valueX, currentY)
          currentY += row.rowHeight
        })

        return cardHeight
      }

      const customerCardHeight = drawInfoCard("Customer", 14, 53, 58, [
        { label: "Name", value: customerName },
        { label: "Phone", value: customerPhone },
        { label: "Address", value: deliveryAddress },
      ])
      const restaurantCardHeight = drawInfoCard("Restaurant", 76, 53, 58, [
        { label: "Name", value: restaurantName },
        { label: "Delivery", value: deliveryType },
        { label: "Items", value: `${itemCount} item${itemCount === 1 ? "" : "s"}` },
      ], [37, 99, 235])
      const deliveryCardHeight = drawInfoCard("Delivery Partner", 138, 53, 58, [
        { label: "Name", value: deliveryPartnerName },
        { label: "Phone", value: deliveryPartnerPhone },
        { label: "Payment", value: paymentType },
      ], [249, 115, 22])

      const infoCardsBottomY = 53 + Math.max(customerCardHeight, restaurantCardHeight, deliveryCardHeight)

      autoTable(doc, {
        startY: infoCardsBottomY + 8,
        body: [[
          `Order ID: ${orderId}`,
          `Status: ${orderStatus}`,
          `Payment Status: ${paymentStatus}`,
          `Grand Total: ${formatMoney(totalAmount)}`,
        ]],
        theme: "plain",
        styles: {
          fontSize: 9,
          textColor: [30, 41, 59],
          fillColor: [241, 245, 249],
          cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
          lineColor: [226, 232, 240],
          lineWidth: 0.25,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { cellWidth: 50 },
          3: { cellWidth: 42, halign: "right", textColor: [15, 118, 110] },
        },
        margin: { left: 14, right: 14 },
      })

      const tableBody = items.length > 0
        ? items.map((item) => {
          const qty = toNumber(item.quantity || 1)
          const title = item.name || item.itemName || item.title || "Item"
          const unitPrice = toNumber(item.price)
          const lineTotal = qty * unitPrice
          return [qty, title, formatMoney(unitPrice), formatMoney(lineTotal)]
        })
        : [[1, "Order Total", formatMoney(totalAmount), formatMoney(totalAmount)]]

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 110) + 6,
        head: [["Qty", "Item", "Unit Price", "Line Total"]],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          cellPadding: 3.2,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 18 },
          1: { cellWidth: 94 },
          2: { halign: "right", cellWidth: 36 },
          3: { halign: "right", cellWidth: 38 },
        },
        margin: { left: 14, right: 14 },
      })

      const summaryStartY = (doc.lastAutoTable?.finalY || 130) + 10
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(pageWidth - 92, summaryStartY - 5, 78, 35, 2, 2, "FD")
      autoTable(doc, {
        startY: summaryStartY,
        body: [
          ["Subtotal", formatMoney(subtotal)],
          ["Delivery Fee", formatMoney(deliveryFee)],
          ["Tax", formatMoney(taxAmount)],
          ["Discount", `- ${formatMoney(discountAmount)}`],
          ["Grand Total", formatMoney(totalAmount)],
        ],
        theme: "plain",
        styles: {
          fontSize: 10,
          textColor: [30, 41, 59],
          cellPadding: 1.8,
        },
        columnStyles: {
          0: { cellWidth: 34, fontStyle: "bold" },
          1: { cellWidth: 40, halign: "right" },
        },
        margin: { left: pageWidth - 88 },
        didParseCell: (hookData) => {
          if (hookData.row.index === 4) {
            hookData.cell.styles.fontStyle = "bold"
            hookData.cell.styles.fontSize = 11
            hookData.cell.styles.textColor = [15, 118, 110]
          }
        },
      })

      const footerY = Math.max((doc.lastAutoTable?.finalY || summaryStartY) + 18, 262)
      doc.setDrawColor(226, 232, 240)
      doc.line(14, footerY - 6, pageWidth - 14, footerY - 6)
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, footerY)
      doc.text("Includes customer, restaurant, and delivery partner details.", pageWidth - 14, footerY, { align: "right" })

      const filename = `Invoice_${orderId}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      debugError("Error generating PDF invoice:", error)
      alert("Failed to download PDF invoice. Please try again.")
    }
  }

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  const resetColumns = () => {
    setVisibleColumns({
    si: true,
    orderId: true,
    orderDate: true,
    orderType: true,
    orderOtp: true,
    customer: true,
      restaurant: true,
      foodItems: true,
      totalAmount: true,
      paymentType: true,
      paymentCollectionStatus: true,
      orderStatus: true,
      actions: true,
    })
  }

  return {
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isViewOrderOpen,
    setIsViewOrderOpen,
    selectedOrder,
    filters,
    setFilters,
    visibleColumns,
    filteredOrders,
    count,
    activeFiltersCount,
    restaurants,
    handleApplyFilters,
    handleResetFilters,
    handleExport,
    handleViewOrder,
    handlePrintOrder,
    toggleColumn,
    resetColumns,
  }
}

