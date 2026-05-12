export const exportToCSV = (data, fileName, headersMap = null) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const headers = headersMap ? keys.map((key) => headersMap[key] || key) : keys;

  const csv = [
    headers.join(","),
    ...data.map((item) =>
      keys
        .map((key) => {
          let cell = item[key] == null ? "" : item[key];
          cell = typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell;
          return cell;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
