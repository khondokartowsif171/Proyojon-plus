import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'bn' | 'en';

const strings = {
  bn: {
    // Nav
    home: 'হোম', shop: 'শপ', packages: 'প্যাকেজ', login: 'লগইন', register: 'রেজিস্ট্রেশন',
    dashboard: 'ড্যাশবোর্ড', logout: 'লগআউট', balance: 'ব্যালেন্স',
    gallery: 'গ্যালারি', about: 'আমাদের পরিচয়', adminDashboard: 'এডমিন ড্যাশবোর্ড', subAdmin: 'সাব এডমিন',
    // Tabs
    overview: 'ওভারভিউ', income: 'ইনকাম', generations: 'টিম লেভেল', clubs: 'ক্লাব',
    pkgTab: 'প্যাকেজ', withdraw: 'উইথড্রো', transfer: 'ট্রান্সফার', history: 'ইতিহাস', profile: 'প্রোফাইল',
    // Overview
    myId: 'আমার আইডি তথ্য', name: 'নাম', email: 'ইমেইল', phone: 'ফোন',
    package: 'প্যাকেজ', status: 'স্ট্যাটাস', active: '✓ সক্রিয়', inactive: '✗ নিষ্ক্রিয়',
    monthlyPv: 'মাসিক PV', expiry: 'মেয়াদ', daysLeft: 'দিন বাকি',
    goldReferIncome: 'গোল্ড রেফার ইনকাম', goldPending: 'গোল্ড পেন্ডিং', bakeya: 'বকেয়া',
    incomeSummary: 'ইনকাম সারসংক্ষেপ', referIncome: 'রেফার ইনকাম', genBonus: 'জেনারেশন বোনাস',
    clubBonus: 'ক্লাব বোনাস', goldDaily: 'গোল্ড দৈনিক', referralLink: 'আপনার রেফারেল লিংক',
    copyLink: 'রেফার লিংক', copied: 'কপি হয়েছে!',
    // Stats
    currentBalance: 'কারেন্ট ব্যালেন্স', totalIncome: 'মোট ইনকাম',
    directRefer: 'ডিরেক্ট রেফার', pvPoints: 'PV পয়েন্ট', spPoints: 'SP পয়েন্ট', gpPoints: 'GP পয়েন্ট',
    // Pending payments
    pendingPayments: 'পেন্ডিং পেমেন্ট', paymentPending: 'অপেক্ষমান অনুমোদন', paymentApproved: 'অনুমোদিত', paymentRejected: 'প্রত্যাখ্যাত',
    // Renewal
    renewalTitle: 'এই মাসের নবায়ন', renewalNote: 'মেয়াদ শেষ হওয়ার আগেই ১০০ PV কিনুন',
    goShop: 'শপে যান →',
    // Clubs
    clubTitle: 'ক্লাব সদস্যপদ', member: 'সদস্য ✓', notMember: 'সদস্য নয়', pool: 'পুল',
    weeklyProgress: 'সেলারী ক্লাব অগ্রগতি', weeklyTarget: '১৫ জন সক্রিয় Customer দরকার',
    insuranceProgress: 'ইনসুরেন্স/পেনশন অগ্রগতি', insuranceTarget: '১৫ জন Weekly Club সদস্য দরকার',
    yourDirects: 'আপনার ডিরেক্ট সক্রিয় Customer',
    weeklyDirects: 'Weekly Club সদস্য (ডিরেক্ট)',
    clubNote: 'প্রতিটি পুলের টাকা এডমিন থেকে সমান হারে সব সক্রিয় সদস্যদের মধ্যে বন্টন করা হয়।',
    clubNote2: 'নিষ্ক্রিয় আইডিতে কোনো ক্লাব বোনাস যাবে না।',
    // Income tab
    incomeDetails: 'ইনকাম বিবরণ',
    // Generations
    genTable: 'টিম লেভেল', genNote: '📌 জেনারেশন বোনাস শুধু Customer package এর PV sales এ — প্রতি লেভেলে PV এর ১% (লেভেল ১–৫)। শুধু সক্রিয় আইডিতে বোনাস যায়।',
    noReferrals: 'এখনো কোনো রেফারেল নেই', copyRefLink: 'রেফারেল লিংক কপি করুন',
    genName: 'নাম', genPhone: 'ফোন', genPkg: 'প্যাকেজ', genPv: 'PV পয়েন্ট', genStatus: 'স্ট্যাটাস',
    customerPkg: 'কাস্টমার', shareholderPkg: 'শেয়ারহোল্ডার', goldPkg: 'গোল্ড',
    // Withdraw
    withdrawTitle: 'উইথড্রো', availableBalance: 'উপলব্ধ ব্যালেন্স', charge: 'চার্জ', minAmount: 'সর্বনিম্ন',
    accountNum: 'একাউন্ট নম্বর', amount: 'পরিমাণ', withdrawAmount: 'উইথড্রো পরিমাণ', netAmount: 'নেট পরিমাণ',
    processing: 'প্রসেসিং...', doWithdraw: 'উইথড্রো করুন',
    bankDetails: 'ব্যাংক বিস্তারিত তথ্য', accHolder: 'একাউন্ট ধারকের নাম', bankName: 'ব্যাংকের নাম',
    routingNum: 'রাউটিং নম্বর', branchName: 'শাখার নাম',
    withdrawHistory: 'উইথড্রো ইতিহাস', pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত',
    // Transfer
    transferTitle: 'আইডি থেকে আইডি ট্রান্সফার', recipientId: 'প্রাপকের User ID', noCharge: 'কোনো চার্জ নেই',
    doTransfer: 'ট্রান্সফার করুন', transferWarning: '⚠️ সতর্কতা', transferNote: 'ট্রান্সফার সম্পূর্ণ অপরিবর্তনীয়।',
    transferHistory: 'ট্রান্সফার ইতিহাস', sent: 'পাঠানো', received: 'পাওয়া',
    // History
    historyTitle: 'লেনদেনের ইতিহাস', noTx: 'কোনো লেনদেন নেই', loading: 'লোড হচ্ছে...',
    // Profile
    profileTitle: 'প্রোফাইল সম্পাদনা', changePic: 'ছবি পরিবর্তন করুন', fullName: 'পুরো নাম',
    nidNum: 'জাতীয় পরিচয়পত্র নম্বর (NID)', nidFront: 'NID সামনের পিঠ (ছবি)', nidBack: 'NID পিছনের পিঠ (ছবি)',
    uploadFront: 'NID সামনের ছবি আপলোড করুন', uploadBack: 'NID পিছনের ছবি আপলোড করুন',
    saveProfile: '✓ প্রোফাইল সংরক্ষণ করুন', saving: 'সংরক্ষণ হচ্ছে...',
    nidNote: '📌 NID ছবি যাচাইয়ের জন্য এডমিন দেখতে পারবেন। ছবি পরিষ্কার ও পাঠযোগ্য রাখুন।',
    // Package tab
    buyPackage: 'প্যাকেজ কিনুন', buyPackageNote: 'একই আইডি থেকে একাধিক প্যাকেজ কেনা যাবে — প্রতিটি আলাদা ইনকাম স্ট্রিম।',
    quantity: 'পরিমাণ (কতটি প্যাকেজ?)', payMethod: 'পেমেন্ট পদ্ধতি', submitRequest: 'অনুরোধ জমা দিন',
    current: 'বর্তমান', activePackages: 'সক্রিয় গোল্ড প্যাকেজ সমূহ', purchased: 'কেনা',
    // Gold countdown
    goldCountdown: 'গোল্ড প্যাকেজ কাউন্টডাউন', days: 'দিন', hours: 'ঘণ্টা', minutes: 'মিনিট', seconds: 'সেকেন্ড',
  },
  en: {
    home: 'Home', shop: 'Shop', packages: 'Packages', login: 'Login', register: 'Register',
    dashboard: 'Dashboard', logout: 'Logout', balance: 'Balance',
    gallery: 'Gallery', about: 'About Us', adminDashboard: 'Admin Dashboard', subAdmin: 'Sub Admin',
    overview: 'Overview', income: 'Income', generations: 'Team Level', clubs: 'Clubs',
    pkgTab: 'Packages', withdraw: 'Withdraw', transfer: 'Transfer', history: 'History', profile: 'Profile',
    myId: 'My Account Info', name: 'Name', email: 'Email', phone: 'Phone',
    package: 'Package', status: 'Status', active: '✓ Active', inactive: '✗ Inactive',
    monthlyPv: 'Monthly PV', expiry: 'Expiry', daysLeft: 'days left',
    goldReferIncome: 'Gold Referral Income', goldPending: 'Gold Pending', bakeya: 'Due Balance',
    incomeSummary: 'Income Summary', referIncome: 'Referral Income', genBonus: 'Generation Bonus',
    clubBonus: 'Club Bonus', goldDaily: 'Gold Daily', referralLink: 'Your Referral Link',
    copyLink: 'Copy Link', copied: 'Copied!',
    currentBalance: 'Current Balance', totalIncome: 'Total Income',
    directRefer: 'Direct Referrals', pvPoints: 'PV Points', spPoints: 'SP Points', gpPoints: 'GP Points',
    pendingPayments: 'Pending Payments', paymentPending: 'Awaiting Approval', paymentApproved: 'Approved', paymentRejected: 'Rejected',
    renewalTitle: 'This Month\'s Renewal', renewalNote: 'Buy 100 PV before your membership expires',
    goShop: 'Go to Shop →',
    clubTitle: 'Club Membership', member: 'Member ✓', notMember: 'Not a Member', pool: 'Pool',
    weeklyProgress: 'Weekly Club Progress', weeklyTarget: '15 active Customers required',
    insuranceProgress: 'Insurance/Pension Progress', insuranceTarget: '15 Weekly Club members required',
    yourDirects: 'Your Direct Active Customers',
    weeklyDirects: 'Weekly Club Members (Direct)',
    clubNote: 'Pool funds are distributed equally among all active members by admin.',
    clubNote2: 'Inactive accounts receive no club bonus.',
    incomeDetails: 'Income Details',
    genTable: 'Team Level', genNote: '📌 Generation bonus only on Customer package PV sales — 1% per level (Level 1–5). Only active IDs receive bonus.',
    noReferrals: 'No referrals yet', copyRefLink: 'Copy Referral Link',
    genName: 'Name', genPhone: 'Phone', genPkg: 'Package', genPv: 'PV Points', genStatus: 'Status',
    customerPkg: 'Customer', shareholderPkg: 'Shareholder', goldPkg: 'Gold',
    withdrawTitle: 'Withdraw', availableBalance: 'Available Balance', charge: 'Charge', minAmount: 'Minimum',
    accountNum: 'Account Number', amount: 'Amount', withdrawAmount: 'Withdrawal Amount', netAmount: 'Net Amount',
    processing: 'Processing...', doWithdraw: 'Withdraw',
    bankDetails: 'Bank Details', accHolder: 'Account Holder Name', bankName: 'Bank Name',
    routingNum: 'Routing Number', branchName: 'Branch Name',
    withdrawHistory: 'Withdrawal History', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
    transferTitle: 'ID-to-ID Transfer', recipientId: 'Recipient User ID', noCharge: 'No charge',
    doTransfer: 'Transfer', transferWarning: '⚠️ Warning', transferNote: 'Transfers are irreversible.',
    transferHistory: 'Transfer History', sent: 'Sent', received: 'Received',
    historyTitle: 'Transaction History', noTx: 'No transactions', loading: 'Loading...',
    profileTitle: 'Edit Profile', changePic: 'Change Photo', fullName: 'Full Name',
    nidNum: 'National ID Number (NID)', nidFront: 'NID Front Side', nidBack: 'NID Back Side',
    uploadFront: 'Upload NID front image', uploadBack: 'Upload NID back image',
    saveProfile: '✓ Save Profile', saving: 'Saving...',
    nidNote: '📌 NID images are visible to admin for verification. Keep images clear and readable.',
    buyPackage: 'Buy Package', buyPackageNote: 'You can buy multiple packages from the same ID — each is a separate income stream.',
    quantity: 'Quantity (how many packages?)', payMethod: 'Payment Method', submitRequest: 'Submit Request',
    current: 'Current', activePackages: 'Active Gold Packages', purchased: 'Purchased',
    goldCountdown: 'Gold Package Countdown', days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
  },
};

type StringKey = keyof typeof strings.bn;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}

const LanguageContext = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('lang') as Lang) || 'bn'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (k: StringKey): string => strings[lang][k] as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be inside LanguageProvider');
  return ctx;
}
