// Long-form page copy, in both languages.
//
// Separate from lib/dictionary.ts on purpose. That file holds the chrome —
// short labels that appear on every page, flat-keyed so a missing one is a
// type error. This holds paragraphs: whole sections of prose that only one
// page uses, where the natural shape is a nested object per page rather than
// fifty dotted keys.
//
// Both are typed against their English shape, so Arabic cannot silently be
// missing a field.
import type { Locale } from "@/lib/locale";

// ---------------------------------------------------------------------------
// /how-it-works
// ---------------------------------------------------------------------------

const howItWorksEn = {
  title: "How it works",
  intro:
    "Both sides are exposed in a normal account swap: whoever hands over first can be robbed. Escrow removes that by holding both accounts until each one has been checked.",

  costTitle: "What it costs",
  costBody:
    "Nothing. You trade an account for an account, so there is no price to take a percentage of and no payment for anyone to hold. The site takes no commission and never asks either side for money.",
  costWhy:
    "What funds it is the opposite of a fee: we pay out. Everyone who joins gets a promoter code, and every time someone who signed up with your code completes a swap, you earn $2.",

  joinTitle: "You need a code to join",
  joinBody:
    "There is no open sign-up. To create an account you paste a promoter's code, which is how everyone here arrived — and it is what makes the promoter programme worth anything to the people sharing it. Ask whoever sent you for theirs.",

  earnTitle: "Earning from the programme",
  earnBody:
    "Your own code is on your promoter page from the moment you register. Every completed swap by someone who used it credits you $2 — both sides of a swap earn for their own promoter, so a deal between two people you introduced pays you twice.",
  earnPayout:
    "Payouts start at $40 and go out in one batch on the 1st of each month. You can request one on any day once you are over the minimum; it is sent on the next 1st.",

  wrongTitle: "If something goes wrong",
  wrongBody:
    "Either side can open a dispute from the deal page once accounts have been deposited. That freezes everything immediately — nothing is released to anybody — and opens a case for the admin, who decides from the record: the verification notes on both accounts and the whole conversation on the deal.",
  wrongBefore:
    "Before either account is deposited, there is no dispute to have: either party can simply cancel and walk away.",

  rulesTitle: "Rules that protect you",
  rules: [
    "Never send account details outside a deal. If it is not on this site, the admin cannot help you and there is no record.",
    "Check both descriptions on the invite before you join. If either account is not what you agreed, do not join.",
    "Change the email and password the moment you get the other account, then confirm. The confirmation window exists for you, not against you.",
    "Do not touch the account you deposited. Recovering an account you have traded away is the fastest way to lose a dispute.",
    "Stay reachable until both sides have confirmed. Konami sends the transfer code to your inbox, and the other person cannot finish without it — going quiet at that point is what turns a normal swap into a dispute.",
  ],

  ctaStart: "Start a swap",
  ctaFaq: "Read the FAQ",
  unsure: "Still unsure?",
  getInTouch: "Get in touch",
  beforeSending: "before you send anything.",
};

const howItWorksAr: typeof howItWorksEn = {
  title: "كيف تعمل الخدمة",
  intro:
    "في أي مبادلة حسابات عادية يكون الطرفان مكشوفين: من يسلّم أولًا يمكن أن يُسرق. الضمان يلغي ذلك باحتجاز الحسابين حتى يتم التحقق من كل منهما.",

  costTitle: "التكلفة",
  costBody:
    "لا شيء. أنت تبادل حسابًا بحساب، فلا يوجد سعر تُؤخذ منه نسبة ولا دفعة يحتجزها أحد. الموقع لا يأخذ أي عمولة ولا يطلب مالًا من أي طرف.",
  costWhy:
    "ما يموّل الخدمة هو عكس الرسوم: نحن ندفع. كل من ينضم يحصل على رمز داعٍ خاص به، وفي كل مرة يُتمّ فيها شخصٌ سجّل برمزك مبادلةً، تربح 2 دولار.",

  joinTitle: "تحتاج إلى رمز للانضمام",
  joinBody:
    "لا يوجد تسجيل مفتوح. لإنشاء حساب تلصق رمز داعٍ، وهكذا وصل كل من هنا — وهذا ما يجعل برنامج الدعوة ذا قيمة لمن يشاركونه. اطلب الرمز ممن أرسلك إلى هنا.",

  earnTitle: "الربح من البرنامج",
  earnBody:
    "رمزك الخاص موجود في صفحة الدعوة منذ لحظة تسجيلك. كل مبادلة مكتملة من شخص استخدم رمزك تمنحك 2 دولار — وكل طرف في المبادلة يربح لداعيه هو، فصفقة بين شخصين دعوتَهما تدفع لك مرتين.",
  earnPayout:
    "الحد الأدنى للسحب 40 دولارًا، وتُرسل المبالغ دفعة واحدة في اليوم الأول من كل شهر. يمكنك طلب السحب في أي يوم بعد تجاوز الحد الأدنى، ويُرسل في الأول القادم.",

  wrongTitle: "إذا حدث خطأ ما",
  wrongBody:
    "يستطيع أي طرف فتح نزاع من صفحة الصفقة بمجرد إيداع الحسابين. هذا يجمّد كل شيء فورًا — لا يُسلَّم شيء لأحد — ويفتح قضية للمشرف، الذي يحكم من السجل: ملاحظات التحقق على الحسابين وكامل المحادثة على الصفقة.",
  wrongBefore:
    "قبل إيداع أي من الحسابين، لا يوجد نزاع أصلًا: يستطيع أي طرف ببساطة أن يلغي وينصرف.",

  rulesTitle: "قواعد تحميك",
  rules: [
    "لا ترسل أبدًا بيانات حساب خارج الصفقة. إن لم يكن على هذا الموقع، فلا يستطيع المشرف مساعدتك ولا يوجد سجل.",
    "راجع وصف الحسابين في الدعوة قبل الانضمام. إذا لم يكن أي منهما كما اتفقتما، فلا تنضم.",
    "غيّر البريد وكلمة المرور فور استلام الحساب الآخر، ثم أكِّد. نافذة التأكيد موجودة لصالحك لا ضدك.",
    "لا تمسّ الحساب الذي أودعته. استرجاع حساب بادلتَ به هو أسرع طريق لخسارة النزاع.",
    "ابقَ متاحًا حتى يؤكد الطرفان. ترسل كونامي رمز النقل إلى بريدك، ولا يستطيع الطرف الآخر إنهاء العملية بدونه — والاختفاء عند هذه النقطة هو ما يحوّل مبادلة عادية إلى نزاع.",
  ],

  ctaStart: "ابدأ مبادلة",
  ctaFaq: "اقرأ الأسئلة الشائعة",
  unsure: "ما زلت غير متأكد؟",
  getInTouch: "تواصل معنا",
  beforeSending: "قبل أن ترسل أي شيء.",
};

export const HOW_IT_WORKS: Record<Locale, typeof howItWorksEn> = {
  en: howItWorksEn,
  ar: howItWorksAr,
};

// ---------------------------------------------------------------------------
// /faq
// ---------------------------------------------------------------------------

const faqPageEn = {
  title: "Questions",
  intro:
    "If your question is about a specific deal, ask on the deal itself — that keeps it on the record.",
  notAnswered: "Not answered here?",
  contactUs: "Contact us",
};

const faqPageAr: typeof faqPageEn = {
  title: "الأسئلة",
  intro: "إذا كان سؤالك عن صفقة بعينها، فاسأل داخل الصفقة نفسها — هكذا يبقى ضمن السجل.",
  notAnswered: "لم تجد إجابتك هنا؟",
  contactUs: "اتصل بنا",
};

export const FAQ_PAGE: Record<Locale, typeof faqPageEn> = { en: faqPageEn, ar: faqPageAr };

// ---------------------------------------------------------------------------
// /reviews
// ---------------------------------------------------------------------------

const reviewsPageEn = {
  title: "What traders say",
  intro:
    "Public reviews from completed deals. Every review comes from a deal that actually completed — no seed data, no paid posts.",
  averageRating: "Average rating",
  reviewsSuffix: (n: number) => `from ${n} review${n === 1 ? "" : "s"}`,
  dealsCompleted: "Deals completed",
  dealsCompletedCaption: "accounts traded through escrow",
  settledClean: "Settled without dispute",
  settledCleanCaption: "of completed deals had no dispute",
  filterAll: "All",
  filterBuyer: "From buyers",
  filterSeller: "From sellers",
  buyerLabel: "Buyer",
  sellerLabel: "Seller",
  emptyTitle: "No reviews yet",
  emptyBody: "Be the first to complete a deal and leave a review.",
  emptyFilteredTitle: (filter: "buyer" | "seller") => `No ${filter} reviews yet`,
  emptyFilteredBody: (filter: "buyer" | "seller") =>
    `There are reviews, but none from ${filter === "buyer" ? "buyers" : "sellers"}. Switch to "All" to see them.`,
  noRating: "—",
};

const reviewsPageAr: typeof reviewsPageEn = {
  title: "ماذا يقول المتداولون",
  intro: "تقييمات علنية من صفقات مكتملة. كل تقييم يأتي من صفقة اكتملت فعلًا — لا بيانات تجريبية ولا منشورات مدفوعة.",
  averageRating: "متوسط التقييم",
  reviewsSuffix: (n: number) => `من ${n} تقييم${n === 1 ? "" : "ات"}`,
  dealsCompleted: "صفقات مكتملة",
  dealsCompletedCaption: "حسابات تم تبادلها عبر الضمان",
  settledClean: "سُوّيت بلا نزاع",
  settledCleanCaption: "من الصفقات المكتملة لم يكن فيها نزاع",
  filterAll: "الكل",
  filterBuyer: "من المشترين",
  filterSeller: "من البائعين",
  buyerLabel: "مشترٍ",
  sellerLabel: "بائع",
  emptyTitle: "لا توجد تقييمات بعد",
  emptyBody: "كن أول من يُتمّ صفقة ويترك تقييمًا.",
  emptyFilteredTitle: (filter: "buyer" | "seller") =>
    filter === "buyer" ? "لا توجد تقييمات من مشترين بعد" : "لا توجد تقييمات من بائعين بعد",
  emptyFilteredBody: (filter: "buyer" | "seller") =>
    `توجد تقييمات، لكن لا شيء من ${filter === "buyer" ? "المشترين" : "البائعين"}. بدّل إلى "الكل" لرؤيتها.`,
  noRating: "—",
};

export const REVIEWS_PAGE: Record<Locale, typeof reviewsPageEn> = {
  en: reviewsPageEn,
  ar: reviewsPageAr,
};

