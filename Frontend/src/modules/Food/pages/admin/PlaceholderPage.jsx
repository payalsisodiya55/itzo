export default function PlaceholderPage({ title, description }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title || "Page"}</h1>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        <p className="text-gray-500">Content will be added here.</p>
      </div>
    </div>
  );
}

