
// Simple utility for country data
// This is a subset of common country codes. In a production app, you might want a full library like 'libphonenumber-js'
// but here we keep it lightweight and self-contained.

export const countryData = [
  { code: 'US', name: 'United States', dialCode: '+1', length: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', length: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', length: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', length: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', length: 11 }, // Variable length, approx
  { code: 'FR', name: 'France', dialCode: '+33', length: 9 },
  { code: 'IN', name: 'India', dialCode: '+91', length: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', length: 11 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', length: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', length: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', length: 11 }, // Variable
  { code: 'RU', name: 'Russia', dialCode: '+7', length: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', length: 10 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', length: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', length: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', length: 10 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', length: 10 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', length: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', length: 10 },
  { code: 'IR', name: 'Iran', dialCode: '+98', length: 10 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', length: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', length: 9 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', length: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', length: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', length: 10 },
  // Default fallback
  { code: 'XX', name: 'International', dialCode: '+', length: 0 }
];

export const getCountryByCode = (code) => {
  return countryData.find(c => c.code === code) || countryData.find(c => c.code === 'US');
};

export const detectUserCountry = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return getCountryByCode(data.country_code);
  } catch (error) {
    console.warn('Country detection failed, defaulting to US', error);
    return getCountryByCode('US');
  }
};
