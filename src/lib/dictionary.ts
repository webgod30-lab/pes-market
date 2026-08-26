import type { Locale } from "@/lib/locale";

/**
 * The site's chrome, in both languages.
 *
 * Deliberately scoped to the shell — navigation, buttons, the footer, the words
 * that appear on every page. Long-form pages (the terms, the FAQ, how-it-works)
 * are still English, and translating those is a writing job rather than a
 * plumbing one: they carry the legal and safety wording, and a half-accurate
 * Arabic version of "escrow protects you from the other person, not from the
 * publisher" is worse than an English one a reader can look up.
 *
 * Flat keys, not nested objects. A nested tree reads nicely and then someone
 * adds `nav.deals.label` next to `nav.deals` and TypeScript cannot tell you the
 * shapes diverged. A flat record typed against the English keys means Arabic
 * cannot be missing one.
 */
const en = {
  // --- navigation ---
  "nav.main": "Main",
  "nav.howItWorks": "How it works",
  "nav.resources": "Resources",
  "nav.reviews": "Reviews",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.deals": "Deals",
  "nav.console": "Console",
  "nav.yourDeals": "Your deals",
  "nav.openDeal": "Open a deal",
  "nav.joinCode": "Join with a code",
  "nav.adminConsole": "Admin console",
  "nav.tradeHistory": "Trade history",
  "nav.notifications": "Notifications",
  "nav.balance": "Your balance",
  "nav.referrals": "Promote & earn",
  "nav.promote": "Become a promoter",
  "nav.desc.howItWorks": "The six steps, and when the accounts actually change hands",
  "nav.desc.reviews": "Every review, from both sides of a completed deal",
  "nav.desc.faq": "Payouts, disputes, and the awkward questions",
  "nav.desc.promote": "Earn $2 a swap — the way in if you know nobody here",
  "nav.desc.contact": "Ask before you send anything",
  "nav.desc.referrals": "Your code, and what it has earned",
  "nav.desc.balance": "Take your earnings out",
  "nav.desc.adminConsole": "Deals, disputes, withdrawals and users",
  "nav.desc.joinCode": "Someone sent you an invite",
  "nav.desc.yourDeals": "Everything you have open right now",
  "nav.desc.openDeal": "Record the terms and get an invite code",
  "nav.security": "Security",
  "nav.overview": "Overview",
  "nav.learn": "Learn",
  "nav.account": "Account",
  "nav.money": "Money",
  "nav.queues": "Queues",
  "nav.settings": "Settings",

  // --- account ---
  "account.signIn": "Sign in",
  "account.signOut": "Sign out",
  "account.startDeal": "Start a deal",
  "account.menu": "Account menu",

  // --- language ---
  "lang.label": "Language",
  "lang.change": "Change language",

  // --- footer ---
  "footer.service": "Service",
  "footer.help": "Help",
  "footer.legal": "Legal",
  "footer.terms": "Terms of service",
  "footer.privacy": "Privacy policy",
  "footer.createAccount": "Create an account",
  // The prose blocks. These are on every page, so leaving them English made
  // an otherwise Arabic page look like a translation that had run out.
  "footer.brand": "Trusted third party for game account trades",
  "footer.tagline":
    "We hold both accounts until both have been checked — so neither of you has to go first, and neither of you is the one taking the risk.",
  "footer.encrypted": "AES-256-GCM encrypted at rest",
  "footer.noSaleBold": "We do not sell accounts.",
  "footer.noSaleBody":
    "Nothing is listed or advertised here. Buyers and sellers agree their own deals elsewhere and use this service to complete them safely.",
  "footer.publisherLead":
    "Game publishers generally prohibit selling or transferring accounts, and can suspend a traded account. Escrow protects you from the other person in the trade — not from the publisher. See the",
  "footer.publisherLink": "terms",
  "footer.publisherTail": "before you trade.",
  "footer.notAffiliated":
    "Not affiliated with, endorsed by, or connected to Konami, eFootball, PES, or any game publisher.",
  "footer.termsShort": "Terms",
  "footer.privacyShort": "Privacy",

  // --- menus ---
  "menu.open": "Open menu",
  "menu.close": "Close menu",
  "menu.site": "Site menu",

  // --- opening a deal ---
  // Every deal is a swap, so there is no longer a kind to choose. What remains
  // is which of the two accounts is yours, which is what the side cards ask.
  "deal.side.legend": "Which account is yours",
  "deal.side.seller": "The one I am putting up",
  "deal.side.sellerDetail":
    "You describe your account first. The other person joins to put theirs up against it.",
  "deal.side.buyer": "The one coming back",
  "deal.side.buyerDetail":
    "The account you want is described first, and yours is the one you offer for it.",

  "deal.summary.swapLabel": "The account you are putting up",
  "deal.summary.hint":
    "Be specific. This is what the admin checks the account against before releasing it.",
  "deal.counter.label": "The account coming back to you",
  "deal.counter.hint":
    "The account coming the other way. Checked the same way as yours before anything is released.",

  "deal.account.game": "Game",
  "deal.account.platform": "Platform",
  "deal.account.level": "Level",
  "deal.account.allOptional": "The rest is optional, but the more you fill in the less there is to argue about later.",
  "deal.account.description": "Description",
  "deal.account.strength": "Team strength",
  "deal.account.epics": "Epics",
  "deal.account.epicPlayers": "Which epics",
  "deal.strength.hint": "Squad rating, e.g. 3280",
  "deal.epics.hint": "How many",
  "deal.epicPlayers.hint": "Names, separated by commas",
  // {n} is the bar itself, so the number is never written twice.
  "deal.strength.note":
    "Both squad ratings have to be above {n} for the finished swap to pay the two promoters $2 each. Leave either box empty and it pays nobody — an unrecorded rating cannot be checked. It changes nothing about the swap itself: any two accounts are escrowed the same way, free.",

  "deal.submit": "Create swap and get invite code",
  "deal.submitting": "Creating swap…",
  "deal.submitNote": "Nothing is shared yet. You will get a code to send to the other person.",

  // --- swaps, on the deal page ---
  "swap.protection.title": "How a swap is protected",
  "swap.protection.body":
    "There is no money to hold, so the protection is timing: both accounts are deposited with us first, both are checked, and both are handed over at the same moment. Neither of you can take one and walk away.",
  "swap.protection.fee": "No fee — there is nothing to take a percentage of.",

  "swap.sellerAccount": "The seller's account",
  "swap.buyerAccount": "The buyer's account",
  "swap.notDescribed": "Not described.",
  "swap.noMoney":
    "No money changes hands. Both accounts are held and released together, so neither side can take one and walk away. No fee.",

  "swap.deposit.yourTurn": "Your turn: hand over your account",
  "swap.released.title": "Both accounts released",
  "swap.released.body":
    "Log in, change the email and password straight away, then confirm below. The swap is not finished until both of you have.",
  "swap.reveal": "Show the account you received",
  "swap.reveal.note": "Shown only when you ask, so they are not left sitting on screen.",

  // --- the progress timeline ---
  "step.opened": "Deal opened",
  "step.joined": "Both parties in",
  "step.deposited": "Account deposited",
  "step.held": "Payment held",
  "step.released": "Credentials released",
  "step.paid": "Seller paid",
  "step.bothDeposited": "Both accounts deposited",
  "step.checked": "Accounts checked",
  "step.swapped": "Accounts swapped",
} as const;

