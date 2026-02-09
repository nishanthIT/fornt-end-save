// Utility function to construct proper image URLs
export const getImageUrl = (imagePath: string | string[] | { url?: string } | null | undefined): string => {
  if (!imagePath) {
    return "https://www.pngfind.com/pngs/m/131-1312918_png-file-svg-product-icon-transparent-png.png";
  }

  // Handle object case (e.g., { url: "/uploads/products/xyz.png" })
  if (typeof imagePath === 'object' && !Array.isArray(imagePath)) {
    const imgObj = imagePath as { url?: string };
    if (imgObj.url) {
      return getImageUrl(imgObj.url);
    }
    return "https://www.pngfind.com/pngs/m/131-1312918_png-file-svg-product-icon-transparent-png.png";
  }

  // Handle array case (for backward compatibility)
  const path = Array.isArray(imagePath) ? imagePath[0] : imagePath;
  
  // Ensure path is a string
  if (typeof path !== 'string') {
    return "https://www.pngfind.com/pngs/m/131-1312918_png-file-svg-product-icon-transparent-png.png";
  }
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a relative path starting with /, construct the full URL
  if (path.startsWith('/')) {
    // Get the base URL from environment
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    
    // Handle different path formats
    if (path.startsWith('/images/')) {
      // Convert /images/filename to /api/image/filename
      const filename = path.replace('/images/', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
      return `${baseUrl.replace('/api', '')}/api/image/${filename}`;
    }
    
    return `${baseUrl.replace('/api', '')}${path}`;
  }
  
  // If it's just a filename/barcode, construct the image URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const filename = path.replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
  return `${baseUrl.replace('/api', '')}/api/image/${filename}`;
};