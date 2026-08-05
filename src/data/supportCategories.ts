import { ROUTES } from '../constants/routes';

export interface SupportIssue {
  id: string;
  title: string;
  solution: string;
  actionRoute?: string;
  actionText?: string;
}

export interface SupportCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  issues: SupportIssue[];
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    id: 'documents',
    title: 'Document Verification',
    icon: '📄',
    description: 'Rejection details, pending review status, and photo upload assistance.',
    issues: [
      {
        id: 'doc_rejected',
        title: 'My document was rejected',
        solution: 'Admin has reviewed your submitted photo and provided specific feedback. Go to the Documents screen to check which specific document was rejected, read the rejection note, and re-upload a clear photo.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Go to My Documents',
      },
      {
        id: 'doc_pending',
        title: 'Documents are under review',
        solution: 'Document review is completed by the admin team within 1 to 24 hours. Once your documents are verified, your overall status becomes Approved and map navigation will automatically unlock.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Check Documents Status',
      },
      {
        id: 'doc_upload_error',
        title: 'Unable to upload documents',
        solution: 'Ensure Camera and Storage permissions are allowed for DriverApp in your phone Settings. Make sure image files are clear, well-lit, and in JPG or PNG format.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Try Uploading Again',
      },
    ],
  },
  {
    id: 'trips',
    title: 'Trips & Orders',
    icon: '🚗',
    description: 'Trip requests, starting orders, completing deliveries, and cancellations.',
    issues: [
      {
        id: 'no_requests',
        title: 'Not receiving trip requests',
        solution: 'Check that your Online toggle is ON on the home screen, GPS location services are set to High Accuracy, and your driver profile is approved by Admin.',
        actionRoute: ROUTES.HOME,
        actionText: 'Go to Home Screen',
      },
      {
        id: 'unable_start',
        title: 'Unable to start trip',
        solution: 'Make sure you are at the designated pickup location and have active cellular data signal. Pull down to refresh your trip order details screen.',
        actionRoute: ROUTES.MY_ORDERS,
        actionText: 'View My Orders',
      },
      {
        id: 'unable_complete',
        title: 'Unable to complete trip',
        solution: 'Verify that you have arrived at the dropoff destination and attached required delivery proof (OTP / photo). Tap refresh if connection drops.',
        actionRoute: ROUTES.MY_ORDERS,
        actionText: 'View Active Orders',
      },
      {
        id: 'customer_cancelled',
        title: 'Customer cancelled the trip',
        solution: 'If a customer cancels after you have dispatched, eligible cancellation fees are automatically calculated and added to your daily earnings balance.',
        actionRoute: ROUTES.EARNINGS,
        actionText: 'Check Earnings',
      },
    ],
  },
  {
    id: 'earnings',
    title: 'Earnings & Payments',
    icon: '💰',
    description: 'Weekly payouts, fare breakdowns, incentives, and bonus tracking.',
    issues: [
      {
        id: 'payout_delay',
        title: 'Payment not received',
        solution: 'Weekly driver payouts are initiated every Monday and credited within 24-48 bank working hours. Ensure your bank account or UPI details are verified.',
        actionRoute: ROUTES.EARNINGS,
        actionText: 'View Payout Summary',
      },
      {
        id: 'incorrect_fare',
        title: 'Incorrect earnings',
        solution: 'Trip fares combine base pickup fee, distance, duration, and active surge rates. Check the order summary for complete itemized breakdown.',
        actionRoute: ROUTES.EARNINGS,
        actionText: 'Check Fare Breakdown',
      },
      {
        id: 'missing_bonus',
        title: 'Incentive or bonus missing',
        solution: 'Incentives require reaching trip count targets within specified peak hours without high cancellation rates. Bonus status updates after midnight.',
        actionRoute: ROUTES.EARNINGS,
        actionText: 'View Incentives',
      },
    ],
  },
  {
    id: 'navigation',
    title: 'GPS & Navigation',
    icon: '📍',
    description: 'Location accuracy, map calibration, and turn-by-turn guidance.',
    issues: [
      {
        id: 'gps_not_working',
        title: 'GPS not working',
        solution: 'Open phone Settings -> Location -> DriverApp and select "Allow all the time" or "While using app" with Precise/High Accuracy location turned ON.',
        actionRoute: ROUTES.HOME,
        actionText: 'Check Map View',
      },
      {
        id: 'wrong_location',
        title: 'Wrong current location',
        solution: 'Toggle Airplane mode ON for 5 seconds and turn it OFF to reset cellular tower signals. Calibrate your device compass in Google Maps.',
        actionRoute: ROUTES.HOME,
        actionText: 'Recalibrate Map',
      },
      {
        id: 'navigation_glitch',
        title: 'Navigation issues',
        solution: 'Ensure Google Maps / preferred navigation app is installed and updated to the latest version from the Play Store.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: '👤',
    description: 'Login troubleshooting, password reset, profile edits, and account status.',
    issues: [
      {
        id: 'cannot_login',
        title: 'Unable to login',
        solution: 'Double-check your registered phone number/username and password. Use "Forgot Password?" to reset your account credentials using OTP.',
        actionRoute: ROUTES.LOGIN,
        actionText: 'Go to Login Screen',
      },
      {
        id: 'forgot_pass',
        title: 'Forgot password',
        solution: 'On the Login screen, tap "Forgot Password?" to receive a secure OTP code on your registered mobile number and create a new password.',
        actionRoute: ROUTES.LOGIN,
        actionText: 'Reset Password',
      },
      {
        id: 'update_prof',
        title: 'Update profile',
        solution: 'You can update your personal contact details, email address, and vehicle specifications anytime from your Profile screen.',
        actionRoute: ROUTES.MY_PROFILE,
        actionText: 'Edit Profile',
      },
      {
        id: 'acc_blocked',
        title: 'Account blocked',
        solution: 'If your account is restricted due to pending document verification or compliance safety policy, please contact dispatch support below.',
      },
    ],
  },
  {
    id: 'vehicle',
    title: 'Vehicle',
    icon: '🚙',
    description: 'Vehicle details update, RC upload, and insurance renewal.',
    issues: [
      {
        id: 'update_veh_details',
        title: 'Update vehicle details',
        solution: 'Update your vehicle brand, model, license plate number, and color directly from your Profile screen.',
        actionRoute: ROUTES.PROFILE,
        actionText: 'Update Vehicle Details',
      },
      {
        id: 'insurance_upd',
        title: 'Insurance update',
        solution: 'Upload a clear copy of your renewed vehicle insurance certificate under the Documents section for quick admin approval.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Upload Insurance',
      },
      {
        id: 'rc_upd',
        title: 'RC update',
        solution: 'Upload your updated Registration Certificate (RC) photo in the Documents section to keep your fleet profile active.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Upload RC Photo',
      },
    ],
  },
  {
    id: 'app_issues',
    title: 'App Issues',
    icon: '⚙️',
    description: 'Crash reports, performance optimization, and notification alerts.',
    issues: [
      {
        id: 'app_crash',
        title: 'App crashes',
        solution: 'Clear app cache by going to Android Settings -> Apps -> DriverApp -> Storage -> Clear Cache. Restart the app.',
      },
      {
        id: 'app_slow',
        title: 'App is slow',
        solution: 'Close unneeded background applications and ensure your phone has at least 1GB of free internal storage.',
      },
      {
        id: 'notif_issue',
        title: 'Notifications not working',
        solution: 'Enable notification permissions for DriverApp in phone settings. Turn off Battery Saver mode for seamless trip alerts.',
      },
    ],
  },
  {
    id: 'faqs',
    title: 'FAQs',
    icon: '❓',
    description: 'Frequently asked questions and driver guide tips.',
    issues: [
      {
        id: 'faq_approval',
        title: 'How do I get approved faster?',
        solution: 'Ensure all 7 required documents (Selfie, Aadhaar Front/Back, DL Front/Back, RC, Insurance) are uploaded with clear, uncropped, non-blurry photos.',
        actionRoute: ROUTES.DOCUMENTS,
        actionText: 'Review Documents',
      },
      {
        id: 'faq_hours',
        title: 'What are the peak delivery hours?',
        solution: 'Peak demand hours are typically Lunch (12:00 PM - 3:30 PM) and Dinner (7:00 PM - 11:30 PM) with maximum order requests.',
      },
      {
        id: 'faq_contact_customer',
        title: 'How do I contact the customer?',
        solution: 'Open your active order details screen and tap the "Call Customer" or "Message" button to connect via masked caller proxy.',
      },
      {
        id: 'faq_fare_calc',
        title: 'How are trip fares calculated?',
        solution: 'Fares are calculated using base pickup rate + distance travelled + wait duration + active demand surge bonuses.',
      },
    ],
  },
];