export type MessageKey = keyof typeof en;

/**
 * Arabic. Modern Standard, not Darija — it reads correctly to any Arabic
 * speaker, where Darija would only serve Morocco and looks wrong written down
 * to everyone else.
 */
const ar: Record<MessageKey, string> = {
  "nav.main": "الرئيسية",
  "nav.howItWorks": "كيف تعمل الخدمة",
  "nav.resources": "موارد",
  "nav.reviews": "التقييمات",
  "nav.faq": "الأسئلة الشائعة",
  "nav.contact": "اتصل بنا",
  "nav.deals": "الصفقات",
  "nav.console": "لوحة التحكم",
  "nav.yourDeals": "صفقاتك",
  "nav.openDeal": "افتح صفقة",
  "nav.joinCode": "انضم برمز الدعوة",
  "nav.adminConsole": "لوحة الإدارة",
  "nav.tradeHistory": "سجل الصفقات",
  "nav.notifications": "الإشعارات",
  "nav.balance": "رصيدك",
  "nav.referrals": "ادعُ واربح",
  "nav.promote": "كن داعيًا",
  "nav.desc.howItWorks": "الخطوات الست، ومتى تنتقل الحسابات فعلًا",
  "nav.desc.reviews": "كل تقييم، من طرفي صفقة مكتملة",
  "nav.desc.faq": "الدفعات والنزاعات والأسئلة المحرجة",
  "nav.desc.promote": "اربح ٢ دولار عن كل مبادلة — وهذا طريقك للدخول إن لم تعرف أحدًا هنا",
  "nav.desc.contact": "اسأل قبل أن ترسل أي شيء",
  "nav.desc.referrals": "رمزك، وما ربّحه لك",
  "nav.desc.balance": "اسحب أرباحك",
  "nav.desc.adminConsole": "الصفقات والنزاعات والسحوبات والمستخدمون",
  "nav.desc.joinCode": "أحدهم أرسل لك دعوة",
  "nav.desc.yourDeals": "كل ما هو مفتوح لديك الآن",
  "nav.desc.openDeal": "سجّل الشروط واحصل على رمز دعوة",
  "nav.security": "الأمان",
  "nav.overview": "نظرة عامة",
  "nav.learn": "تعرّف على الخدمة",
  "nav.account": "الحساب",
  "nav.money": "المال",
  "nav.queues": "قوائم الانتظار",
  "nav.settings": "الإعدادات",

  "account.signIn": "تسجيل الدخول",
  "account.signOut": "تسجيل الخروج",
  "account.startDeal": "ابدأ صفقة",
  "account.menu": "قائمة الحساب",

  "lang.label": "اللغة",
  "lang.change": "تغيير اللغة",

  "footer.service": "الخدمة",
  "footer.help": "المساعدة",
  "footer.legal": "قانوني",
  "footer.terms": "شروط الخدمة",
  "footer.privacy": "سياسة الخصوصية",
  "footer.createAccount": "إنشاء حساب",
  "footer.brand": "طرف ثالث موثوق لتبادل حسابات الألعاب",
  "footer.tagline":
    "نحتفظ بالحسابين حتى يُفحص كلاهما — فلا يضطر أحدكما أن يبدأ أولًا، ولا يكون أحدكما وحده من يتحمل المخاطرة.",
  "footer.encrypted": "مشفّرة بـ AES-256-GCM أثناء التخزين",
  "footer.noSaleBold": "نحن لا نبيع الحسابات.",
  "footer.noSaleBody":
    "لا شيء معروض أو مُعلن عنه هنا. المتبادلون يتفقون على صفقاتهم في مكان آخر، ويستخدمون هذه الخدمة لإتمامها بأمان.",
  "footer.publisherLead":
    "ناشرو الألعاب يمنعون عادةً بيع الحسابات أو نقلها، ويستطيعون تعليق حساب مُتداوَل. الضمان يحميك ممّن تتبادل معه — لا من الناشر. راجع",
  "footer.publisherLink": "الشروط",
  "footer.publisherTail": "قبل أن تتبادل.",
  "footer.notAffiliated":
    "غير تابعة لـ Konami أو eFootball أو PES أو أي ناشر ألعاب، ولا معتمدة منها ولا مرتبطة بها.",
  "footer.termsShort": "الشروط",
  "footer.privacyShort": "الخصوصية",

  "menu.open": "افتح القائمة",
  "menu.close": "أغلق القائمة",
  "menu.site": "قائمة الموقع",

  "deal.side.legend": "أي الحسابين حسابك",
  "deal.side.seller": "الحساب الذي أقدّمه",
  "deal.side.sellerDetail": "تصف حسابك أولًا، وينضم الطرف الآخر ليضع حسابه مقابله.",
  "deal.side.buyer": "الحساب الذي سأستلمه",
  "deal.side.buyerDetail": "يُوصف الحساب الذي تريده أولًا، وحسابك هو ما تقدّمه مقابله.",

  "deal.summary.swapLabel": "الحساب الذي تقدّمه أنت",
  "deal.summary.hint": "كن دقيقًا. هذا ما يقارن به المشرف الحساب قبل تسليمه.",
  "deal.counter.label": "الحساب الذي ستستلمه",
  "deal.counter.hint": "الحساب القادم في الاتجاه الآخر. يُفحص مثل حسابك تمامًا قبل تسليم أي شيء.",

  "deal.account.game": "اللعبة",
  "deal.account.platform": "المنصة",
  "deal.account.level": "المستوى",
  "deal.account.allOptional": "الباقي اختياري، لكن كلما ملأت أكثر قلّ ما يمكن الاختلاف عليه لاحقًا.",
  "deal.account.description": "الوصف",
  "deal.account.strength": "قوة الفريق",
  "deal.account.epics": "الإيبيك",
  "deal.account.epicPlayers": "أي لاعبي إيبيك",
  "deal.strength.hint": "تقييم التشكيلة، مثل 3280",
  "deal.epics.hint": "كم عددهم",
  "deal.epicPlayers.hint": "الأسماء، مفصولة بفواصل",
  "deal.strength.note":
    "يجب أن تكون قوة الفريقين أعلى من {n} حتى تدفع المبادلة المكتملة ٢ دولار لكل من الداعيين. اترك أي خانة فارغة ولن يُدفع لأحد — التقييم غير المسجَّل لا يمكن التحقق منه. وهذا لا يغيّر شيئًا في المبادلة نفسها: أي حسابين يُحفظان بالضمان بنفس الطريقة، مجانًا.",

  "deal.submit": "أنشئ المبادلة واحصل على رمز الدعوة",
  "deal.submitting": "جارٍ إنشاء المبادلة…",
  "deal.submitNote": "لم تتم مشاركة أي شيء بعد. ستحصل على رمز ترسله إلى الطرف الآخر.",

  "swap.protection.title": "كيف تُحمى المبادلة",
  "swap.protection.body":
    "لا يوجد مال نحتفظ به، لذلك الحماية هي التوقيت: يُودَع الحسابان لدينا أولًا، ثم يُفحصان، ثم يُسلَّمان في نفس اللحظة. لا يستطيع أي منكما أن يأخذ حسابًا وينصرف.",
  "swap.protection.fee": "بدون رسوم — لا يوجد مبلغ نأخذ منه نسبة.",

  "swap.sellerAccount": "حساب البائع",
  "swap.buyerAccount": "حساب المشتري",
  "swap.notDescribed": "لم يُوصف.",
  "swap.noMoney":
    "لا يتبادل الطرفان أي مال. يُحتفظ بالحسابين ويُسلَّمان معًا، فلا يستطيع أي طرف أن يأخذ حسابًا وينصرف. بدون رسوم.",

  "swap.deposit.yourTurn": "دورك: سلّم حسابك",
  "swap.released.title": "تم تسليم الحسابين",
  "swap.released.body":
    "سجّل الدخول، وغيّر البريد وكلمة المرور فورًا، ثم أكّد بالأسفل. لا تنتهي المبادلة حتى يؤكد كلاكما.",
  "swap.reveal": "أظهر الحساب الذي استلمته",
  "swap.reveal.note": "يظهر فقط عندما تطلبه، حتى لا يبقى معروضًا على الشاشة.",

  "step.opened": "فُتحت الصفقة",
  "step.joined": "انضم الطرفان",
  "step.deposited": "أُودع الحساب",
  "step.held": "المبلغ محجوز",
  "step.released": "سُلّمت بيانات الحساب",
  "step.paid": "استلم البائع مستحقاته",
  "step.bothDeposited": "أُودع الحسابان",
  "step.checked": "فُحص الحسابان",
  "step.swapped": "تمت مبادلة الحسابين",
};

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, ar };

/** A lookup bound to one language. Pass it down rather than re-reading cookies. */
export type Translate = (key: MessageKey) => string;

export function translator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale];

  // Falls back to English rather than rendering the key. A missing string
  // should look like an untranslated site, not like a broken one.
  return (key) => dictionary[key] ?? en[key];
}
