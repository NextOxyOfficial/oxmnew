/**
 * SMS utility functions for message counting and formatting
 */

/**
 * Calculates the number of SMS segments required for a message
 * @param message The message text
 * @returns Object containing segment count and character info
 */
export function calculateSmsSegments(message: string): {
  segments: number;
  characters: number;
  charactersPerSegment: number;
  encoding: 'GSM' | 'Unicode';
} {
  const length = message.length;
  
  // Check if message contains non-GSM characters (like Bengali/Unicode)
  // Bengali characters, emojis, and other Unicode characters require Unicode encoding
  const hasUnicodeChars = /[^\x00-\x7F]/.test(message) || 
                          /[\u0980-\u09FF]/.test(message) || // Bengali Unicode range
                          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(message); // Emojis
  
  let charactersPerSegment: number;
  let encoding: 'GSM' | 'Unicode';
  
  if (hasUnicodeChars) {
    // Unicode encoding (for Bengali, emojis, etc.)
    charactersPerSegment = 70; // Single segment
    encoding = 'Unicode';
    
    if (length <= 70) {
      return {
        segments: 1,
        characters: length,
        charactersPerSegment,
        encoding
      };
    } else {
      // For concatenated Unicode messages, each segment can hold 67 characters
      // (3 characters are reserved for concatenation headers)
      const segmentsNeeded = Math.ceil(length / 67);
      return {
        segments: segmentsNeeded,
        characters: length,
        charactersPerSegment: 67,
        encoding
      };
    }
  } else {
    // GSM 7-bit encoding (for basic Latin characters)
    charactersPerSegment = 160; // Single segment
    encoding = 'GSM';
    
    if (length <= 160) {
      return {
        segments: 1,
        characters: length,
        charactersPerSegment,
        encoding
      };
    } else {
      // For concatenated GSM messages, each segment can hold 153 characters
      // (7 characters are reserved for concatenation headers)
      const segmentsNeeded = Math.ceil(length / 153);
      return {
        segments: segmentsNeeded,
        characters: length,
        charactersPerSegment: 153,
        encoding
      };
    }
  }
}

/**
 * Formats SMS segment information for display
 * @param message The message text
 * @returns Formatted string with segment info
 */
export function formatSmsInfo(message: string): string {
  const info = calculateSmsSegments(message);
  
  if (info.segments === 1) {
    return `${info.characters}/${info.charactersPerSegment} characters (1 SMS)`;
  } else {
    return `${info.characters} characters (${info.segments} SMS)`;
  }
}

/**
 * Gets the remaining characters for the current segment
 * @param message The message text
 * @returns Number of characters remaining in current segment
 */
export function getRemainingCharacters(message: string): number {
  const info = calculateSmsSegments(message);
  
  if (info.segments === 1) {
    return info.charactersPerSegment - info.characters;
  } else {
    // For multi-segment messages, show remaining for current segment
    const currentSegmentChars = info.characters % info.charactersPerSegment;
    return info.charactersPerSegment - currentSegmentChars;
  }
}
