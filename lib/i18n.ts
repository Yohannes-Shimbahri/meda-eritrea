'use client'
import { useState, useEffect } from 'react'

export type Language = 'en' | 'am' | 'ti' | 'ar'

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇨🇦' },
  { code: 'am', label: 'አማ', flag: '🇪🇹' },
  { code: 'ti', label: 'ትግ', flag: '🇪🇷' },
  { code: 'ar', label: 'عر', flag: '🌍' },
]

const translations: Record<Language, any> = {
  en: {
    nav: { home: 'Home', browse: 'Browse', login: 'Login', register: 'Register', listBusiness: 'List Your Business', signUp: 'Sign Up', signOut: 'Sign Out', dashboard: 'Dashboard' },
    home: {
      badge: '🇨🇦 Habesha Community in Canada',
      hero_title: 'Find Habesha Businesses',
      hero_title2: 'Across Canada',
      hero_subtitle: 'Book appointments, browse services, and connect with your community.',
      search_placeholder: 'Search businesses...',
      search_btn: 'Search',
      browse_by_category: 'Browse by Category',
      footer: '© 2025 Meda. Built for the Habesha community in Canada.',
    },
    browse: {
      title: 'Browse Habesha Businesses',
      search_placeholder: 'Search businesses...',
      all: 'All',
      no_businesses: 'No businesses found',
      no_businesses_sub: 'Try adjusting your search or filters',
      businesses_found: 'businesses found',
      featured_first: 'Featured First',
      top_rated: 'Top Rated',
      most_reviewed: 'Most Reviewed',
      all_cities: 'All Cities',
      clear: 'Clear',
      view_profile: 'View Profile',
      filter: 'Filter',
    },
    business: {
      book_now: '📅 Book Now',
      call_now: '📞 Call Now',
      contact: '💬 Contact',
      save: '♡ Save',
      saved: '♥ Saved',
      call: '📞 Call',
      no_reviews: 'No reviews yet',
      new_listing: 'New',
      verified: '✓ Verified',
      services: 'Services',
      employees: 'Employees',
      reviews: 'Reviews',
      hours: 'Hours',
      posts: '📸 Posts',
      book_appointment: 'Book Appointment',
      select_service: 'Select a service',
      no_preference: 'No Preference',
      team_member: 'Team Member',
      date: 'Date',
      available_times: 'Available Times',
      note_optional: 'Note (optional)',
      sign_in_to_book: 'Sign In to Book',
      booking_requested: 'Booking Requested!',
      booking_confirmed_soon: 'The business will confirm shortly.',
      no_services: 'No services listed yet',
      no_portfolio: 'No portfolio photos yet',
      get_in_touch: 'Get in Touch',
      reach_out: 'Reach out to this business directly',
      leave_review: 'Leave a Review',
      sign_in_to_review: 'Sign in to leave a review',
      submit_review: 'Submit Review',
      your_review: 'Your Review',
      share_experience: 'Share your experience...',
      closed: 'Closed',
      not_set: 'Not set',
      browse_businesses: 'Browse Businesses',
    },
  },
  am: {
    nav: { home: 'መነሻ', browse: 'ፈልግ', login: 'ግባ', register: 'ተመዝገብ', listBusiness: 'ንግድዎን ያስተዋውቁ', signUp: 'ተመዝገብ', signOut: 'ውጣ', dashboard: 'መቆጣጠሪያ' },
    home: {
      badge: '🇨🇦 በካናዳ የሐበሻ ማህበረሰብ',
      hero_title: 'የሐበሻ ንግዶችን ያግኙ',
      hero_title2: 'በመላው ካናዳ',
      hero_subtitle: 'ቀጠሮ ይያዙ፣ አገልግሎቶችን ያስሱ እና ማህበረሰቡን ያገናኙ፣ ሁሉም በአንድ ቦታ።',
      search_placeholder: 'ንግዶችን ፈልግ...',
      search_btn: 'ፈልግ',
      browse_by_category: 'በምድብ ያስሱ',
      footer: '© 2025 ሜዳ። ለሐበሻ ማህበረሰብ በካናዳ የተሰራ።',
    },
    browse: {
      title: 'የሐበሻ ንግዶችን ያስሱ',
      search_placeholder: 'ንግዶችን ፈልግ...',
      all: 'ሁሉም',
      no_businesses: 'ምንም ንግድ አልተገኘም',
      no_businesses_sub: 'ፍለጋዎን ወይም ማጣሪያዎን ያስተካክሉ',
      businesses_found: 'ንግዶች ተገኝተዋል',
      featured_first: 'ተለይተው የቀረቡ',
      top_rated: 'ከፍተኛ ደረጃ',
      most_reviewed: 'በጣም የተገመገሙ',
      all_cities: 'ሁሉም ከተሞች',
      clear: 'አጽዳ',
      view_profile: 'መገለጫ ይመልከቱ',
      filter: 'አጣራ',
    },
    business: {
      book_now: '📅 አሁን ያዙ',
      call_now: '📞 አሁን ይደውሉ',
      contact: '💬 ያነጋግሩ',
      save: '♡ አስቀምጥ',
      saved: '♥ ተቀምጧል',
      call: '📞 ደውል',
      no_reviews: 'ምንም ግምገማ የለም',
      new_listing: 'አዲስ',
      verified: '✓ የተረጋገጠ',
      services: 'አገልግሎቶች',
      employees: 'ሰራተኞች',
      reviews: 'ግምገማዎች',
      hours: 'የስራ ሰዓቶች',
      posts: '📸 ፎቶዎች',
      book_appointment: 'ቀጠሮ ያዙ',
      select_service: 'አገልግሎት ይምረጡ',
      no_preference: 'ምርጫ የለኝም',
      team_member: 'የቡድን አባል',
      date: 'ቀን',
      available_times: 'ሊኬዱ የሚችሉ ሰዓቶች',
      note_optional: 'ማስታወሻ (አማራጭ)',
      sign_in_to_book: 'ለመያዝ ይግቡ',
      booking_requested: 'ቀጠሮ ተጠይቋል!',
      booking_confirmed_soon: 'ንግዱ በቅርቡ ያረጋግጣል።',
      no_services: 'ምንም አገልግሎት አልተዘረዘረም',
      no_portfolio: 'ምንም የፖርትፎሊዮ ፎቶዎች የሉም',
      get_in_touch: 'ያነጋግሩ',
      reach_out: 'ቀጥታ ከዚህ ንግድ ጋር ያነጋግሩ',
      leave_review: 'ግምገማ ይስጡ',
      sign_in_to_review: 'ለመገምገም ይግቡ',
      submit_review: 'ግምገማ ያስገቡ',
      your_review: 'የእርስዎ ግምገማ',
      share_experience: 'ተሞክሮዎን ያጋሩ...',
      closed: 'ተዘግቷል',
      not_set: 'አልተቀናበረም',
      browse_businesses: 'ንግዶችን ያስሱ',
    },
  },
  ti: {
    nav: { home: 'መእተዊ', browse: 'ድለ', login: 'እቶ', register: 'ተመዝገብ', listBusiness: 'ንግድኻ ኣስተዋውቕ', signUp: 'ተመዝገብ', signOut: 'ውጻእ', dashboard: 'መቆጻጸሪ' },
    home: {
      badge: '🇨🇦 ኣብ ካናዳ ናይ ሓበሻ ማሕበረሰብ',
      hero_title: 'ናይ ሓበሻ ንግዳዊ ትካላት ድለ',
      hero_title2: 'ኣብ ምሉእ ካናዳ',
      hero_subtitle: 'ቆጸራ ሓዝ፣ አገልግሎታት ድለ፣ ምስ ማሕበረሰብካ ተራኸብ።',
      search_placeholder: 'ንግዳዊ ትካላት ድለ...',
      search_btn: 'ድለ',
      browse_by_category: 'ብምድብ ድለ',
      footer: '© 2025 ሜዳ። ንናይ ሓበሻ ማሕበረሰብ ኣብ ካናዳ ዝተሰርሐ።',
    },
    browse: {
      title: 'ናይ ሓበሻ ንግዳዊ ትካላት ድለ',
      search_placeholder: 'ንግዳዊ ትካላት ድለ...',
      all: 'ኩሎም',
      no_businesses: 'ዝኾነ ንግዲ ኣይተረኽበን',
      no_businesses_sub: 'ምድላይካ ወይ ማጣሪያካ ኣስተካክል',
      businesses_found: 'ንግዳዊ ትካላት ተረኺቦም',
      featured_first: 'ዝተመረጹ ቀዳሞት',
      top_rated: 'ላዕለዎት ደረጃ',
      most_reviewed: 'ብዙሕ ዝተገምገሙ',
      all_cities: 'ኩለን ከተማታት',
      clear: 'ጽረግ',
      view_profile: 'ፕሮፋይል ርኣይ',
      filter: 'ኣጣሪ',
    },
    business: {
      book_now: '📅 ሕጂ ሓዝ',
      call_now: '📞 ሕጂ ደውል',
      contact: '💬 ተራኸብ',
      save: '♡ ዕቀብ',
      saved: '♥ ተዓቂቡ',
      call: '📞 ደውል',
      no_reviews: 'ዝኾነ ግምገማ የለን',
      new_listing: 'ሓዲሽ',
      verified: '✓ ዝተረጋገጸ',
      services: 'አገልግሎታት',
      employees: 'ሰራሕተኛታት',
      reviews: 'ግምገማታት',
      hours: 'ናይ ስራሕ ሰዓታት',
      posts: '📸 ፎቶታት',
      book_appointment: 'ቆጸራ ሓዝ',
      select_service: 'አገልግሎት ምረጽ',
      no_preference: 'ምርጫ የብለይን',
      team_member: 'ናይ ጉጅለ ኣባል',
      date: 'ዕለት',
      available_times: 'ዝርከቡ ሰዓታት',
      note_optional: 'ሓሳብ (ምርጫ)',
      sign_in_to_book: 'ንምሓዝ እቶ',
      booking_requested: 'ቆጸራ ተሓቲቱ!',
      booking_confirmed_soon: 'ንግዲ ብቕልጡፍ ከረጋግጽ እዩ።',
      no_services: 'ዝኾነ አገልግሎት ኣይተዘርዘረን',
      no_portfolio: 'ዝኾነ ናይ ፖርትፎሊዮ ፎቶ የለን',
      get_in_touch: 'ተራኸብ',
      reach_out: 'ቀጥታ ምስዚ ንግዲ ተራኸብ',
      leave_review: 'ግምገማ ሃብ',
      sign_in_to_review: 'ንምግምጋም እቶ',
      submit_review: 'ግምገማ ኣቕርብ',
      your_review: 'ናትካ ግምገማ',
      share_experience: 'ተሞክሮኻ ካፍል...',
      closed: 'ተዓጺዩ',
      not_set: 'ኣይተቐናብረን',
      browse_businesses: 'ንግዳዊ ትካላት ድለ',
    },
  },
  ar: {
    nav: { home: 'الرئيسية', browse: 'تصفح', login: 'تسجيل الدخول', register: 'إنشاء حساب', listBusiness: 'أضف نشاطك التجاري', signUp: 'إنشاء حساب', signOut: 'تسجيل الخروج', dashboard: 'لوحة التحكم' },
    home: {
      badge: '🇨🇦 مجتمع الحبشة في كندا',
      hero_title: 'اعثر على الأعمال الحبشية',
      hero_title2: 'في جميع أنحاء كندا',
      hero_subtitle: 'احجز المواعيد وتصفح الخدمات وتواصل مع مجتمعك، كل ذلك في مكان واحد.',
      search_placeholder: 'ابحث عن الأعمال...',
      search_btn: 'بحث',
      browse_by_category: 'تصفح حسب الفئة',
      footer: '© 2025 ميدا. مبني لمجتمع الحبشة في كندا.',
    },
    browse: {
      title: 'تصفح أعمال الحبشة',
      search_placeholder: 'ابحث عن الأعمال...',
      all: 'الكل',
      no_businesses: 'لم يتم العثور على أعمال',
      no_businesses_sub: 'حاول تعديل بحثك أو الفلاتر',
      businesses_found: 'أعمال وجدت',
      featured_first: 'المميزة أولاً',
      top_rated: 'الأعلى تقييماً',
      most_reviewed: 'الأكثر مراجعة',
      all_cities: 'جميع المدن',
      clear: 'مسح',
      view_profile: 'عرض الملف',
      filter: 'تصفية',
    },
    business: {
      book_now: '📅 احجز الآن',
      call_now: '📞 اتصل الآن',
      contact: '💬 تواصل',
      save: '♡ حفظ',
      saved: '♥ محفوظ',
      call: '📞 اتصل',
      no_reviews: 'لا توجد مراجعات بعد',
      new_listing: 'جديد',
      verified: '✓ موثق',
      services: 'الخدمات',
      employees: 'الموظفون',
      reviews: 'المراجعات',
      hours: 'ساعات العمل',
      posts: '📸 المنشورات',
      book_appointment: 'حجز موعد',
      select_service: 'اختر خدمة',
      no_preference: 'لا تفضيل',
      team_member: 'فرد الفريق',
      date: 'التاريخ',
      available_times: 'الأوقات المتاحة',
      note_optional: 'ملاحظة (اختياري)',
      sign_in_to_book: 'سجل الدخول للحجز',
      booking_requested: 'تم طلب الحجز!',
      booking_confirmed_soon: 'سيقوم العمل بالتأكيد قريباً.',
      no_services: 'لا توجد خدمات مدرجة بعد',
      no_portfolio: 'لا توجد صور معرض بعد',
      get_in_touch: 'تواصل معنا',
      reach_out: 'تواصل مع هذا العمل مباشرة',
      leave_review: 'اترك مراجعة',
      sign_in_to_review: 'سجل الدخول للمراجعة',
      submit_review: 'إرسال المراجعة',
      your_review: 'مراجعتك',
      share_experience: 'شارك تجربتك...',
      closed: 'مغلق',
      not_set: 'غير محدد',
      browse_businesses: 'تصفح الأعمال',
    },
  },
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Read initial value from localStorage
    const saved = localStorage.getItem('meda-language') as Language
    if (saved && ['en', 'am', 'ti', 'ar'].includes(saved)) {
      setLanguageState(saved)
    }

    // Listen for language changes from other components
    const handleChange = () => {
      const updated = localStorage.getItem('meda-language') as Language
      if (updated && ['en', 'am', 'ti', 'ar'].includes(updated)) {
        setLanguageState(updated)
      }
    }

    window.addEventListener('meda-language-change', handleChange)
    return () => window.removeEventListener('meda-language-change', handleChange)
  }, [])

  const setLanguage = (lang: Language) => {
    localStorage.setItem('meda-language', lang)
    setLanguageState(lang)
    // Broadcast to all other components using useLanguage
    window.dispatchEvent(new Event('meda-language-change'))
  }

  const t = translations[language]
  const isRTL = language === 'ar'

  return { language, setLanguage, t, isRTL }
}

export { translations }