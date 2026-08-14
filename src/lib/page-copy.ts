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
