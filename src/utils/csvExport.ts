
/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (object keys will be used if not provided)
 * @returns CSV string
 */
export const objectsToCSV = <T extends Record<string, any>>(data: T[], headers?: Record<keyof T, string>): string => {
  if (data.length === 0) return '';

  // Use provided headers or extract from the first object
  const keys = Object.keys(data[0]) as Array<keyof T>;
  
  // Create header row
  const headerRow = headers 
    ? Object.keys(headers).map(key => headers[key as keyof T])
    : keys;
  
  // Create CSV rows
  const csvRows = [
    headerRow.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        // Handle different types of values and ensure proper CSV escaping
        const cellValue = value === null || value === undefined
          ? ''
          : typeof value === 'string'
            ? `"${value.replace(/"/g, '""')}"`
            : String(value);
        return cellValue;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
};

/**
 * Create and trigger download of a CSV file
 * @param data CSV string
 * @param filename Name for the downloaded file
 */
export const downloadCSV = (data: string, filename: string): void => {
  // Create blob with CSV data
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  
  // Set up download link
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  
  // Append link to body
  document.body.appendChild(link);
  
  // Trigger download and clean up
  link.click();
  document.body.removeChild(link);
};

/**
 * Format a date string to YYYY-MM-DD
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export const formatDateForFilename = (dateString?: string): string => {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toISOString().split('T')[0];
};
