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
    "Both sides are exposed in a normal account trade: whoever goes first can be robbed. Escrow removes that by holding each half until the other is proven.",

  costTitle: "What it costs",
  costFee:
    "taken out of the seller's payout. The buyer pays exactly the agreed price — never more. The exact split is shown on the deal before either side commits, and it is locked in when the deal is opened, so changing the rate later cannot alter a deal already in progress.",
  costFeePrefix: "The escrow fee is",
  costFree: "There is currently no escrow fee. The seller receives exactly what the buyer paid.",

  wrongTitle: "If something goes wrong",
  wrongBody:
    "Either side can open a dispute from the deal page once money is involved. That freezes everything immediately — no credentials, no payout — and opens a case for the admin, who decides from the record: the frozen payment details, the verification note, and the whole conversation on the deal.",
  wrongBefore:
    "Before any money moves, there is no dispute to have: either party can simply cancel and walk away.",

  rulesTitle: "Rules that protect you",
  rules: [
    "Never send account details or money outside a deal. If it is not on this site, the admin cannot help you and there is no record.",
    "Check the terms on the invite before you join. If the price or the account is not what you agreed, do not join.",
    "Buyers: change the email and password the moment you get the account, then confirm. The confirmation window exists for you, not against you.",
    "Sellers: do not touch the account after depositing it. Recovering an account you have sold is the fastest way to lose a dispute.",
    "Sellers: stay reachable until the buyer confirms. Konami sends the transfer code to your inbox, and the buyer cannot finish without it — going quiet at that point is what turns a normal deal into a dispute.",
  ],

  ctaStart: "Start a deal",
  ctaFaq: "Read the FAQ",
  unsure: "Still unsure?",
  getInTouch: "Get in touch",
  beforeSending: "before you send anything.",
};

const howItWorksAr: typeof howItWorksEn = {
  title: "كيف تعمل الخدمة",
  intro:
    "في أي صفقة حساب عادية يكون الطرفان مكشوفين: من يتحرك أولًا يمكن أن يُسرق. الضمان يلغي ذلك باحتجاز كل نصف حتى يثبت النصف الآخر.",

  costTitle: "التكلفة",
  costFeePrefix: "رسوم الضمان هي",
  costFee:
    "تُخصم من مستحقات البائع. ويدفع المشتري السعر المتفق عليه بالضبط — لا أكثر. يُعرض التقسيم الدقيق على صفحة الصفقة قبل أن يلتزم أي طرف، ويُثبَّت عند فتح الصفقة، فتغيير النسبة لاحقًا لا يمكن أن يمس صفقة جارية.",
  costFree: "لا توجد رسوم ضمان حاليًا. يستلم البائع بالضبط ما دفعه المشتري.",

  wrongTitle: "إذا حدث خطأ ما",
  wrongBody:
    "يستطيع أي طرف فتح نزاع من صفحة الصفقة بمجرد دخول المال. هذا يجمّد كل شيء فورًا — لا بيانات دخول، ولا دفع — ويفتح قضية للمشرف، الذي يحكم من السجل: تفاصيل الدفع المجمَّدة، وملاحظة التحقق، وكامل المحادثة على الصفقة.",
  wrongBefore:
    "قبل أن يتحرك أي مال، لا يوجد نزاع أصلًا: يستطيع أي طرف ببساطة أن يلغي وينصرف.",

  rulesTitle: "قواعد تحميك",
  rules: [
    "لا ترسل أبدًا بيانات حساب أو مالًا خارج الصفقة. إن لم يكن على هذا الموقع، فلا يستطيع المشرف مساعدتك ولا يوجد سجل.",
    "راجع الشروط في الدعوة قبل الانضمام. إذا لم يكن السعر أو الحساب كما اتفقتما، فلا تنضم.",
    "المشترون: غيّروا البريد وكلمة المرور فور استلام الحساب، ثم أكِّدوا. نافذة التأكيد موجودة لصالحكم لا ضدكم.",
    "البائعون: لا تمسّوا الحساب بعد إيداعه. استرجاع حساب بعته هو أسرع طريق لخسارة النزاع.",
    "البائعون: ابقوا متاحين حتى يؤكد المشتري. ترسل كونامي رمز النقل إلى بريدكم، ولا يستطيع المشتري إنهاء العملية بدونه — والاختفاء عند هذه النقطة هو ما يحوّل صفقة عادية إلى نزاع.",
  ],

  ctaStart: "ابدأ صفقة",
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
