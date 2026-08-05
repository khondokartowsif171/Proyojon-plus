/**
 * Proyojon Plus — Admin Permission Constants
 * Sub Admin system এ প্রতিটি section এর জন্য আলাদা permission
 */

export const PERMISSIONS = {
  // ── Overview ──────────────────────────────────
  VIEW_OVERVIEW:        'view_overview',

  // ── Member Management ─────────────────────────
  VIEW_MEMBERS:         'view_members',
  EDIT_MEMBERS:         'edit_members',
  LOCK_MEMBERS:         'lock_members',
  DELETE_MEMBERS:       'delete_members',
  GIFT_BONUS:           'gift_bonus',
  SET_DEALER:           'set_dealer',

  // ── Network ───────────────────────────────────
  VIEW_NETWORK:         'view_network',

  // ── Products & Categories ─────────────────────
  VIEW_CATEGORIES:      'view_categories',
  MANAGE_CATEGORIES:    'manage_categories',
  VIEW_PRODUCTS:        'view_products',
  MANAGE_PRODUCTS:      'manage_products',

  // ── Content ───────────────────────────────────
  VIEW_GALLERY:         'view_gallery',
  MANAGE_GALLERY:       'manage_gallery',
  VIEW_NOTICES:         'view_notices',
  MANAGE_NOTICES:       'manage_notices',

  // ── Financial ─────────────────────────────────
  VIEW_PAYMENTS:        'view_payments',
  APPROVE_PAYMENTS:     'approve_payments',
  VIEW_WITHDRAWALS:     'view_withdrawals',
  APPROVE_WITHDRAWALS:  'approve_withdrawals',
  MANUAL_CREDIT:        'manual_credit',
  DISTRIBUTE_CLUBS:     'distribute_clubs',
  VIEW_TRANSACTIONS:    'view_transactions',

  // ── Gold & Packages ───────────────────────────
  VIEW_GOLD_PACKAGES:   'view_gold_packages',
  MANAGE_GOLD_PACKAGES: 'manage_gold_packages',

  // ── Orders & Dealer ───────────────────────────
  VIEW_ORDERS:          'view_orders',
  MANAGE_ORDERS:        'manage_orders',
  VIEW_DEALER_REQ:      'view_dealer_req',
  APPROVE_DEALER_REQ:   'approve_dealer_req',

  // ── System ────────────────────────────────────
  VIEW_REPORTS:         'view_reports',
  RUN_DAILY_CRON:       'run_daily_cron',
  MANAGE_SUB_ADMINS:    'manage_sub_admins',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Bengali labels for permission UI
export const PERM_LABELS: Record<string, string> = {
  view_overview:        'ওভারভিউ দেখুন',
  view_members:         'সদস্য তালিকা দেখুন',
  edit_members:         'সদস্য সম্পাদনা করুন',
  lock_members:         'সদস্য লক/আনলক করুন',
  delete_members:       'সদস্য মুছুন',
  gift_bonus:           'গিফট বোনাস প্রদান',
  set_dealer:           'ডিলার নির্ধারণ করুন',
  view_network:         'নেটওয়ার্ক টেবিল দেখুন',
  view_categories:      'ক্যাটাগরি দেখুন',
  manage_categories:    'ক্যাটাগরি যোগ/মুছুন',
  view_products:        'পণ্য দেখুন',
  manage_products:      'পণ্য যোগ/সম্পাদনা/মুছুন',
  view_gallery:         'গ্যালারি দেখুন',
  manage_gallery:       'গ্যালারি আপলোড/মুছুন',
  view_notices:         'নোটিশ দেখুন',
  manage_notices:       'নোটিশ প্রকাশ/মুছুন',
  view_payments:        'পেমেন্ট তালিকা দেখুন',
  approve_payments:     'পেমেন্ট অনুমোদন/বাতিল',
  view_withdrawals:     'উইথড্রো তালিকা দেখুন',
  approve_withdrawals:  'উইথড্রো অনুমোদন/বাতিল',
  manual_credit:        'ম্যানুয়াল ব্যালেন্স ক্রেডিট',
  distribute_clubs:     'ক্লাব পুল বন্টন',
  view_transactions:    'লেনদেন দেখুন',
  view_gold_packages:   'গোল্ড প্যাকেজ দেখুন',
  manage_gold_packages: 'গোল্ড প্যাকেজ সম্পাদনা',
  view_orders:          'অর্ডার দেখুন',
  manage_orders:        'অর্ডার ম্যানেজ করুন',
  view_dealer_req:      'ডিলার রিকুইজিশন দেখুন',
  approve_dealer_req:   'ডিলার রিকুইজিশন অনুমোদন',
  view_reports:         'রিপোর্ট দেখুন',
  run_daily_cron:       'দৈনিক কাজ চালান',
  manage_sub_admins:    'সাব এডমিন ম্যানেজ করুন',
};

// Grouped permissions for checkbox UI in Sub Admin edit modal
export const PERMISSION_GROUPS: { label: string; perms: string[] }[] = [
  {
    label: 'ওভারভিউ',
    perms: ['view_overview'],
  },
  {
    label: 'মেম্বার ম্যানেজমেন্ট',
    perms: ['view_members', 'edit_members', 'lock_members', 'delete_members', 'gift_bonus', 'set_dealer'],
  },
  {
    label: 'নেটওয়ার্ক',
    perms: ['view_network'],
  },
  {
    label: 'পণ্য ও ক্যাটাগরি',
    perms: ['view_categories', 'manage_categories', 'view_products', 'manage_products'],
  },
  {
    label: 'গ্যালারি ও নোটিশ',
    perms: ['view_gallery', 'manage_gallery', 'view_notices', 'manage_notices'],
  },
  {
    label: 'পেমেন্ট ও উইথড্রো',
    perms: ['view_payments', 'approve_payments', 'view_withdrawals', 'approve_withdrawals', 'manual_credit'],
  },
  {
    label: 'ক্লাব ও লেনদেন',
    perms: ['distribute_clubs', 'view_transactions'],
  },
  {
    label: 'গোল্ড প্যাকেজ',
    perms: ['view_gold_packages', 'manage_gold_packages'],
  },
  {
    label: 'অর্ডার ও ডিলার রিকুইজিশন',
    perms: ['view_orders', 'manage_orders', 'view_dealer_req', 'approve_dealer_req'],
  },
  {
    label: 'সিস্টেম',
    perms: ['view_reports', 'run_daily_cron', 'manage_sub_admins'],
  },
];
