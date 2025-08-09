/**
 * SMS Character Counting Examples
 * 
 * This file demonstrates how the SMS character counting utility works
 * for Bengali text and different message lengths.
 */

import { calculateSmsSegments, formatSmsInfo } from './sms';

// Example 1: Short Bengali message (single SMS)
const shortBengaliMessage = 'সম্মানিত কাস্টমার, আপনার কেনাকাটা ১২০০ টাকা';
console.log('Short Bengali message:');
console.log('Text:', shortBengaliMessage);
console.log('Length:', shortBengaliMessage.length, 'characters');
console.log('SMS Info:', calculateSmsSegments(shortBengaliMessage));
console.log('Formatted:', formatSmsInfo(shortBengaliMessage));
console.log('---');

// Example 2: Long Bengali message (multiple SMS)
const longBengaliMessage = 'সম্মানিত কাস্টমার, আপনার কেনাকাটা ১২০০ টাকা, আমাদের দোকানে কেনাকাটা করার জন্য আপনাকে ধন্যবাদ! আমাদের খাতায় আপনার বাকি রয়েছে ৫০০ টাকা। পরবর্তীতে আরো কেনাকাটা করুন।';
console.log('Long Bengali message:');
console.log('Text:', longBengaliMessage);
console.log('Length:', longBengaliMessage.length, 'characters');
console.log('SMS Info:', calculateSmsSegments(longBengaliMessage));
console.log('Formatted:', formatSmsInfo(longBengaliMessage));
console.log('---');

// Example 3: English message for comparison
const englishMessage = 'Dear customer, your purchase amount is $120. Thank you for shopping with us!';
console.log('English message:');
console.log('Text:', englishMessage);
console.log('Length:', englishMessage.length, 'characters');
console.log('SMS Info:', calculateSmsSegments(englishMessage));
console.log('Formatted:', formatSmsInfo(englishMessage));
console.log('---');

// Example 4: Mixed content with emojis
const mixedMessage = 'Thank you for shopping! ধন্যবাদ! 😊👍';
console.log('Mixed message with emojis:');
console.log('Text:', mixedMessage);
console.log('Length:', mixedMessage.length, 'characters');
console.log('SMS Info:', calculateSmsSegments(mixedMessage));
console.log('Formatted:', formatSmsInfo(mixedMessage));
console.log('---');

// Example 5: Typical order confirmation message
const orderMessage = 'সম্মানিত কাস্টমার, আপনার কেনাকাটা ১,৫০০ টাকা, আমাদের স্টোরে কেনাকাটা করার জন্য আপনাকে ধন্যবাদ! আমাদের খাতায় আপনার বাকি রয়েছে ৩০০ টাকা';
console.log('Typical order confirmation:');
console.log('Text:', orderMessage);
console.log('Length:', orderMessage.length, 'characters');
console.log('SMS Info:', calculateSmsSegments(orderMessage));
console.log('Formatted:', formatSmsInfo(orderMessage));

/**
 * Key points about SMS counting:
 * 
 * 1. Bengali text uses Unicode encoding
 * 2. Single Unicode SMS can hold up to 70 characters
 * 3. When text exceeds 70 characters, it's split into multiple segments
 * 4. Each segment in a multi-part Unicode SMS can hold 67 characters (3 reserved for headers)
 * 5. English text uses GSM encoding (160 chars single, 153 chars multi-part)
 * 6. Any Unicode characters (Bengali, emojis, special symbols) force Unicode encoding
 */