// ---------------------------------------------------------------------------
// /contact
// ---------------------------------------------------------------------------

const contactPageEn = {
  title: "Contact",
  intro: "For anything about a specific deal, the deal's own chat is faster and better.",
  dealChatTitle: "Have a deal open? Use the deal chat",
  dealChatBody:
    "Every deal has a conversation on it that the admin can read. Asking there is faster — the admin can see the deal you mean without you explaining it — and everything said becomes part of the record if it later turns into a dispute. A message sent by email or Discord does not.",
  dealChatOpenLead: "Open the deal from",
  dealChatOpenLink: "your deals",
  dealChatOpenTail: "and scroll to Messages.",
  everythingElse: "Everything else",
  noChannels: "No contact channels are configured yet.",
  placeholderBold: "Placeholder details.",
  placeholderBefore: "The contact channels above come from",
  placeholderAfter:
    "— replace them with your real email, Discord invite or Telegram handle. An escrow service with a fake support address is not going to earn anyone's trust.",
  reportingTitle: "Reporting something serious",
  reportingBody1:
    "If you believe an account was stolen, someone is being impersonated, or you have found a security problem with this site, say so directly in your first message. Those go to the front of the queue.",
  reportingBody2:
    "If a deal is going wrong right now, do not wait for a reply — open a dispute on the deal. That freezes the money and the account immediately, which is the thing that actually protects you. You can always withdraw it afterwards.",
  responseTitle: "Response times",
  responseBody:
    "This is a one-person operation, not a call centre. Payments and releases are handled by a human who has to check a wallet and log into an account, which is exactly why the service works — but it does mean replies are not instant.",
  emailLabel: "Email",
  discordLabel: "Discord",
  telegramLabel: "Telegram",
};

const contactPageAr: typeof contactPageEn = {
  title: "اتصل بنا",
  intro: "لأي شيء يخص صفقة بعينها، محادثة الصفقة نفسها أسرع وأفضل.",
  dealChatTitle: "لديك صفقة مفتوحة؟ استخدم محادثة الصفقة",
  dealChatBody:
    "كل صفقة عليها محادثة يستطيع المشرف قراءتها. السؤال هناك أسرع — يستطيع المشرف رؤية الصفقة التي تقصدها دون أن تشرحها — وكل ما يُقال يصبح جزءًا من السجل إذا تحوّل لاحقًا إلى نزاع. رسالة عبر البريد أو ديسكورد لا تفعل ذلك.",
  dealChatOpenLead: "افتح الصفقة من",
  dealChatOpenLink: "صفقاتك",
  dealChatOpenTail: "ثم مرّر إلى الرسائل.",
  everythingElse: "كل شيء آخر",
  noChannels: "لا توجد قنوات تواصل مُعدّة بعد.",
  placeholderBold: "تفاصيل مؤقتة.",
  placeholderBefore: "قنوات التواصل أعلاه تأتي من",
  placeholderAfter: "— استبدلها ببريدك الحقيقي أو دعوة ديسكورد أو معرّف تيليجرام. خدمة ضمان بعنوان دعم وهمي لن تكسب ثقة أحد.",
  reportingTitle: "الإبلاغ عن شيء خطير",
  reportingBody1:
    "إذا اعتقدت أن حسابًا سُرق، أو أن أحدًا ينتحل شخصية غيره، أو وجدت مشكلة أمنية في هذا الموقع، فقل ذلك مباشرة في رسالتك الأولى. تلك تُوضع في مقدمة القائمة.",
  reportingBody2:
    "إذا كانت صفقة تسير بشكل خاطئ الآن، لا تنتظر ردًا — افتح نزاعًا على الصفقة. هذا يجمّد المال والحساب فورًا، وهو ما يحميك فعلًا. يمكنك دائمًا سحب النزاع لاحقًا.",
  responseTitle: "أوقات الرد",
  responseBody:
    "هذا عمل يديره شخص واحد، لا مركز اتصال. المدفوعات والتسليمات يتولاها شخص عليه فحص محفظة وتسجيل الدخول إلى حساب، وهذا بالضبط ما يجعل الخدمة تعمل — لكنه يعني أن الردود ليست فورية.",
  emailLabel: "البريد الإلكتروني",
  discordLabel: "ديسكورد",
  telegramLabel: "تيليجرام",
};

export const CONTACT_PAGE: Record<Locale, typeof contactPageEn> = {
  en: contactPageEn,
  ar: contactPageAr,
};

// ---------------------------------------------------------------------------
// /deals (trade history)
// ---------------------------------------------------------------------------

const tradeHistoryEn = {
  title: "Trade history",
  description: "Every deal you have been part of, on either side, whatever the outcome.",
  filterAll: (n: number) => `All (${n})`,
  filterOpen: (n: number) => `Still running (${n})`,
  filterSettled: (n: number) => `Settled (${n})`,
  tableCaption: "Your trade history",
  emptyTitle: "No trades yet",
  emptyBody:
    "Once you complete one, it stays here permanently — including the ones that went wrong. The record is what makes a rating mean anything.",
  emptyOpenAction: "Open a deal",
  emptyJoinAction: "I have a code",
  emptyOpenTitle: "Nothing running right now",
  emptySettledTitle: "Nothing settled yet",
  emptyShowAll: "Show everything",
  emptyOpenBody: "None of your deals are currently in flight.",
  emptySettledBody: "A deal lands here once it completes, is refunded, or is called off.",
  footLead: "Looking for what needs doing rather than what happened?",
  footLink: "Your dashboard",
  footTail: "shows that.",
  colReference: "Reference",
  colOpened: "Opened",
  colAccount: "Account",
  colSide: "Your side",
  colTrade: "Trade",
  colStatus: "Status",
  sideSeller: "seller",
  sideBuyer: "buyer",
  swap: "Swap",
  swapCaption: "account for account",
  youReceived: "you received",
  youPaid: "you paid",
};

const tradeHistoryAr: typeof tradeHistoryEn = {
  title: "سجل التداول",
  description: "كل صفقة كنت جزءًا منها، من أي جانب، وأيًّا كانت النتيجة.",
  filterAll: (n: number) => `الكل (${n})`,
  filterOpen: (n: number) => `لا تزال قائمة (${n})`,
  filterSettled: (n: number) => `مسوّاة (${n})`,
  tableCaption: "سجل تداولك",
  emptyTitle: "لا توجد صفقات بعد",
  emptyBody:
    "بمجرد أن تُتمّ صفقة، تبقى هنا بشكل دائم — بما في ذلك ما ساء منها. السجل هو ما يجعل التقييم يعني شيئًا.",
  emptyOpenAction: "افتح صفقة",
  emptyJoinAction: "لدي رمز",
  emptyOpenTitle: "لا شيء قائم الآن",
  emptySettledTitle: "لا شيء مسوّى بعد",
  emptyShowAll: "أظهر كل شيء",
  emptyOpenBody: "لا توجد صفقات جارية حاليًا.",
  emptySettledBody: "تصل الصفقة إلى هنا بمجرد اكتمالها، أو استردادها، أو إلغائها.",
  footLead: "تبحث عمّا يجب فعله لا عمّا حدث؟",
  footLink: "لوحتك",
  footTail: "تُظهر ذلك.",
  colReference: "المرجع",
  colOpened: "تاريخ الفتح",
  colAccount: "الحساب",
  colSide: "جانبك",
  colTrade: "الصفقة",
  colStatus: "الحالة",
  sideSeller: "بائع",
  sideBuyer: "مشترٍ",
  swap: "مبادلة",
  swapCaption: "حساب مقابل حساب",
  youReceived: "استلمت",
  youPaid: "دفعت",
};

export const TRADE_HISTORY_PAGE: Record<Locale, typeof tradeHistoryEn> = {
  en: tradeHistoryEn,
  ar: tradeHistoryAr,
};

// ---------------------------------------------------------------------------
// /deals/join and /deals/join/[code]
// ---------------------------------------------------------------------------

const joinDealPageEn = {
  title: "Join a deal",
  description: "Someone sent you an invite code for a deal you already agreed.",
};

const joinDealPageAr: typeof joinDealPageEn = {
  title: "انضم إلى صفقة",
  description: "أرسل لك أحدهم رمز دعوة لصفقة اتفقتما عليها بالفعل.",
};

export const JOIN_DEAL_PAGE: Record<Locale, typeof joinDealPageEn> = {
  en: joinDealPageEn,
  ar: joinDealPageAr,
};

const joinByCodePageEn = {
  invalidTitle: "This invite is not usable",
  invalidBody: "The code is wrong, someone has already joined this deal, or it was cancelled.",
  invalidAskLead: "Ask the other person to check it, or",
  invalidAskLink: "paste a different code",
  title: "Join this deal",
  description: (name: string) => `${name} invited you. Check the terms match what you agreed.`,
  wouldBeSeller: "you would be the seller",
  wouldBeBuyer: "you would be the buyer",
  whoInvited: "Who invited you",
  buyerPays: "Buyer pays",
  escrowFee: "Escrow fee",
  sellerReceives: "Seller receives",
  ownDeal:
    "This is the deal you created — you cannot be both sides. Send the code to the other person instead.",
  notWhatAgreed:
    "If these terms are not what you agreed, do not join. Nothing is committed until you do.",
};

const joinByCodePageAr: typeof joinByCodePageEn = {
  invalidTitle: "هذه الدعوة غير صالحة للاستخدام",
  invalidBody: "الرمز خاطئ، أو انضم أحدهم بالفعل إلى هذه الصفقة، أو أُلغيت.",
  invalidAskLead: "اطلب من الطرف الآخر التحقق منه، أو",
  invalidAskLink: "الصق رمزًا مختلفًا",
  title: "انضم إلى هذه الصفقة",
  description: (name: string) => `دعاك ${name}. تحقق من أن الشروط تطابق ما اتفقتما عليه.`,
  wouldBeSeller: "ستكون البائع",
  wouldBeBuyer: "ستكون المشتري",
  whoInvited: "من دعاك",
  buyerPays: "يدفع المشتري",
  escrowFee: "رسوم الضمان",
  sellerReceives: "يستلم البائع",
  ownDeal:
    "هذه هي الصفقة التي أنشأتها — لا يمكنك أن تكون الطرفين معًا. أرسل الرمز إلى الطرف الآخر بدلًا من ذلك.",
  notWhatAgreed: "إذا لم تكن هذه الشروط ما اتفقتما عليه، فلا تنضم. لا يُلزَم أي طرف حتى تنضم.",
};

