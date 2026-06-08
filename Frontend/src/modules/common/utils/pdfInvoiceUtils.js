import { getCachedSettings, loadBusinessSettings } from "./businessSettings"

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatMoney = (value) => `${toNumber(value).toFixed(2)}`

const formatDisplayText = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback
  const normalized = String(value).trim()
  return normalized || fallback
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
  if (!u.startsWith("http") && !u.startsWith("/")) return null
  try {
    const response = await fetch(url, { mode: 'cors', cache: "force-cache" })
    if (!response.ok) return null
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch (err) {
    console.error('Error converting image to data URL:', err)
    return null
  }
}

// Convert numbers to words (e.g. 187.95 -> One Hundred Eighty Seven Rupees And Ninety Five Paisa Only)
const numberToWords = (num) => {
  if (num === 0) return "Zero Rupees Only";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let str = '';
    const numArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!numArr) return '';
    str += (numArr[1] != 0) ? (a[Number(numArr[1])] || b[numArr[1][0]] + ' ' + a[numArr[1][1]]) + 'Crore ' : '';
    str += (numArr[2] != 0) ? (a[Number(numArr[2])] || b[numArr[2][0]] + ' ' + a[numArr[2][1]]) + 'Lakh ' : '';
    str += (numArr[3] != 0) ? (a[Number(numArr[3])] || b[numArr[3][0]] + ' ' + a[numArr[3][1]]) + 'Thousand ' : '';
    str += (numArr[4] != 0) ? (a[Number(numArr[4])] || b[numArr[4][0]] + ' ' + a[numArr[4][1]]) + 'Hundred ' : '';
    str += (numArr[5] != 0) ? ((str != '') ? 'And ' : '') + (a[Number(numArr[5])] || b[numArr[5][0]] + ' ' + a[numArr[5][1]]) : '';
    return str;
  }
  
  const parts = num.toString().split(".");
  const rupees = parseInt(parts[0], 10);
  const paise = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2), 10) : 0;
  
  let res = inWords(rupees) + "Rupees ";
  if (paise > 0) {
    res += "And " + inWords(paise) + "Paisa ";
  }
  return res + "Only";
}

