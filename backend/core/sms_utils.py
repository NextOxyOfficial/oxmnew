"""
SMS utility functions for proper character counting
"""
import re


def calculate_sms_segments(message):
    """
    Calculate the number of SMS segments required for a message.
    
    Args:
        message (str): The SMS message text
        
    Returns:
        dict: Contains segments count, characters, encoding type, etc.
    """
    length = len(message)
    
    # Check if message contains Unicode characters (Bengali, emojis, etc.)
    # ASCII range: 0x00-0x7F
    # Bengali Unicode range: 0x0980-0x09FF
    # Common emoji ranges
    has_unicode_chars = (
        re.search(r'[^\x00-\x7F]', message) or
        re.search(r'[\u0980-\u09FF]', message) or  # Bengali
        re.search(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]', message)  # Emojis
    )
    
    if has_unicode_chars:
        # Unicode encoding (UCS-2) - for Bengali, emojis, etc.
        encoding = 'Unicode'
        
        if length <= 70:
            # Single segment Unicode SMS
            return {
                'segments': 1,
                'characters': length,
                'characters_per_segment': 70,
                'encoding': encoding
            }
        else:
            # Multi-part Unicode SMS (67 chars per segment due to headers)
            segments_needed = (length + 66) // 67  # Equivalent to ceil(length / 67)
            return {
                'segments': segments_needed,
                'characters': length,
                'characters_per_segment': 67,
                'encoding': encoding
            }
    else:
        # GSM 7-bit encoding - for basic Latin characters
        encoding = 'GSM'
        
        if length <= 160:
            # Single segment GSM SMS
            return {
                'segments': 1,
                'characters': length,
                'characters_per_segment': 160,
                'encoding': encoding
            }
        else:
            # Multi-part GSM SMS (153 chars per segment due to headers)
            segments_needed = (length + 152) // 153  # Equivalent to ceil(length / 153)
            return {
                'segments': segments_needed,
                'characters': length,
                'characters_per_segment': 153,
                'encoding': encoding
            }


def format_sms_info(message):
    """
    Format SMS segment information for display.
    
    Args:
        message (str): The SMS message text
        
    Returns:
        str: Formatted string with segment info
    """
    info = calculate_sms_segments(message)
    
    if info['segments'] == 1:
        return f"{info['characters']}/{info['characters_per_segment']} characters (1 SMS)"
    else:
        return f"{info['characters']} characters ({info['segments']} SMS)"