export const JOIN_BY_CODE_PAGE: Record<Locale, typeof joinByCodePageEn> = {
  en: joinByCodePageEn,
  ar: joinByCodePageAr,
};

// ---------------------------------------------------------------------------
// JoinDealForm
// ---------------------------------------------------------------------------

const joinDealFormEn = {
  inviteCodeLabel: "Invite code",
  inviteCodeHint: "The other person gets this when they open the deal.",
  inviteCodePlaceholder: "Paste the code here",
  joining: "Joining…",
  join: "Join this deal",
};

const joinDealFormAr: typeof joinDealFormEn = {
  inviteCodeLabel: "رمز الدعوة",
  inviteCodeHint: "يحصل الطرف الآخر على هذا عند فتح الصفقة.",
  inviteCodePlaceholder: "الصق الرمز هنا",
  joining: "جارٍ الانضمام…",
  join: "انضم إلى هذه الصفقة",
};

export const JOIN_DEAL_FORM: Record<Locale, typeof joinDealFormEn> = {
  en: joinDealFormEn,
  ar: joinDealFormAr,
};

// ---------------------------------------------------------------------------
// /notifications
// ---------------------------------------------------------------------------

const notificationsPageEn = {
  title: "Notifications",
  nothingWaiting: "Nothing is waiting on you.",
  thingsWantAttention: (n: number) => `${n} thing${n === 1 ? "" : "s"} want your attention.`,
  caughtUpTitle: "You are all caught up",
  caughtUpBody:
    "No deal is waiting on you, nothing is frozen, and there are no unread messages. Anything still running is waiting on the other person or on the admin.",
  disputedTitle: (ref: string) => `${ref} is frozen by a dispute`,
  disputedBody:
    "Nothing moves — no credentials, no payout — until the admin decides it. Anything you can add to the record helps.",
  unreadTitle: (n: number) => `${n} unread message${n === 1 ? "" : "s"}`,
  unreadBody: "Across all your deals. Open the deal to read them — messages on a deal are part of its record.",
  yourMove: "your move",
  awaitingJoinTitle: (ref: string) => `${ref} is waiting for the other person`,
  awaitingJoinBody: "Send them the invite code from the deal page. Nothing happens until they join.",
  footLead:
    "This page is built from the current state of your deals, not from stored alerts — there is nothing to mark as read, and items disappear once the thing they describe is done. This service does not send email; see",
  footLink: "the FAQ",
  footTail: "for what that means if you go quiet mid-deal.",
  actionDepositAccount: "deposit the account",
  actionPayEscrow: "pay into escrow",
  actionClaimAccount: "claim the account",
  actionConfirm: "confirm you have it",
};

const notificationsPageAr: typeof notificationsPageEn = {
  title: "الإشعارات",
  nothingWaiting: "لا شيء ينتظرك.",
  thingsWantAttention: (n: number) => `${n} ${n === 1 ? "أمر يحتاج" : "أمور تحتاج"} انتباهك.`,
  caughtUpTitle: "أنت على اطّلاع بكل شيء",
  caughtUpBody:
    "لا توجد صفقة تنتظرك، ولا شيء مجمَّد، ولا رسائل غير مقروءة. أي شيء لا يزال قائمًا ينتظر الطرف الآخر أو المشرف.",
  disputedTitle: (ref: string) => `${ref} مجمَّدة بسبب نزاع`,
  disputedBody: "لا شيء يتحرك — لا بيانات حساب، ولا دفعة — حتى يقرر المشرف. أي إضافة للسجل تساعد.",
  unreadTitle: (n: number) => `${n} ${n === 1 ? "رسالة غير مقروءة" : "رسائل غير مقروءة"}`,
  unreadBody: "عبر كل صفقاتك. افتح الصفقة لقراءتها — الرسائل على الصفقة جزء من سجلها.",
  yourMove: "دورك",
  awaitingJoinTitle: (ref: string) => `${ref} تنتظر الطرف الآخر`,
  awaitingJoinBody: "أرسل له رمز الدعوة من صفحة الصفقة. لا يحدث شيء حتى ينضم.",
  footLead:
    "هذه الصفحة مبنية على الحالة الحالية لصفقاتك، لا على تنبيهات مخزَّنة — لا يوجد ما تُعلّمه كمقروء، وتختفي العناصر بمجرد إنجاز ما تصفه. هذه الخدمة لا ترسل بريدًا؛ راجع",
  footLink: "الأسئلة الشائعة",
  footTail: "لمعرفة ما يعنيه ذلك إن اختفيت في منتصف صفقة.",
  actionDepositAccount: "أودع الحساب",
  actionPayEscrow: "ادفع إلى الضمان",
  actionClaimAccount: "استلم الحساب",
  actionConfirm: "أكِّد استلامك",
};

export const NOTIFICATIONS_PAGE: Record<Locale, typeof notificationsPageEn> = {
  en: notificationsPageEn,
  ar: notificationsPageAr,
};

// ---------------------------------------------------------------------------
// /settings/security
// ---------------------------------------------------------------------------

const securityPageEn = {
  title: "Security",
  description: "What stands between someone with your password and your deals.",
  twoFactor: "Two-factor",
  on: "On",
  off: "Off",
  onCaption: "a code is required to sign in",
  offCaption: "your password is the only lock",
  recoveryCodesLeft: "Recovery codes left",
  recoveryCodesLeftCaption: "each works once, in place of the app",
  recoveryCodesIssuedCaption: "issued when you turn 2FA on",
  twoFactorSectionTitle: "Two-factor authentication",
  twoFactorSectionBody:
    "A code from your phone on top of your password. Worth doing on any account here — a stolen password otherwise gives someone your deal history and anything mid-trade.",
  twoFactorAdminNote: "On this account it matters more than most:",
  twoFactorAdminBody: "it approves every payout and can decrypt any account being traded.",
  passwordSectionTitle: "Password",
  passwordSectionBody:
    "There is no way to change or reset your password yet, and no email is sent from this service. If you are locked out,",
  passwordSectionLink: "here is what does work",
};

const securityPageAr: typeof securityPageEn = {
  title: "الأمان",
  description: "ما يقف بين شخص يملك كلمة مرورك وصفقاتك.",
  twoFactor: "المصادقة الثنائية",
  on: "مفعّلة",
  off: "معطّلة",
  onCaption: "يُطلب رمز لتسجيل الدخول",
  offCaption: "كلمة مرورك هي القفل الوحيد",
  recoveryCodesLeft: "رموز الاسترجاع المتبقية",
  recoveryCodesLeftCaption: "كل رمز يعمل مرة واحدة، بدل التطبيق",
  recoveryCodesIssuedCaption: "تُصدَر عند تفعيل المصادقة الثنائية",
  twoFactorSectionTitle: "المصادقة الثنائية",
  twoFactorSectionBody:
    "رمز من هاتفك فوق كلمة مرورك. يستحق التفعيل على أي حساب هنا — فكلمة مرور مسروقة تمنح غيرك سجل صفقاتك وأي شيء قيد التداول.",
  twoFactorAdminNote: "على هذا الحساب، الأمر أهم من أي حساب آخر:",
  twoFactorAdminBody: "فهو يوافق على كل دفعة ويستطيع فك تشفير أي حساب قيد التداول.",
  passwordSectionTitle: "كلمة المرور",
  passwordSectionBody:
    "لا توجد طريقة لتغيير أو إعادة تعيين كلمة مرورك بعد، ولا تُرسل هذه الخدمة أي بريد. إذا كنت مقفلًا خارجًا،",
  passwordSectionLink: "إليك ما يعمل فعلًا",
};

export const SECURITY_PAGE: Record<Locale, typeof securityPageEn> = {
  en: securityPageEn,
  ar: securityPageAr,
};

// ---------------------------------------------------------------------------
// TwoFactorSetup
// ---------------------------------------------------------------------------

const twoFactorSetupEn = {
  appHint:
    "You will need an authenticator app — Google Authenticator, Aegis, 1Password, Bitwarden and most password managers all work.",
  settingUp: "Setting up…",
  turnOn: "Turn on two-factor",
  scanTitle: "1. Scan this with your authenticator app",
  cannotScan: "Cannot scan? Enter this key by hand:",
  codeLabel: "2. Enter the code it shows",
  codeHint: "Six digits. This proves the app is set up before we switch anything on.",
  checking: "Checking…",
  confirmAndTurnOn: "Confirm and turn on",
  onAlert: "Two-factor is on.",
  saveNowTitle: "Save these recovery codes now",
  saveNowBody:
    "Each one works once, in place of a code from your app. This service has no password reset yet, so if you lose your phone and have not kept these, nobody can get you back into your account — not even the admin. Print them or put them in a password manager.",
  copied: "Copied",
  copyAll: "Copy all",
  wontShowAgain: "They will not be shown again. Reloading this page loses them.",
  acknowledge: "I have saved these somewhere I can get to without my phone.",
  done: "Done",
  onForAccount: "Two-factor is on for this account.",
  codesLeft: (n: number) => `${n} recovery code${n === 1 ? "" : "s"} left.`,
  codesNone: " None remain — if you lose your phone now you cannot get back in. Turn two-factor off and on again to issue a fresh set.",
  codesLow: " Running low. Turn two-factor off and on again to issue a fresh set.",
  confirmPasswordLabel: "Confirm your password",
  confirmPasswordHint: "Asked for so that someone who finds your screen unlocked cannot simply strip it off.",
  turningOff: "Turning off…",
  turnOff: "Turn off two-factor",
  keepOn: "Keep it on",
};