export const generateOrderInvoicePDF = async (order, itzoLogoUrl) => {
  try {
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    const orderId = order.orderId || order.id || "N/A"
    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : (order.date || new Date().toISOString().split("T")[0])
    
    const settings = getCachedSettings() || await loadBusinessSettings()
    const companyName = "Itzo" // Replacing eternal with Itzo
    const companyFullName = settings?.legalName || "ITZO LIMITED"
    const companyPan = settings?.panNumber || "N/A"
    const companyCin = settings?.cinNumber || "N/A"
    const companyGstin = settings?.gstin || "N/A"
    const companyFssai = settings?.fssai || "N/A"
    
    const logoDataUrl = await imageUrlToDataUrl(itzoLogoUrl)

    // Dynamic Restaurant Details
    const legalEntityName = formatDisplayText(companyFullName || order.restaurantDetails?.legalEntityName || order.restaurant)
    const restaurantName = formatDisplayText(order.restaurant)
    const restaurantAddress = formatDisplayText(order.restaurantAddress || order.restaurantDetails?.address)
    const restaurantGstin = formatDisplayText(companyGstin)
    const restaurantFssai = formatDisplayText(companyFssai)

    // Dynamic Customer Details
    const customerName = formatDisplayText(order.userName || order.customerName)
    let rawAddress = order.address || order.customerAddress || order.deliveryAddress;
    let deliveryAddress = "Not available";
    let stateName = "N/A";
    if (typeof rawAddress === 'object') {
        deliveryAddress = [rawAddress.street, rawAddress.additionalDetails, rawAddress.city, rawAddress.state, rawAddress.zipCode].filter(Boolean).join(", ");
        stateName = rawAddress.state || "N/A";
    } else if (typeof rawAddress === 'string') {
        deliveryAddress = rawAddress;
    }

    // Calculations for Page 1 (Restaurant Invoice)
    const items = Array.isArray(order.items) ? order.items : []
    const discountAmount = toNumber(order.couponDiscount ?? order.itemDiscount ?? order.discountAmount ?? order.pricing?.discount)
    // Distribute discount proportionally across items for the PDF breakdown
    let totalGross = 0;
    items.forEach(item => totalGross += toNumber(item.quantity || 1) * toNumber(item.price))
    
    // We assume standard GST is 5% (2.5% CGST + 2.5% SGST) for restaurant services
    const gstRate = order.restaurantDetails?.gstRate ? toNumber(order.restaurantDetails.gstRate) : 5;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    
    let totalItemsNet = 0;
    let totalItemsCgst = 0;
    let totalItemsSgst = 0;
    let totalItemsTotal = 0;

    const tableBody = items.map((item) => {
      const qty = toNumber(item.quantity || 1)
      const title = `${qty} x ${item.name || item.itemName || "Item"}`
      const unitPrice = toNumber(item.price)
      const grossValue = qty * unitPrice
      const itemDiscount = totalGross > 0 ? (grossValue / totalGross) * discountAmount : 0
      
      // Calculate taxes backward if item.price is inclusive, or forward if exclusive.
      // Most restaurant aggregators treat price as inclusive of tax in the menu. Let's assume inclusive for simplicity, 
      // or we just calculate tax based on net value if exclusive.
      // Reference invoice shows: Net Value = Gross - Discount. Tax is calculated on Net Value. Total = Net + Tax.
      // But wait, the reference image: Gross 299, Discount 140, Net 159. CGST 2.5% = 3.975. SGST 2.5% = 3.975. Total = 166.95
      const netValue = grossValue - itemDiscount
      const cgstVal = netValue * (cgstRate / 100)
      const sgstVal = netValue * (sgstRate / 100)
      const totalVal = netValue + cgstVal + sgstVal
      
      totalItemsNet += netValue;
      totalItemsCgst += cgstVal;
      totalItemsSgst += sgstVal;
      totalItemsTotal += totalVal;
      
      return [title, formatMoney(grossValue), formatMoney(itemDiscount), formatMoney(netValue), `${cgstRate}%`, formatMoney(cgstVal), `${sgstRate}%`, formatMoney(sgstVal), formatMoney(totalVal)]
    })
    
    // Packaging Charge
    const packagingCharge = toNumber(order.packagingFee ?? order.restaurantPackagingCharge ?? 0)
    const packCgst = packagingCharge * (cgstRate / 100)
    const packSgst = packagingCharge * (sgstRate / 100)
    const packTotal = packagingCharge + packCgst + packSgst

    // Final Totals
    const grandNet = totalItemsNet + packagingCharge
    const grandCgst = totalItemsCgst + packCgst
    const grandSgst = totalItemsSgst + packSgst
    const grandTotal = totalItemsTotal + packTotal

    // -------------------------------------------------------------------------
    // PAGE 1: RESTAURANT INVOICE
    // -------------------------------------------------------------------------
    const renderHeader = (doc, title1, title2) => {
      if (logoDataUrl) {
        try {
          const logoFormat = logoDataUrl.includes("image/jpeg") ? "JPEG" : "PNG"
          doc.addImage(logoDataUrl, logoFormat, margin, margin, 32, 10, undefined, "FAST")
        } catch {
          doc.setFontSize(22)
          doc.setFont("helvetica", "bold")
          doc.text(companyName, margin, margin + 8)
        }
      } else {
        doc.setFontSize(22)
        doc.setFont("helvetica", "bold")
        doc.text(companyName, margin, margin + 8)
      }
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(title1, pageWidth / 2, margin + 4, { align: "center" })
      doc.text(title2, pageWidth / 2, margin + 10, { align: "center" })
      doc.setDrawColor(0)
      doc.setLineWidth(0.5)
      doc.line(margin, margin + 16, pageWidth - margin, margin + 16)
    }

    renderHeader(doc, "Tax Invoice", "ORIGINAL FOR RECIPIENT")

    let currentY = margin + 22
    
    // Restaurant Details
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Tax Invoice on behalf of -", margin, currentY)
    currentY += 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Legal Entity Name: ${legalEntityName}`, margin, currentY); currentY += 5
    doc.text(`Restaurant Name: ${restaurantName}`, margin, currentY); currentY += 5
    doc.text(`Restaurant Address: ${restaurantAddress}`, margin, currentY); currentY += 5
    doc.text(`Restaurant GSTIN: ${restaurantGstin}`, margin, currentY); currentY += 5
    doc.text(`Restaurant FSSAI: ${restaurantFssai}`, margin, currentY); currentY += 5
    doc.text(`Invoice No.: ${orderId}`, margin, currentY); currentY += 5
    doc.text(`Invoice Date: ${orderDate}`, margin, currentY); currentY += 8

    // Customer Details
    doc.setFont("helvetica", "bold")
    doc.text(`Customer Name: ${customerName}`, margin, currentY); currentY += 5
    doc.setFont("helvetica", "normal")
    doc.text(`Delivery Address: ${deliveryAddress}`, margin, currentY); currentY += 5
    doc.text(`State name and Place of Supply: ${stateName}`, margin, currentY); currentY += 8

    // Service Details
    const hsnCode = order.restaurantDetails?.hsnCode || "996331"
    doc.setFont("helvetica", "bold")
    doc.text(`HSN Code: ${hsnCode}`, margin, currentY); currentY += 5
    doc.setFont("helvetica", "normal")
    doc.text(`Service Description: Restaurant Service`, margin, currentY); currentY += 8

    // Table
    autoTable(doc, {
      startY: currentY,
      head: [["Particulars", "Gross value", "Discount", "Net value", "CGST\n(Rate)", "CGST\n(INR)", "SGST\n(Rate)", "SGST\n(INR)", "Total"]],
      body: [
        ...tableBody,
        ["Item(s) Total", formatMoney(totalGross), formatMoney(discountAmount), formatMoney(totalItemsNet), "", formatMoney(totalItemsCgst), "", formatMoney(totalItemsSgst), formatMoney(totalItemsTotal)],
        ["Restaurant Packaging Charge", formatMoney(packagingCharge), "0.00", formatMoney(packagingCharge), `${cgstRate}%`, formatMoney(packCgst), `${sgstRate}%`, formatMoney(packSgst), formatMoney(packTotal)],
        ["Total Value", "", "", formatMoney(grandNet), "", formatMoney(grandCgst), "", formatMoney(grandSgst), formatMoney(grandTotal)]
      ],
      theme: "grid",
      headStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", lineWidth: 0.2, lineColor: 0, halign: 'center' },
      bodyStyles: { textColor: 0, lineWidth: 0.2, lineColor: 0 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.row.index >= tableBody.length) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    })

    currentY = doc.lastAutoTable.finalY + 8
    
    doc.setFont("helvetica", "bold")
    doc.text(`Amount (in words): ${numberToWords(grandTotal)}`, margin, currentY); currentY += 8
    doc.setFont("helvetica", "normal")
    doc.text(`Amount of INR ${formatMoney(grandTotal)} settled digitally against Order ID ${orderId} dated ${orderDate}.`, margin, currentY); currentY += 8
    doc.text("Supply attracts reverse charge : No", margin, currentY); currentY += 16

    // Signatory
    const footerY = pageHeight - 40
    doc.setFont("helvetica", "bold")
    doc.text(`For ${companyFullName}`, margin, footerY)
    doc.text("Authorized Signatory", pageWidth - margin - 40, footerY + 20)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`PAN: ${companyPan}`, margin, footerY + 6)
    doc.text(`CIN: ${companyCin}`, margin, footerY + 10)
    doc.text(`GSTIN: ${companyGstin}`, margin, footerY + 14)
    doc.text(`FSSAI: ${companyFssai}`, margin, footerY + 18)

    // -------------------------------------------------------------------------
    // PAGE 2: PLATFORM FEE INVOICE
    // -------------------------------------------------------------------------
    const platformFee = toNumber(order.platformFee ?? order.pricing?.platformFee ?? 0)
    const deliveryCharge = toNumber(order.deliveryCharge ?? order.deliveryFee ?? order.pricing?.deliveryFee ?? 0)
    const totalPlatformServices = platformFee + deliveryCharge
    
    if (totalPlatformServices > 0) {
      doc.addPage()
      renderHeader(doc, "Tax Invoice", "ORIGINAL FOR RECIPIENT")
      currentY = margin + 22
      
      // Box 1
      doc.setDrawColor(0)
      doc.setFillColor(230, 230, 230)
      doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'FD')
      doc.setFont("helvetica", "bold")
      doc.text(`${companyFullName}`, margin + 2, currentY + 4)
      currentY += 10
      
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(`Address: ${settings?.address || "N/A"}`, margin, currentY)
      doc.text(`PAN: ${companyPan}`, pageWidth / 2, currentY); currentY += 4
      doc.text(`State: ${settings?.state || "N/A"}`, margin, currentY)
      doc.text(`CIN: ${companyCin}`, pageWidth / 2, currentY); currentY += 4
      doc.text(`Email ID: ${settings?.email || "support@itzo.com"}`, margin, currentY)
      doc.text(`GSTIN: ${companyGstin}`, pageWidth / 2, currentY); currentY += 4
      doc.text(`Invoice No: PF-${orderId}`, margin, currentY)
      doc.text(`Invoice Date: ${orderDate}`, pageWidth / 2, currentY); currentY += 8
      
      // Box 2
      doc.setFillColor(230, 230, 230)
      doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'FD')
      doc.setFont("helvetica", "bold")
      doc.text("Customer Details", margin + 2, currentY + 4)
      currentY += 10
      
      doc.setFontSize(8)
      doc.text(`Name: ${customerName}`, margin, currentY)
      doc.text("GSTIN: UNREGISTERED", pageWidth / 2, currentY); currentY += 4
      doc.text(`Delivery Address: ${deliveryAddress}`, margin, currentY)
      doc.text(`Place of Supply: ${stateName}`, pageWidth / 2, currentY); currentY += 8
      
      // Box 3
      doc.setFillColor(230, 230, 230)
      doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'FD')
      doc.setFont("helvetica", "bold")
      doc.text("Service Details", margin + 2, currentY + 4)
      currentY += 10
      
      doc.setFont("helvetica", "normal")
      doc.text("HSN Code: 999799", margin, currentY)
      doc.text("Supply Description: Other Services N.E.C", pageWidth / 2, currentY); currentY += 6

      // Platform Fee Taxes (assuming 18% GST -> 9% CGST, 9% SGST)
      const platGstRate = 18;
      const platCgstRate = 9;
      const platSgstRate = 9;
      
      // Assuming platform fee is inclusive of tax
      const platNet = totalPlatformServices / (1 + (platGstRate/100));
      const platCgst = platNet * (platCgstRate/100);
      const platSgst = platNet * (platSgstRate/100);
      
      autoTable(doc, {
        startY: currentY,
        head: [["Sr.No", "Particulars", "Taxable Amount", "CGST", "SGST", "Total"]],
        body: [
          ["1", "Platform & Delivery fee", formatMoney(platNet), formatMoney(platCgst), formatMoney(platSgst), formatMoney(totalPlatformServices)],
          ["Total", "", formatMoney(platNet), formatMoney(platCgst), formatMoney(platSgst), formatMoney(totalPlatformServices)]
        ],
        theme: "grid",
        headStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", lineWidth: 0.2, lineColor: 0, halign: 'center' },
        bodyStyles: { textColor: 0, lineWidth: 0.2, lineColor: 0, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: function (data) {
          if (data.row.index === 1) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      })
      
      currentY = doc.lastAutoTable.finalY + 8
      
      doc.setFont("helvetica", "normal")
      doc.text(`Amount of INR ${formatMoney(totalPlatformServices)} settled through digital mode/payment received against Order id (${orderId}) dated (${orderDate})`, margin, currentY); currentY += 4
      doc.text("Tax is not payable on reverse charge basis", margin, currentY);
      
      // Signatory
      doc.setFont("helvetica", "bold")
      doc.text(`For ${companyFullName}`, pageWidth - margin - 80, pageHeight - 50)
      doc.text("Authorized Signatory", pageWidth - margin - 80, pageHeight - 30)
      
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text("Communication Address: As per platform policies", margin, pageHeight - 15, { align: "left" })
      doc.text("Please refer to platform terms and conditions which are incorporated in this invoice by reference.", margin, pageHeight - 10, { align: "left" })
    }

    const filename = `Invoice_${orderId}_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(filename)
    return true;
  } catch (error) {
    console.error("Error generating PDF invoice:", error)
    throw error
  }
}
