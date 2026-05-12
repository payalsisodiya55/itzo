// Export utility functions for restaurants
export const exportRestaurantsToExcel = (restaurants, filename = "restaurants") => {
  const headers = [
    "SI",
    "Restaurant ID",
    "Restaurant Name",
    "Owner Name",
    "Owner Phone",
    "Zone",
    "Cuisine",
    "Status",
    "Rating"
  ]
  
  const rows = restaurants.map((restaurant, index) => [
    index + 1,
    restaurant.originalData?.restaurantId || restaurant.originalData?._id || restaurant._id || restaurant.id || "N/A",
    restaurant.name || "N/A",
    restaurant.ownerName || "N/A",
    restaurant.ownerPhone || "N/A",
    restaurant.zone || "N/A",
    restaurant.cuisine || "N/A",
    restaurant.status ? "Active" : "Inactive",
    restaurant.rating || 0
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

export const exportRestaurantsToPDF = (restaurants, filename = "restaurants") => {
  const headers = [
    "SI",
    "Restaurant ID",
    "Restaurant Name",
    "Owner Name",
    "Owner Phone",
    "Zone",
    "Cuisine",
    "Status",
    "Rating"
  ]
  
  const rows = restaurants.map((restaurant, index) => [
    index + 1,
    restaurant.originalData?.restaurantId || restaurant.originalData?._id || restaurant._id || restaurant.id || "N/A",
    restaurant.name || "N/A",
    restaurant.ownerName || "N/A",
    restaurant.ownerPhone || "N/A",
    restaurant.zone || "N/A",
    restaurant.cuisine || "N/A",
    restaurant.status ? "Active" : "Inactive",
    restaurant.rating || 0
  ])
  
  const printWindow = window.open("", "_blank")
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
          }
          h1 { 
            text-align: center; 
            color: #1e293b;
            margin-bottom: 10px;
          }
          p { 
            text-align: center; 
            color: #64748b;
            margin-bottom: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #3b82f6; 
            color: white; 
            font-weight: bold; 
          }
          tr:nth-child(even) { 
            background-color: #f9fafb; 
          }
          tr:hover { 
            background-color: #f1f5f9; 
          }
          @media print { 
            body { 
              margin: 0; 
              padding: 10px;
            }
            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <h1>Restaurants List</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
          }
        </script>
      </body>
    </html>
  `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