const twoFactorSetupAr: typeof twoFactorSetupEn = {
  appHint:
    "ستحتاج إلى تطبيق مصادقة — Google Authenticator أو Aegis أو 1Password أو Bitwarden، وتعمل معظم مديري كلمات المرور أيضًا.",
  settingUp: "جارٍ الإعداد…",
  turnOn: "فعّل المصادقة الثنائية",
  scanTitle: "١. امسح هذا برمز الاستجابة السريعة من تطبيق المصادقة",
  cannotScan: "لا تستطيع المسح؟ أدخل هذا المفتاح يدويًا:",
  codeLabel: "٢. أدخل الرمز الذي يعرضه",
  codeHint: "ستة أرقام. هذا يثبت أن التطبيق جاهز قبل أن نفعّل أي شيء.",
  checking: "جارٍ التحقق…",
  confirmAndTurnOn: "أكِّد وفعّل",
  onAlert: "المصادقة الثنائية مفعّلة.",
  saveNowTitle: "احفظ رموز الاسترجاع هذه الآن",
  saveNowBody:
    "كل رمز يعمل مرة واحدة، بدل رمز من تطبيقك. هذه الخدمة لا تملك إعادة تعيين لكلمة المرور بعد، فإذا فقدت هاتفك ولم تحتفظ بهذه الرموز، لن يستطيع أحد إعادتك إلى حسابك — ولا حتى المشرف. اطبعها أو ضعها في مدير كلمات مرور.",
  copied: "تم النسخ",
  copyAll: "انسخ الكل",
  wontShowAgain: "لن تُعرض مرة أخرى. إعادة تحميل هذه الصفحة تفقدها.",
  acknowledge: "لقد حفظت هذه في مكان يمكنني الوصول إليه بدون هاتفي.",
  done: "تم",
  onForAccount: "المصادقة الثنائية مفعّلة لهذا الحساب.",
  codesLeft: (n: number) => `تبقّى ${n} ${n === 1 ? "رمز استرجاع" : "رموز استرجاع"}.`,
  codesNone: " لم يتبقَّ شيء — إذا فقدت هاتفك الآن فلن تستطيع الدخول. أوقف المصادقة الثنائية وفعّلها من جديد لإصدار مجموعة جديدة.",
  codesLow: " الرصيد منخفض. أوقف المصادقة الثنائية وفعّلها من جديد لإصدار مجموعة جديدة.",
  confirmPasswordLabel: "أكِّد كلمة مرورك",
  confirmPasswordHint: "نطلبها حتى لا يستطيع من يجد شاشتك مفتوحة إيقافها ببساطة.",
  turningOff: "جارٍ الإيقاف…",
  turnOff: "أوقف المصادقة الثنائية",
  keepOn: "أبقها مفعّلة",
};

export const TWO_FACTOR_SETUP: Record<Locale, typeof twoFactorSetupEn> = {
  en: twoFactorSetupEn,
  ar: twoFactorSetupAr,
};

// ---------------------------------------------------------------------------
// /wallet
// ---------------------------------------------------------------------------

const walletPageEn = {
  title: "Your balance",
  description: "What you have earned from the people you brought to the site, and what you have taken out.",
  availableToWithdraw: "Available to withdraw",
  earnedFromReferrals: "Earned from referrals",
  requestedOrSent: "Requested or already sent",
  readyToRequest: "Ready to request",
  readyBody: (minimum: string) =>
    `You are over the ${minimum} minimum. Request a payout whenever you like — payouts are sent in one batch on the 1st of each month, so the next one goes out on`,
  toGo: (amount: string) => `${amount} to go`,
  notReadyBody: (minimum: string) => `The smallest payout is ${minimum}. That is`,
  moreCompletedDeal: (n: number) => `${n} more completed ${n === 1 ? "deal" : "deals"}`,
  notReadyTail: "by the people you brought in. Payouts are sent on the 1st of each month.",
  negativeBalance: (amount: string) =>
    `Your balance is ${amount}. A deal was reversed after you had been paid for it. Credits from the next deals your people complete go towards clearing that before anything can be withdrawn again.`,
  withdraw: "Withdraw",
  hasOpenLead: "You have a withdrawal of",
  hasOpenTail: "waiting to be sent. You can only have one at a time.",
  testConfirmed: "Test confirmed. The rest goes out in the next batch.",
  withdrawals: "Withdrawals",
  nothingWithdrawnTitle: "Nothing withdrawn yet",
  nothingWithdrawnBody: (minimum: string) => `Once your referral earnings reach ${minimum}, you can request a payout here.`,
  requested: "Requested",
  sent: "sent",
  closed: "closed",
  reference: "Reference: ",
  reason: "Reason: ",
  whatsInBalance: "What is in the balance",
  whatsInBalanceCaption: (amount: string) =>
    `Every ${amount} credit, and the deal that earned it. This is the balance above, itemised — so you can check it rather than trust it.`,
  noEarningsTitle: "No referral earnings yet",
  noEarningsBody: (amount: string) => `You earn ${amount} each time someone who signed up with your code completes a swap.`,
  shareCode: "Share your code",
  toGetStarted: "to get started.",
  completedSwap: "completed a swap",
  statusRequested: "Waiting to be sent",
  statusSent: "Sent",
  statusRejected: "Refused",
  statusCancelled: "Cancelled",
};

const walletPageAr: typeof walletPageEn = {
  title: "رصيدك",
  description: "ما ربحته من الأشخاص الذين جلبتهم إلى الموقع، وما سحبته منه.",
  availableToWithdraw: "المتاح للسحب",
  earnedFromReferrals: "أرباح من الدعوات",
  requestedOrSent: "مطلوب أو أُرسل بالفعل",
  readyToRequest: "جاهز للطلب",
  readyBody: () => "تجاوزت الحد الأدنى. اطلب سحبًا في أي وقت تشاء — تُرسل السحوبات دفعة واحدة في الأول من كل شهر، وتخرج الدفعة القادمة في",
  toGo: (amount: string) => `تبقّى ${amount}`,
  notReadyBody: (minimum: string) => `أصغر دفعة هي ${minimum}. وهذا يعادل`,
  moreCompletedDeal: (n: number) => `${n} ${n === 1 ? "صفقة مكتملة أخرى" : "صفقات مكتملة أخرى"}`,
  notReadyTail: "ممن جلبتهم. تُرسل الدفعات في الأول من كل شهر.",
  negativeBalance: (amount: string) =>
    `رصيدك ${amount}. أُلغيت صفقة بعد أن دُفع لك مقابلها. الأرصدة من الصفقات التالية لمن جلبتهم تذهب لتسوية ذلك قبل أن يُسحب أي شيء آخر.`,
  withdraw: "اسحب",
  hasOpenLead: "لديك طلب سحب بقيمة",
  hasOpenTail: "بانتظار الإرسال. يمكنك أن يكون لديك طلب واحد فقط في كل مرة.",
  testConfirmed: "تم تأكيد الاختبار. الباقي يُرسل في الدفعة القادمة.",
  withdrawals: "السحوبات",
  nothingWithdrawnTitle: "لم تسحب شيئًا بعد",
  nothingWithdrawnBody: (minimum: string) => `بمجرد أن تبلغ أرباح الدعوة ${minimum}، يمكنك طلب سحب هنا.`,
  requested: "طُلب في",
  sent: "أُرسل",
  closed: "أُغلق",
  reference: "المرجع: ",
  reason: "السبب: ",
  whatsInBalance: "ما يتكوّن منه الرصيد",
  whatsInBalanceCaption: (amount: string) =>
    `كل رصيد ${amount}، والصفقة التي حققته. هذا هو الرصيد أعلاه، مفصّلًا — لتتحقق منه لا أن تثق به فقط.`,
  noEarningsTitle: "لا أرباح دعوة بعد",
  noEarningsBody: (amount: string) => `تربح ${amount} في كل مرة يُتمّ فيها شخص سجّل برمزك مبادلة.`,
  shareCode: "شارك رمزك",
  toGetStarted: "لتبدأ.",
  completedSwap: "أتمّ مبادلة",
  statusRequested: "بانتظار الإرسال",
  statusSent: "أُرسل",
  statusRejected: "مرفوض",
  statusCancelled: "ملغى",
};

export const WALLET_PAGE: Record<Locale, typeof walletPageEn> = { en: walletPageEn, ar: walletPageAr };

// ---------------------------------------------------------------------------
// WithdrawForm / CancelWithdrawalButton / ConfirmTestButton
// ---------------------------------------------------------------------------

const withdrawFormEn = {
  methodCrypto: "Crypto",
  methodCard: "PayPal / wallet",
  methodGiftCard: "Gift card",
  methodBankTransfer: "Bank transfer",
  belowMinimum: (minimum: string) =>
    `You can withdraw once your balance reaches ${minimum}. Anything smaller costs more in transfer fees than it is worth.`,
  howMuch: "How much",
  upTo: (amount: string) => `Up to ${amount}.`,
  howYouWantIt: "How you want it",
  walletAddress: "Wallet address",
  network: "Network",
  networkHint: "TRC-20, ERC-20, BEP-20… the same address on the wrong network loses the money.",
  ibanOrAccount: "IBAN or account number",
  bank: "Bank",
  swiftBic: "SWIFT / BIC",
  swiftBicHint: "Only needed for international transfers. Leave it blank if you do not have one.",
  service: "Service",
  emailOrHandle: "Email or handle on the account",
  whichCard: "Which card",
  whichCardHint: "Steam, Amazon or Google Play.",
  whereToSend: "Where to send the code",
  whereToSendHint: "An email address. Nothing is charged to it — the code is just sent there.",
  walletAddressAgain: "Wallet address again",
  confirmWhereItGoes: "Confirm where it goes",
  mismatchError: "These do not match. Check both, character for character.",
  confirmHint: "Paste or type it a second time. We compare the two before submitting.",
  nameOnAccount: "Name on the account",
  nameOnAccountHint: "Banks and most wallets refuse a transfer where the name does not match.",
  namePlaceholder: "As it appears on the account",
  requesting: "Requesting…",
  requestPayout: "Request payout",
  checkTwice:
    "Check the destination twice. The admin sends exactly what you put here, and a transfer to the wrong address cannot be pulled back.",
  cancelling: "Cancelling…",
  cancelRequest: "Cancel this request",
  testSentTitle: "We sent you a $1 test",
  testSentBody:
    "Check it arrived before we send the rest. If it did not, do not confirm — tell us, and we will check the address rather than send the balance after it.",
  confirming: "Confirming…",
  yesArrived: "Yes, the $1 arrived",
};

