// Export utility functions for commission rules
export const exportCommissionToCSV = (commissions, filename = "delivery-boy-commission") => {
  const headers = ["SI", "Name", "Min Distance (km)", "Max Distance (km)", "Commission Per Km (₹)", "Base Payout (₹)", "Status"]
  const rows = commissions.map((commission) => [
    commission.sl,
    commission.name,
    commission.minDistance,
    commission.maxDistance === null ? "Unlimited" : commission.maxDistance,
    commission.commissionPerKm,
    commission.basePayout,
    commission.status ? "Active" : "Inactive"
  ])
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportCommissionToExcel = (commissions, filename = "delivery-boy-commission") => {
  const headers = ["SI", "Name", "Min Distance (km)", "Max Distance (km)", "Commission Per Km (₹)", "Base Payout (₹)", "Status"]
  const rows = commissions.map((commission) => [
    commission.sl,
    commission.name,
    commission.minDistance,
    commission.maxDistance === null ? "Unlimited" : commission.maxDistance,
    commission.commissionPerKm,
    commission.basePayout,
    commission.status ? "Active" : "Inactive"
  ])
  
  const csvContent = [
    headers.join("\t"),
    ...rows.map(row => row.join("\t"))
  ].join("\n")
  
  const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportCommissionToPDF = (commissions, filename = "delivery-boy-commission") => {
  const headers = ["SI", "Name", "Min Distance (km)", "Max Distance (km)", "Commission Per Km (₹)", "Base Payout (₹)", "Status"]
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Delivery Boy Commission Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        h1 { text-align: center; }
      </style>
    </head>
    <body>
      <h1>Delivery Boy Commission Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${commissions.map(commission => `
            <tr>
              <td>${commission.sl}</td>
              <td>${commission.name}</td>
              <td>${commission.minDistance}</td>
              <td>${commission.maxDistance === null ? "Unlimited" : commission.maxDistance}</td>
              <td>₹${commission.commissionPerKm}</td>
              <td>₹${commission.basePayout}</td>
              <td>${commission.status ? "Active" : "Inactive"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  const printWindow = window.open("", "_blank")
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

export const exportCommissionToJSON = (commissions, filename = "delivery-boy-commission") => {
  const jsonContent = JSON.stringify(commissions, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

