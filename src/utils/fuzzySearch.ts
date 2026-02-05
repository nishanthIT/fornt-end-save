/**
 * Fuzzy Search Utility
 * Provides typo-tolerant search functionality using Levenshtein distance
 */

// Calculate Levenshtein distance between two strings
export const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Check if a search word fuzzy matches any word in text
export const fuzzyMatchWord = (searchWord: string, text: string, maxDistance: number = 2): boolean => {
  const textLower = text.toLowerCase();
  const searchLower = searchWord.toLowerCase();
  
  // Exact contains match
  if (textLower.includes(searchLower)) return true;
  
  // Split text into words and check each
  const textWords = textLower.split(/\s+/);
  for (const textWord of textWords) {
    // For short words (<=3 chars), require exact match or distance of 1
    const allowedDistance = searchLower.length <= 3 ? 1 : maxDistance;
    
    // Check if word starts with search term (prefix match)
    if (textWord.startsWith(searchLower.substring(0, Math.min(3, searchLower.length)))) {
      const distance = levenshteinDistance(searchLower, textWord.substring(0, searchLower.length + 2));
      if (distance <= allowedDistance) return true;
    }
    
    // Check Levenshtein distance for similar length words
    if (textWord.length >= searchLower.length - 2 && textWord.length <= searchLower.length + 2) {
      const distance = levenshteinDistance(searchLower, textWord);
      if (distance <= allowedDistance) return true;
    }
  }
  return false;
};

// Fuzzy search filter function for arrays
export const fuzzyFilter = <T>(
  items: T[],
  searchQuery: string,
  getSearchableText: (item: T) => string,
  maxDistance: number = 2
): T[] => {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return items;
  }

  const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (searchWords.length === 0) {
    return items;
  }

  return items.filter(item => {
    const searchableText = getSearchableText(item);
    // All search words must fuzzy match somewhere in the text
    return searchWords.every(word => fuzzyMatchWord(word, searchableText, maxDistance));
  });
};

// Quick check if search query would match (useful for highlighting)
export const fuzzyMatch = (searchQuery: string, text: string, maxDistance: number = 2): boolean => {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return true;
  }

  const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (searchWords.length === 0) {
    return true;
  }

  return searchWords.every(word => fuzzyMatchWord(word, text, maxDistance));
};