const withdrawFormAr: typeof withdrawFormEn = {
  methodCrypto: "عملة رقمية",
  methodCard: "PayPal / محفظة",
  methodGiftCard: "بطاقة هدايا",
  methodBankTransfer: "تحويل بنكي",
  belowMinimum: (minimum: string) => `يمكنك السحب بمجرد أن يبلغ رصيدك ${minimum}. أي مبلغ أصغر تأكل منه رسوم التحويل أكثر مما يستحق.`,
  howMuch: "كم المبلغ",
  upTo: (amount: string) => `حتى ${amount}.`,
  howYouWantIt: "كيف تريده",
  walletAddress: "عنوان المحفظة",
  network: "الشبكة",
  networkHint: "TRC-20، ERC-20، BEP-20… نفس العنوان على شبكة خاطئة يفقد المال.",
  ibanOrAccount: "رقم الآيبان أو الحساب",
  bank: "البنك",
  swiftBic: "SWIFT / BIC",
  swiftBicHint: "يلزم فقط للتحويلات الدولية. اتركه فارغًا إن لم يكن لديك.",
  service: "الخدمة",
  emailOrHandle: "البريد أو المعرّف على الحساب",
  whichCard: "أي بطاقة",
  whichCardHint: "ستيم أو أمازون أو جوجل بلاي.",
  whereToSend: "أين يُرسل الرمز",
  whereToSendHint: "بريد إلكتروني. لا يُخصم منه شيء — الرمز يُرسل إليه فقط.",
  walletAddressAgain: "عنوان المحفظة مرة أخرى",
  confirmWhereItGoes: "أكِّد الوجهة",
  mismatchError: "لا يتطابقان. تحقق من كليهما، حرفًا بحرف.",
  confirmHint: "الصقه أو اكتبه مرة ثانية. نقارن الاثنين قبل الإرسال.",
  nameOnAccount: "الاسم على الحساب",
  nameOnAccountHint: "البنوك ومعظم المحافظ ترفض تحويلًا لا يطابق فيه الاسم.",
  namePlaceholder: "كما يظهر على الحساب",
  requesting: "جارٍ الطلب…",
  requestPayout: "اطلب السحب",
  checkTwice: "تحقق من الوجهة مرتين. يرسل المشرف بالضبط ما كتبته هنا، ولا يمكن سحب تحويل أُرسل إلى عنوان خاطئ.",
  cancelling: "جارٍ الإلغاء…",
  cancelRequest: "ألغِ هذا الطلب",
  testSentTitle: "أرسلنا لك اختبارًا بدولار واحد",
  testSentBody: "تحقق من وصوله قبل أن نرسل الباقي. إن لم يصل، لا تؤكد — أخبرنا، وسنتحقق من العنوان بدل إرسال الرصيد بعده.",
  confirming: "جارٍ التأكيد…",
  yesArrived: "نعم، وصل الدولار",
};

export const WITHDRAW_FORM: Record<Locale, typeof withdrawFormEn> = {
  en: withdrawFormEn,
  ar: withdrawFormAr,
};

// ---------------------------------------------------------------------------
// /u/[id] (public profile)
// ---------------------------------------------------------------------------

const profilePageEn = {
  tradingSince: "Trading here since",
  overall: "Overall",
  reviewCount: (n: number) => `${n} review${n === 1 ? "" : "s"}`,
  asSeller: "As a seller",
  salesCompleted: (n: number) => `${n} sale${n === 1 ? "" : "s"} completed`,
  asBuyer: "As a buyer",
  purchasesCompleted: (n: number) => `${n} purchase${n === 1 ? "" : "s"} completed`,
  ratingSpreadTitle: "How the ratings fall",
  ratingSpreadCaption: "An average hides whether the low ones are rare or routine.",
  reviewsHeading: "Reviews",
  noReviewsTitle: (name: string) => `No reviews for ${name} yet`,
  noReviewsBody:
    "That is not a bad sign on its own — it just means there is no record to go on. Both sides review each other after every completed deal, so this fills up once they trade.",
  asSide: "as",
  seller: "seller",
  buyer: "buyer",
  noComment: "No comment left.",
  by: "by",
  allReviewsLink: "All reviews across the service",
  star: (n: number) => `${n} star${n === 1 ? "" : "s"}`,
};

const profilePageAr: typeof profilePageEn = {
  tradingSince: "يتداول هنا منذ",
  overall: "الإجمالي",
  reviewCount: (n: number) => `${n} ${n === 1 ? "تقييم" : "تقييمات"}`,
  asSeller: "كبائع",
  salesCompleted: (n: number) => `${n} ${n === 1 ? "عملية بيع مكتملة" : "عمليات بيع مكتملة"}`,
  asBuyer: "كمشترٍ",
  purchasesCompleted: (n: number) => `${n} ${n === 1 ? "عملية شراء مكتملة" : "عمليات شراء مكتملة"}`,
  ratingSpreadTitle: "توزّع التقييمات",
  ratingSpreadCaption: "المتوسط يخفي ما إذا كانت التقييمات المنخفضة نادرة أم معتادة.",
  reviewsHeading: "التقييمات",
  noReviewsTitle: (name: string) => `لا توجد تقييمات لـ ${name} بعد`,
  noReviewsBody:
    "هذه ليست علامة سيئة بحد ذاتها — تعني فقط أنه لا يوجد سجل بعد. كل طرف يقيّم الآخر بعد كل صفقة مكتملة، فيمتلئ هذا بمجرد أن يتداول.",
  asSide: "كـ",
  seller: "بائع",
  buyer: "مشترٍ",
  noComment: "لم يُترك تعليق.",
  by: "بواسطة",
  allReviewsLink: "كل التقييمات عبر الخدمة",
  star: (n: number) => `${n} ${n === 1 ? "نجمة" : "نجوم"}`,
};

export const PROFILE_PAGE: Record<Locale, typeof profilePageEn> = {
  en: profilePageEn,
  ar: profilePageAr,
};

// ---------------------------------------------------------------------------
// /dashboard
// ---------------------------------------------------------------------------

const dashboardPageEn = {
  hello: (name: string) => `Hello, ${name}`,
  everyDeal: "Every deal you are part of, on either side.",
  openDeal: "Open a deal",
  haveCode: "I have a code",
  openDeals: "Open deals",
  stillRunning: "still running",
  waitingOnYou: "Waiting on you",
  yourMoveNext: "your move next",
  unreadMessages: "Unread messages",
  acrossAllDeals: "across all deals",
  referralEarnings: "Referral earnings",
  readyToWithdraw: "ready to withdraw",
  minimum: (amount: string) => `${amount} minimum`,
  whereDealsStand: "Where your deals stand",
  everyDealByStage: "Every deal you have ever been part of, by stage.",
  yourDeals: "Your deals",
  noDealsTitle: "No deals yet",
  noDealsBody:
    "Open one and send the invite code to the other person, or join a deal you were invited to. Nothing is bought or sold here — you bring a deal you have already agreed.",
  notSureLead: "Not sure what happens next?",
  notSureLink: "Read how a trade works",
  colReference: "Reference",
  colAccount: "Account",
  colSide: "Your side",
  colTrade: "Trade",
  colStatus: "Status",
  sideSeller: "seller",
  sideBuyer: "buyer",
  yourTurn: "your turn",
  swap: "Swap",
  swapCaption: "account for account",
  youReceived: "you received",
  youPaid: "you paid",
};

const dashboardPageAr: typeof dashboardPageEn = {
  hello: (name: string) => `مرحبًا، ${name}`,
  everyDeal: "كل صفقة أنت جزء منها، من أي جانب.",
  openDeal: "افتح صفقة",
  haveCode: "لدي رمز",
  openDeals: "الصفقات المفتوحة",
  stillRunning: "لا تزال قائمة",
  waitingOnYou: "تنتظرك",
  yourMoveNext: "دورك القادم",
  unreadMessages: "رسائل غير مقروءة",
  acrossAllDeals: "عبر كل الصفقات",
  referralEarnings: "أرباح الدعوة",
  readyToWithdraw: "جاهز للسحب",
  minimum: (amount: string) => `الحد الأدنى ${amount}`,
  whereDealsStand: "أين تقف صفقاتك",
  everyDealByStage: "كل صفقة كنت جزءًا منها على الإطلاق، حسب المرحلة.",
  yourDeals: "صفقاتك",
  noDealsTitle: "لا صفقات بعد",
  noDealsBody:
    "افتح صفقة وأرسل رمز الدعوة للطرف الآخر، أو انضم إلى صفقة دُعيت إليها. لا شيء يُباع أو يُشترى هنا — تُحضر صفقة اتفقتما عليها بالفعل.",
  notSureLead: "لست متأكدًا ماذا يحدث بعد ذلك؟",
  notSureLink: "اقرأ كيف تعمل الصفقة",
  colReference: "المرجع",
  colAccount: "الحساب",
  colSide: "جانبك",
  colTrade: "الصفقة",
  colStatus: "الحالة",
  sideSeller: "بائع",
  sideBuyer: "مشترٍ",
  yourTurn: "دورك",
  swap: "مبادلة",
  swapCaption: "حساب مقابل حساب",
  youReceived: "استلمت",
  youPaid: "دفعت",
};

export const DASHBOARD_PAGE: Record<Locale, typeof dashboardPageEn> = {
  en: dashboardPageEn,
  ar: dashboardPageAr,
};

// ---------------------------------------------------------------------------
// /admin (hub)
// ---------------------------------------------------------------------------

const adminHubEn = {
  title: "Admin console",
  signedInAs: (email: string) =>
    `Signed in as ${email}. No credentials move without you. Swaps are free — the only money leaving is $2 a deal to promoters, paid on the 1st.`,
  waitingOnYou: "Waiting on you",
  openDisputes: "Open disputes",
  openDisputesCaption: "frozen until you decide",
  promoterApplications: "Promoter applications",
  promoterApplicationsCaption: "waiting to be let in",
  paymentsToConfirm: "Payments to confirm",
  paymentsToConfirmCaption: "buyer says they have paid",
  deliveriesToApprove: "Deliveries to approve",
  deliveriesToApproveCaption: "check the account first",
  withdrawalsToSend: "Withdrawals to send",
  withdrawalsToSendCaption: "money reserved, not yet gone",
  buyersGoneQuiet: "Buyers gone quiet",
  buyersGoneQuietCaption: "past the confirmation window",
  sellersOwingCode: "Sellers owing a code",
  sellersOwingCodeCaption: "buyer cannot finish without it",
  whatQueuesLookLike: "What the queues look like",
  queuesShare: "The same six numbers above, as a share of everything waiting.",
  everyQueueEmpty: "Every queue is empty. Nothing is waiting on you.",
  dealsInFlight: "Deals in flight",
  notYetSettled: "not yet settled",
  users: "Users",
  registeredAccounts: "registered accounts",
  banned: "Banned",
  blockedFromTrading: "blocked from trading",
  howThingsAreRunning: "How things are running",
  dealsRunningWithoutYou: "Deals running without you",
  restInQueues: "The rest are sitting in one of your queues.",
  inFlightDisputed: "In-flight deals disputed",
  disputeFreezes: "A dispute freezes its deal until you decide it.",
  accountsInGoodStanding: "Accounts in good standing",
  bannedCannot: "Banned accounts cannot open or join a deal.",
  sellersAnswered: "Sellers who have answered a code request",
  buyerCannotFinish: "A buyer cannot finish a transfer without it.",
  waitingOnKonami: "Buyers waiting on a Konami code",
  waitingOnKonamiBody: "The buyer has paid and cannot finish the transfer. Only the seller can answer — chase them, oldest first.",
  asked: "asked",
  isWaitingOn: "is waiting on",
  needsAttention: "Needs your attention",
  allDeals: "All deals →",
  dealsNeedingDecision: "Deals needing an admin decision",
  nothingWaitingTitle: "Nothing waiting on you",
  nothingWaitingBody: "No payments to confirm, no deliveries to approve and no disputes open. Deals still in flight are waiting on the two parties, not on you.",
};

