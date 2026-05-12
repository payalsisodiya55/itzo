// Export utility functions for employee management

export const exportEmployeesToCSV = (employees, headers, filename = "employees") => {
  const csvContent = [
    headers.map(h => `"${h.label}"`).join(","),
    ...employees.map(row => headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return '""';
      if (Array.isArray(value)) return `"${value.join(', ')}"`;
      if (typeof value === 'number') return value;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportEmployeesToExcel = (employees, headers, filename = "employees") => {
  const excelContent = [
    headers.map(h => h.label).join("\t"),
    ...employees.map(row => headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join(', ');
      return String(value).replace(/\t/g, ' ');
    }).join("\t"))
  ].join("\n");

  const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportEmployeesToPDF = (employees, headers, filename = "employees", title = "Employee Report") => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { text-align: center; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${employees.map(row => `
              <tr>
                ${headers.map(h => {
                  const value = row[h.key];
                  if (Array.isArray(value)) return `<td>${value.join(', ')}</td>`;
                  return `<td>${value || ''}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

export const exportEmployeesToJSON = (employees, filename = "employees") => {
  const jsonContent = JSON.stringify(employees, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};










