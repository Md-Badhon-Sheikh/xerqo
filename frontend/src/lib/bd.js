// Bangladesh: all 64 districts (address forms, checkout)
export const DISTRICTS = [
  'Dhaka', 'Chattogram', 'Gazipur', 'Narayanganj', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla',
  'Bagerhat', 'Bandarban', 'Barguna', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapainawabganj', 'Chuadanga', "Cox's Bazar",
  'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat',
  'Khagrachhari', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur',
  'Moulvibazar', 'Munshiganj', 'Naogaon', 'Narail', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh',
  'Patuakhali', 'Pirojpur', 'Rajbari', 'Rangamati', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Tangail', 'Thakurgaon',
]

// Delivery zone for a district (Dhaka district = inside Dhaka)
export const zoneFor = (district) => (district === 'Dhaka' ? 'inside_dhaka' : 'outside_dhaka')

// "01712345678" -> "01712-345678"
export const prettyPhone = (p) => (p && p.length === 11 ? `${p.slice(0, 5)}-${p.slice(5)}` : p || '')