const adminHubAr: typeof adminHubEn = {
  title: "لوحة الإدارة",
  signedInAs: (email: string) =>
    `مسجّل الدخول باسم ${email}. لا تتحرك أي بيانات دون علمك. المبادلات مجانية — المال الوحيد الخارج هو 2 دولار لكل صفقة للداعي، يُدفع في الأول من الشهر.`,
  waitingOnYou: "ينتظرك",
  openDisputes: "نزاعات مفتوحة",
  openDisputesCaption: "مجمَّدة حتى تقرر",
  promoterApplications: "طلبات الدعوة",
  promoterApplicationsCaption: "بانتظار القبول",
  paymentsToConfirm: "دفعات للتأكيد",
  paymentsToConfirmCaption: "المشتري يقول إنه دفع",
  deliveriesToApprove: "تسليمات للموافقة",
  deliveriesToApproveCaption: "تحقق من الحساب أولًا",
  withdrawalsToSend: "سحوبات للإرسال",
  withdrawalsToSendCaption: "مال محجوز، لم يُرسل بعد",
  buyersGoneQuiet: "مشترون اختفوا",
  buyersGoneQuietCaption: "تجاوزوا نافذة التأكيد",
  sellersOwingCode: "بائعون مدينون برمز",
  sellersOwingCodeCaption: "لا يستطيع المشتري الإنهاء بدونه",
  whatQueuesLookLike: "شكل قوائم الانتظار",
  queuesShare: "نفس الأرقام الستة أعلاه، كنسبة من كل ما هو منتظر.",
  everyQueueEmpty: "كل قائمة انتظار فارغة. لا شيء ينتظرك.",
  dealsInFlight: "صفقات قائمة",
  notYetSettled: "لم تُسوَّ بعد",
  users: "المستخدمون",
  registeredAccounts: "حسابات مسجَّلة",
  banned: "محظورون",
  blockedFromTrading: "ممنوعون من التداول",
  howThingsAreRunning: "كيف تسير الأمور",
  dealsRunningWithoutYou: "صفقات تسير بدونك",
  restInQueues: "الباقي في إحدى قوائم انتظارك.",
  inFlightDisputed: "صفقات قائمة متنازع عليها",
  disputeFreezes: "النزاع يجمّد صفقته حتى تقرر.",
  accountsInGoodStanding: "حسابات بوضع سليم",
  bannedCannot: "الحسابات المحظورة لا تستطيع فتح صفقة أو الانضمام إليها.",
  sellersAnswered: "بائعون أجابوا طلب رمز",
  buyerCannotFinish: "لا يستطيع المشتري إنهاء النقل بدونه.",
  waitingOnKonami: "مشترون ينتظرون رمز كونامي",
  waitingOnKonamiBody: "دفع المشتري ولا يستطيع إنهاء النقل. البائع وحده يستطيع الإجابة — تابع معهم، الأقدم أولًا.",
  asked: "طلب في",
  isWaitingOn: "ينتظر",
  needsAttention: "يحتاج انتباهك",
  allDeals: "كل الصفقات ←",
  dealsNeedingDecision: "صفقات تحتاج قرار المشرف",
  nothingWaitingTitle: "لا شيء ينتظرك",
  nothingWaitingBody: "لا دفعات للتأكيد، ولا تسليمات للموافقة، ولا نزاعات مفتوحة. الصفقات التي لا تزال قائمة تنتظر الطرفين، لا أنت.",
};

export const ADMIN_HUB: Record<Locale, typeof adminHubEn> = { en: adminHubEn, ar: adminHubAr };

// ---------------------------------------------------------------------------
// admin-deal-columns.tsx
// ---------------------------------------------------------------------------

const adminDealColumnsEn = {
  reference: "Reference",
  sellerToBuyer: "Seller → Buyer",
  account: "Account",
  amount: "Amount",
  status: "Status",
  paySeller: (amount: string) => `pay seller ${amount}`,
  yourCut: (amount: string) => `your cut ${amount}`,
  payoutDue: "payout due",
  buyerOverdue: "buyer overdue",
};

const adminDealColumnsAr: typeof adminDealColumnsEn = {
  reference: "المرجع",
  sellerToBuyer: "البائع ← المشتري",
  account: "الحساب",
  amount: "المبلغ",
  status: "الحالة",
  paySeller: (amount: string) => `ادفع للبائع ${amount}`,
  yourCut: (amount: string) => `نصيبك ${amount}`,
  payoutDue: "دفعة مستحقة",
  buyerOverdue: "المشتري متأخر",
};

export const ADMIN_DEAL_COLUMNS: Record<Locale, typeof adminDealColumnsEn> = {
  en: adminDealColumnsEn,
  ar: adminDealColumnsAr,
};

// ---------------------------------------------------------------------------
// /admin/deals
// ---------------------------------------------------------------------------

const adminDealsPageEn = {
  title: "Deals",
  description: "Every trade on the service.",
  filterNeedsAction: "Needs action",
  filterInFlight: "In flight",
  filterAll: "All",
  searchLabel: "Search deals",
  searchPlaceholder: "Search reference, description or a person's name",
  search: "Search",
  clear: "Clear",
  showingNewest: "Showing the newest 100.",
  dealCount: (n: number) => `${n} deal${n === 1 ? "" : "s"}.`,
  tableCaption: "Deals matching the current filter",
  noMatchTitle: "Nothing matches that search",
  noneInFilterTitle: "Nothing in this filter",
  showAllDeals: "Show all deals",
  tryLead: "Try a reference, part of an account description, or either person's display name.",
  appearHere: "Deals appear here as soon as they reach this stage.",
};

const adminDealsPageAr: typeof adminDealsPageEn = {
  title: "الصفقات",
  description: "كل صفقة على هذه الخدمة.",
  filterNeedsAction: "تحتاج إجراء",
  filterInFlight: "قائمة",
  filterAll: "الكل",
  searchLabel: "ابحث في الصفقات",
  searchPlaceholder: "ابحث بالمرجع أو الوصف أو اسم أحد الطرفين",
  search: "بحث",
  clear: "مسح",
  showingNewest: "عرض أحدث 100.",
  dealCount: (n: number) => `${n} ${n === 1 ? "صفقة" : "صفقات"}.`,
  tableCaption: "الصفقات المطابقة للتصفية الحالية",
  noMatchTitle: "لا شيء يطابق هذا البحث",
  noneInFilterTitle: "لا شيء في هذه التصفية",
  showAllDeals: "أظهر كل الصفقات",
  tryLead: "جرّب مرجعًا، أو جزءًا من وصف الحساب، أو اسم أحد الطرفين.",
  appearHere: "تظهر الصفقات هنا بمجرد وصولها إلى هذه المرحلة.",
};

export const ADMIN_DEALS_PAGE: Record<Locale, typeof adminDealsPageEn> = {
  en: adminDealsPageEn,
  ar: adminDealsPageAr,
};

// ---------------------------------------------------------------------------
// /admin/deals/[id]
// ---------------------------------------------------------------------------

const adminDealDetailEn = {
  swapBadge: "account for account · no money, no fee",
  archivedBadge: (price: string, fee: string, pct: string) => `archived cash deal · ${price} · cut ${fee} (${pct}%)`,
  progress: "Progress",
  history: "History",
  disputeTitle: (reason: string) => `Dispute: ${reason}`,
  openedBy: (name: string) => `Opened by ${name} on`,
  yourDecision: "Your decision",
  theParties: "The parties",
  seller: "Seller",
  buyer: "Buyer",
  sellerPromised: "What the seller promised",
  buyerPromised: "What the buyer promised",
  notDescribed: "Not described.",
  swapNote: "Account-for-account swap — no money, no fee. Both accounts release together.",
  buyerSentTitle: "What the buyer says they sent",
  submitted: "Submitted",
  transaction: "Transaction",
  reference: "Reference",
  whatTheyPaidSnapshot: "What they were told to pay (frozen at submission)",
  step1ConfirmPayment: "1. Confirm the money arrived",
  step2CheckAccount: "2. Check the account works",
  step2Body: "Log in and confirm it matches the description above. This is the only protection the buyer has.",
  revealSeller: "Reveal the seller's account",
  revealAccount: "Reveal the account details",
  decryptNote: "Decrypted only for this request. Not logged, not stored anywhere else.",
  swapCheckBuyerToo: "This is a swap. Check the buyer's account too — both are handed over together.",
  revealBuyer: "Reveal the buyer's account",
  step3Release: "3. Release it to the buyer",
  yourVerificationNote: "Your verification note",
  konamiCodesTitle: "Konami verification codes",
  konamiCodesBody:
    "The buyer cannot finish the transfer without these, and only the seller receives them. If one has gone unanswered, chase the seller — do not invent a code.",
  step4PaySeller: "4. Pay the seller",
  step4Body: (amount: string, name: string) => `The buyer confirmed. Send ${amount} to ${name}, then record it.`,
  settled: "Settled",
  paidOut: (date: string) => `Paid out ${date}`,
  ref: "ref",
  somethingWrong: "Something went wrong?",
  override: "Override",
  stalledDeal: "Stalled deal",
  messages: "Messages",
  messagesBody: "Everything the two parties have said, plus your internal notes. Notes marked internal are never shown to them.",
  theSeller: "the seller",
  theBuyer: "the buyer",
};

const adminDealDetailAr: typeof adminDealDetailEn = {
  swapBadge: "حساب مقابل حساب · بلا مال ولا رسوم",
  archivedBadge: (price: string, fee: string, pct: string) => `صفقة نقدية مؤرشفة · ${price} · العمولة ${fee} (${pct}٪)`,
  progress: "التقدّم",
  history: "السجل",
  disputeTitle: (reason: string) => `نزاع: ${reason}`,
  openedBy: (name: string) => `فتحه ${name} في`,
  yourDecision: "قرارك",
  theParties: "الطرفان",
  seller: "البائع",
  buyer: "المشتري",
  sellerPromised: "ما وعد به البائع",
  buyerPromised: "ما وعد به المشتري",
  notDescribed: "لم يُوصف.",
  swapNote: "مبادلة حساب مقابل حساب — بلا مال ولا رسوم. يُسلَّم الحسابان معًا.",
  buyerSentTitle: "ما يقول المشتري إنه أرسله",
  submitted: "أُرسل في",
  transaction: "المعاملة",
  reference: "المرجع",
  whatTheyPaidSnapshot: "ما طُلب منه دفعه (مجمَّد وقت الإرسال)",
  step1ConfirmPayment: "١. أكِّد وصول المال",
  step2CheckAccount: "٢. تحقق من أن الحساب يعمل",
  step2Body: "سجّل الدخول وتأكد من مطابقته للوصف أعلاه. هذا هو الحماية الوحيدة للمشتري.",
  revealSeller: "أظهر حساب البائع",
  revealAccount: "أظهر تفاصيل الحساب",
  decryptNote: "فُكّ تشفيره لهذا الطلب فقط. لا يُسجَّل ولا يُخزَّن في أي مكان آخر.",
  swapCheckBuyerToo: "هذه مبادلة. تحقق من حساب المشتري أيضًا — يُسلَّم الحسابان معًا.",
  revealBuyer: "أظهر حساب المشتري",
  step3Release: "٣. سلّمه للمشتري",
  yourVerificationNote: "ملاحظة التحقق الخاصة بك",
  konamiCodesTitle: "رموز تحقق كونامي",
  konamiCodesBody: "لا يستطيع المشتري إنهاء النقل بدون هذه، ولا يستلمها إلا البائع. إن بقي أحدها بلا رد، تابع مع البائع — لا تخترع رمزًا.",
  step4PaySeller: "٤. ادفع للبائع",
  step4Body: (amount: string, name: string) => `أكّد المشتري. أرسل ${amount} إلى ${name}، ثم سجّل ذلك.`,
  settled: "مُسوّاة",
  paidOut: (date: string) => `دُفعت في ${date}`,
  ref: "المرجع",
  somethingWrong: "حدث خطأ ما؟",
  override: "تجاوز",
  stalledDeal: "صفقة متعثّرة",
  messages: "الرسائل",
  messagesBody: "كل ما قاله الطرفان، بالإضافة إلى ملاحظاتك الداخلية. الملاحظات المُعلَّمة كداخلية لا تُعرض لهما أبدًا.",
  theSeller: "البائع",
  theBuyer: "المشتري",
};

export const ADMIN_DEAL_DETAIL: Record<Locale, typeof adminDealDetailEn> = {
  en: adminDealDetailEn,
  ar: adminDealDetailAr,
};

// ---------------------------------------------------------------------------
// /admin/disputes
// ---------------------------------------------------------------------------

const adminDisputesPageEn = {
  title: "Disputes",
  description: "A dispute freezes the deal. Nothing moves until you decide it.",
  filterOpen: "Open",
  filterAll: "All, including resolved",
  captionOpen: "Open disputes",
  captionAll: "Every dispute",
  noOpenTitle: "No open disputes",
  noOpenBody:
    "Everything is running itself. A dispute freezes its deal the moment either side opens one, so an empty list here means no money is stuck.",
  noneYetTitle: "No disputes yet",
  noneYetBody: "Nobody has ever opened one. This list keeps resolved cases too, so it will not stay empty once one is decided.",
  colReference: "Reference",
  colReason: "Reason",
  colOpenedBy: "Opened by",
  colParties: "Seller → Buyer",
  colAmount: "Amount",
  colStatus: "Status",
  statusOpen: "open",
  statusUnderReview: "under review",
  statusResolvedBuyer: "refunded the buyer",
  statusResolvedSeller: "paid the seller",
  statusCancelled: "withdrawn",
};

const adminDisputesPageAr: typeof adminDisputesPageEn = {
  title: "النزاعات",
  description: "النزاع يجمّد الصفقة. لا شيء يتحرك حتى تقرر.",
  filterOpen: "مفتوحة",
  filterAll: "الكل، بما فيها المحسومة",
  captionOpen: "النزاعات المفتوحة",
  captionAll: "كل نزاع",
  noOpenTitle: "لا نزاعات مفتوحة",
  noOpenBody: "كل شيء يسير من تلقاء نفسه. النزاع يجمّد صفقته لحظة فتح أي طرف له، فقائمة فارغة هنا تعني ألا مال عالق.",
  noneYetTitle: "لا نزاعات بعد",
  noneYetBody: "لم يفتح أحد نزاعًا قط. هذه القائمة تحتفظ بالحالات المحسومة أيضًا، فلن تبقى فارغة بمجرد أن تُحسم واحدة.",
  colReference: "المرجع",
  colReason: "السبب",
  colOpenedBy: "فتحه",
  colParties: "البائع ← المشتري",
  colAmount: "المبلغ",
  colStatus: "الحالة",
  statusOpen: "مفتوح",
  statusUnderReview: "قيد المراجعة",
  statusResolvedBuyer: "استُرد للمشتري",
  statusResolvedSeller: "دُفع للبائع",
  statusCancelled: "سُحب",
};

export const ADMIN_DISPUTES_PAGE: Record<Locale, typeof adminDisputesPageEn> = {
  en: adminDisputesPageEn,
  ar: adminDisputesPageAr,
};

// ---------------------------------------------------------------------------
// /admin/users
// ---------------------------------------------------------------------------

const adminUsersPageEn = {
  title: "Users",
  description: "Banning takes effect on the person's next request — the session is re-checked against the database, not trusted.",
  searchLabel: "Search users",
  searchPlaceholder: "Search name or email",
  search: "Search",
  clear: "Clear",
  caption: "Registered accounts",
  noMatchTitle: "Nobody matches that search",
  noUsersTitle: "No users yet",
  clearSearch: "Clear the search",
  tryLead: "Try part of a display name or an email address.",
  appearHere: "Accounts appear here as soon as somebody registers.",
  colUser: "User",
  colReputation: "Reputation",
  colActivity: "Activity",
  colInFlight: "In flight",
  colActions: "Actions",
  admin: "admin",
  banned: "banned",
  sold: "sold",
  bought: "bought",
  joined: "joined",
  deal: (n: number) => `${n} deal${n === 1 ? "" : "s"}`,
  theirDeals: "Their deals",
  adminsCannotBeBanned: "admins cannot be banned",
  bannedOn: (date: string, reason: string) => `Banned ${date}: ${reason}`,
};

const adminUsersPageAr: typeof adminUsersPageEn = {
  title: "المستخدمون",
  description: "يسري الحظر عند الطلب التالي للشخص — تُعاد فحص الجلسة من قاعدة البيانات، لا الوثوق بها.",
  searchLabel: "ابحث عن مستخدمين",
  searchPlaceholder: "ابحث بالاسم أو البريد",
  search: "بحث",
  clear: "مسح",
  caption: "الحسابات المسجَّلة",
  noMatchTitle: "لا أحد يطابق هذا البحث",
  noUsersTitle: "لا مستخدمون بعد",
  clearSearch: "امسح البحث",
  tryLead: "جرّب جزءًا من الاسم المعروض أو عنوان البريد.",
  appearHere: "تظهر الحسابات هنا بمجرد أن يسجّل أحد.",
  colUser: "المستخدم",
  colReputation: "التقييم",
  colActivity: "النشاط",
  colInFlight: "قائمة",
  colActions: "الإجراءات",
  admin: "مشرف",
  banned: "محظور",
  sold: "باع",
  bought: "اشترى",
  joined: "انضم في",
  deal: (n: number) => `${n} ${n === 1 ? "صفقة" : "صفقات"}`,
  theirDeals: "صفقاته",
  adminsCannotBeBanned: "لا يمكن حظر المشرفين",
  bannedOn: (date: string, reason: string) => `حُظر في ${date}: ${reason}`,
};

export const ADMIN_USERS_PAGE: Record<Locale, typeof adminUsersPageEn> = {
  en: adminUsersPageEn,
  ar: adminUsersPageAr,
};

// ---------------------------------------------------------------------------
// /admin/withdrawals
// ---------------------------------------------------------------------------

const adminWithdrawalsPageEn = {
  title: "Withdrawals",
  description:
    "Promoters taking their referral earnings off the site. Payouts go out in one batch on the 1st of each month — you send the money by hand, then record it here.",
  waitingOnYou: "Waiting on you",
  everything: "Everything",
  noPayoutsWaitingTitle: "No payouts waiting",
  noPayoutsWaitingBody:
    "Nobody is owed a transfer right now. Requested money stays reserved against the promoter's balance until you send or refuse it, so an empty list means nothing is held up.",
  noPayoutsYetTitle: "No payouts requested yet",
  noPayoutsYetBody: "A promoter can request one once their referral earnings reach $40.",
  sendItTo: "Send it to",
  requested: "Requested",
  closed: "closed",
  reference: "Reference: ",
  reason: "Reason: ",
  negativeBalance: (amount: string) =>
    `This promoter's balance is ${amount} — a deal they earned from was reversed after they withdrew. Do not send this without checking why.`,
  concentrationWarning: (pct: number) =>
    `${pct}% of this promoter's earnings came from a single person. Worth checking those deals were real before sending.`,
  statusRequested: "Waiting on you",
  statusSent: "Sent",
  statusRejected: "Refused",
  statusCancelled: "Cancelled by promoter",
  methodCrypto: "Crypto",
  methodBankTransfer: "Bank transfer",
  methodCard: "Card / wallet",
  methodGiftCard: "Gift card",
};

const adminWithdrawalsPageAr: typeof adminWithdrawalsPageEn = {
  title: "السحوبات",
  description:
    "الداعون يسحبون أرباح الدعوة من الموقع. تُرسل الدفعات دفعة واحدة في الأول من كل شهر — ترسل المال يدويًا، ثم تسجّله هنا.",
  waitingOnYou: "ينتظرك",
  everything: "الكل",
  noPayoutsWaitingTitle: "لا دفعات منتظرة",
  noPayoutsWaitingBody: "لا أحد مستحق تحويل الآن. المال المطلوب يبقى محجوزًا مقابل رصيد الداعي حتى ترسله أو ترفضه، فقائمة فارغة هنا تعني ألا شيء معلّق.",
  noPayoutsYetTitle: "لا دفعات مطلوبة بعد",
  noPayoutsYetBody: "يمكن للداعي طلب دفعة بمجرد أن تبلغ أرباح الدعوة 40 دولارًا.",
  sendItTo: "أرسلها إلى",
  requested: "طُلبت في",
  closed: "أُغلقت في",
  reference: "المرجع: ",
  reason: "السبب: ",
  negativeBalance: (amount: string) =>
    `رصيد هذا الداعي ${amount} — أُلغيت صفقة ربح منها بعد أن سحب. لا ترسل هذا دون التحقق من السبب.`,
  concentrationWarning: (pct: number) =>
    `${pct}٪ من أرباح هذا الداعي جاءت من شخص واحد. يستحق التحقق من أن تلك الصفقات حقيقية قبل الإرسال.`,
  statusRequested: "ينتظرك",
  statusSent: "أُرسلت",
  statusRejected: "مرفوضة",
  statusCancelled: "ألغاها الداعي",
  methodCrypto: "عملة رقمية",
  methodBankTransfer: "تحويل بنكي",
  methodCard: "بطاقة / محفظة",
  methodGiftCard: "بطاقة هدايا",
};

export const ADMIN_WITHDRAWALS_PAGE: Record<Locale, typeof adminWithdrawalsPageEn> = {
  en: adminWithdrawalsPageEn,
  ar: adminWithdrawalsPageAr,
};

// ---------------------------------------------------------------------------
// /admin/promoters
// ---------------------------------------------------------------------------

const adminPromotersPageEn = {
  title: "Promoter applications",
  description: "People asking to be let in to advertise the service. Approving creates an account that can share a code and collect earnings, but cannot trade.",
  waitingOnYou: "Waiting on you",
  everything: "Everything",
  noneWaitingTitle: "No applications waiting",
  noneWaitingBodyLead: "Nobody is waiting to hear back. Applications arrive from",
  noneWaitingBodyTail: ", which is the only way onto this site without somebody's code.",
  noneYetTitle: "No applications yet",
  noneYetBodyLead: "Nobody has applied at",
  noneYetBodyTail: "yet. Link it wherever you talk to people who might promote the service.",
  applied: "applied",
  wherePromote: "Where they would promote it",
  note: "Note: ",
  reason: "Reason: ",
  decided: "Decided",
  by: "by",
  theirAccount: "their account",
  statusPending: "Waiting on you",
  statusApproved: "Approved",
  statusRejected: "Refused",
};

const adminPromotersPageAr: typeof adminPromotersPageEn = {
  title: "طلبات الدعوة",
  description: "أشخاص يطلبون السماح لهم بالترويج للخدمة. الموافقة تنشئ حسابًا يستطيع مشاركة رمز وجمع الأرباح، لكن لا يستطيع التداول.",
  waitingOnYou: "ينتظرك",
  everything: "الكل",
  noneWaitingTitle: "لا طلبات منتظرة",
  noneWaitingBodyLead: "لا أحد ينتظر ردًا. الطلبات تصل من",
  noneWaitingBodyTail: "، وهي الطريقة الوحيدة للدخول إلى هذا الموقع بلا رمز من أحد.",
  noneYetTitle: "لا طلبات بعد",
  noneYetBodyLead: "لم يتقدّم أحد على",
  noneYetBodyTail: "بعد. شاركه أينما تتحدث مع من قد يروّج للخدمة.",
  applied: "تقدّم في",
  wherePromote: "أين سيروّج لها",
  note: "ملاحظة: ",
  reason: "السبب: ",
  decided: "تقرر في",
  by: "بواسطة",
  theirAccount: "حسابه",
  statusPending: "ينتظرك",
  statusApproved: "مقبول",
  statusRejected: "مرفوض",
};

export const ADMIN_PROMOTERS_PAGE: Record<Locale, typeof adminPromotersPageEn> = {
  en: adminPromotersPageEn,
  ar: adminPromotersPageAr,
};

// ---------------------------------------------------------------------------
// /admin/payment-methods
// ---------------------------------------------------------------------------

const adminPaymentMethodsPageEn = {
  title: "Payment methods",
  description: "What buyers are told to pay to. There is no gateway — you check the wallet or bank account yourself and confirm each payment by hand.",
  placeholderWarning: "The seeded addresses are placeholders. Replace them with your own before taking real money — a buyer paying a placeholder address loses their funds permanently.",
  noneYetTitle: "No payment methods yet",
  noneYetBody: "Until one is active, a buyer opening a deal has nowhere to send money. Add your first below.",
  addMethod: "Add a method",
};

const adminPaymentMethodsPageAr: typeof adminPaymentMethodsPageEn = {
  title: "طرق الدفع",
  description: "إلى أين يُطلب من المشترين الدفع. لا توجد بوابة دفع — تتحقق من المحفظة أو الحساب البنكي بنفسك وتؤكد كل دفعة يدويًا.",
  placeholderWarning: "العناوين المزروعة مؤقتة. استبدلها بعناوينك الحقيقية قبل استقبال مال حقيقي — المشتري الذي يدفع لعنوان مؤقت يفقد ماله نهائيًا.",
  noneYetTitle: "لا طرق دفع بعد",
  noneYetBody: "حتى تُفعَّل طريقة، لا مكان يرسل إليه المشتري الذي يفتح صفقة المال. أضف أول طريقة أدناه.",
  addMethod: "أضف طريقة",
};

export const ADMIN_PAYMENT_METHODS_PAGE: Record<Locale, typeof adminPaymentMethodsPageEn> = {
  en: adminPaymentMethodsPageEn,
  ar: adminPaymentMethodsPageAr,
};

// ---------------------------------------------------------------------------
// /admin/demo-data
// ---------------------------------------------------------------------------

const adminDemoDataPageEn = {
  title: "Demo data",
  description: "Accounts invented by the seed or the deal bot, and everything they produced. Fabricated reviews on a trust service are the one failure that cannot be walked back — this is how you remove them.",
  cleanTitle: "No demo data on this database",
  cleanBody: "Nothing here was invented by the seed or the bot. Every review on the site came from a real account.",
  servingFabricated: (n: number) => `This database is serving ${n} fabricated review${n === 1 ? "" : "s"}.`,
  fabricatedBody: "They were written by accounts that do not belong to anyone, about deals that never happened, and several describe paying money — which this service no longer does. Anyone who reads the product pages and then the reviews will notice.",
  inventedAccounts: "Invented accounts",
  deals: "Deals",
  reviews: "Reviews",
  referralCredits: "Referral credits",
  sampleTitle: "A few of the reviews this would remove",
  realAtRisk: (n: number) => `${n} of these reviews were written by an account that is`,
  realAtRiskTail: "not demo data. Check those before deleting — they may be genuine.",
  survivesTitle: "What survives",
  survivesBody: (reviews: number, deals: number) =>
    `${reviews} review${reviews === 1 ? "" : "s"} and ${deals} completed deal${deals === 1 ? "" : "s"} from real accounts.`,
  zeroSurvives: "That is zero — and an empty reviews page you can defend beats a full one you cannot. Being visibly new is survivable; being caught inventing a track record is not.",
  keptRegardless: "Kept regardless:",
  keptRegardlessTail: "— an admin account is never deleted here. Losing the only one locks the console permanently.",
  howRecognisedTitle: "How demo data is recognised",
  howRecognisedBody: "By email domain, not by guesswork. Everything the seed and the bot create lives on a reserved domain that can never resolve to a real inbox:",
  terminalNote: "The same check runs from a terminal as",
  terminalNoteMid: ", which reports without deleting unless you pass",
  terminalNoteTail: ". To stop this happening again, never run",
  terminalNoteTail2: "or",
  terminalNoteTail3: "with",
  terminalNoteTail4: "against the live database.",
  seeReviews: "See what the public reviews page currently shows",
};

const adminDemoDataPageAr: typeof adminDemoDataPageEn = {
  title: "بيانات تجريبية",
  description: "حسابات اختلقها البذر أو بوت الصفقات، وكل ما أنتجته. التقييمات المُختلقة في خدمة ثقة هي الفشل الوحيد الذي لا يمكن التراجع عنه — هذه طريقة إزالتها.",
  cleanTitle: "لا بيانات تجريبية في هذه القاعدة",
  cleanBody: "لا شيء هنا اختلقه البذر أو البوت. كل تقييم على الموقع جاء من حساب حقيقي.",
  servingFabricated: (n: number) => `تعرض قاعدة البيانات هذه ${n} ${n === 1 ? "تقييمًا مُختلقًا" : "تقييمات مُختلقة"}.`,
  fabricatedBody: "كتبتها حسابات لا تخص أحدًا، عن صفقات لم تحدث قط، ويصف عدد منها دفع مال — وهو ما لم تعد هذه الخدمة تفعله. أي شخص يقرأ صفحات المنتج ثم التقييمات سيلاحظ ذلك.",
  inventedAccounts: "حسابات مختلقة",
  deals: "صفقات",
  reviews: "تقييمات",
  referralCredits: "أرصدة الدعوة",
  sampleTitle: "بعض التقييمات التي سيزيلها هذا",
  realAtRisk: (n: number) => `${n} من هذه التقييمات كتبها حساب`,
  realAtRiskTail: "ليس بيانات تجريبية. تحقق منها قبل الحذف — قد تكون حقيقية.",
  survivesTitle: "ما سيبقى",
  survivesBody: (reviews: number, deals: number) =>
    `${reviews} ${reviews === 1 ? "تقييم" : "تقييمات"} و${deals} ${deals === 1 ? "صفقة مكتملة" : "صفقات مكتملة"} من حسابات حقيقية.`,
  zeroSurvives: "هذا صفر — وصفحة تقييمات فارغة تستطيع الدفاع عنها أفضل من صفحة ممتلئة لا تستطيع. أن تكون جديدًا بوضوح أمر يمكن تحمّله؛ أن يُضبط اختلاقك سجلًا فلا.",
  keptRegardless: "يبقى دائمًا:",
  keptRegardlessTail: "— حساب المشرف لا يُحذف هنا أبدًا. فقدان الوحيد منه يقفل لوحة الإدارة نهائيًا.",
  howRecognisedTitle: "كيف تُعرف البيانات التجريبية",
  howRecognisedBody: "بنطاق البريد، لا بالتخمين. كل ما ينشئه البذر والبوت يعيش على نطاق محجوز لا يمكن أن يصل أبدًا إلى بريد حقيقي:",
  terminalNote: "نفس الفحص يعمل من الطرفية باسم",
  terminalNoteMid: "، والذي يُبلغ دون حذف إلا إذا مررت",
  terminalNoteTail: ". لمنع تكرار هذا، لا تشغّل أبدًا",
  terminalNoteTail2: "أو",
  terminalNoteTail3: "مع",
  terminalNoteTail4: "على قاعدة البيانات الحية.",
  seeReviews: "اطّلع على ما تعرضه صفحة التقييمات العامة حاليًا",
};

export const ADMIN_DEMO_DATA_PAGE: Record<Locale, typeof adminDemoDataPageEn> = {
  en: adminDemoDataPageEn,
  ar: adminDemoDataPageAr,
};
