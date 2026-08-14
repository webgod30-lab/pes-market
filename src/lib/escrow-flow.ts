// The seven steps of a deal, written once, in both languages.
//
// This existed twice: as STEPS on /how-it-works and as FLOW on the landing
// page, each with its own wording for the same seven steps and its own field
// names. Two descriptions of one process drift, and when they do the site
// contradicts itself about how its own escrow works.
//
// Each step carries both a long and a short body. The landing page shows the
// short one in a compact card; /how-it-works shows the long one, because
// someone on that page has come to read it.
//
// Nothing here may import from lib/deals: this module is read by client
// components, and lib/deals pulls in Prisma. The confirmation window lives here
// for the same reason — it is quoted in marketing copy far more often than it
// is used in a query, and lib/deals re-exports it for the server code.
import type { Locale } from "@/lib/locale";

/**
 * How long the buyer has to confirm or dispute after credentials are released.
 *
 * Defined here rather than in lib/deals so client components and static copy
 * can quote it without dragging the database layer into the browser bundle.
 */
export const CONFIRMATION_WINDOW_HOURS = 48;

export type EscrowStep = {
  n: number;
  /** Whose move it is. */
  who: string;
  title: string;
  /** One line, for the landing page. */
  short: string;
  /** The full explanation, for /how-it-works. */
  long: string;
};

const en: EscrowStep[] = [
  {
    n: 1,
    who: "Both of you",
    title: "Agree the swap first",
    short: "Which account goes each way is settled between you two, wherever you already talk.",
    long: "Which account goes each way, and what is included on each. That happens wherever you already talk — Discord, WhatsApp, a forum. Nothing is listed or sold on this site.",
  },
  {
    n: 2,
    who: "Either of you",
    title: "Open the swap and send the code",
    short: "Whoever goes first records both accounts and gets a single-use invite code.",
    long: "Whoever goes first describes both accounts — theirs and the one they expect back — and gets a single-use invite code. The other person opens it, sees exactly those terms, and joins.",
  },
  {
    n: 3,
    who: "Both of you",
    title: "Deposit both accounts",
    short: "Each login goes in encrypted. Neither of you can see the other's yet.",
    long: "Each login goes in encrypted, and neither of you can see the other's. This is the step that removes the risk: nobody has to go first, because the service is holding both halves before either is released.",
  },
  {
    n: 4,
    who: "Admin",
    title: "Verify both, then release together",
    short: "Both accounts are checked against their descriptions before either is handed over.",
    long: "The admin logs into both accounts, checks each matches what was promised, records what they found, and only then releases them — to each other, at the same moment. One side cannot receive without the other.",
  },
  {
    n: 5,
    who: "Both of you",
    title: "Pass on the Konami codes",
    short: "Konami sends each transfer code to the old owner. They are handed over here, on the record.",
    long: "Changing the email makes Konami send a verification code to the address still on that account — the other person's. You each paste yours on the deal page as soon as it arrives. Neither of you can finish without the other doing this.",
  },
  {
    n: 6,
    who: "Both of you",
    title: "Claim it, then confirm",
    short: "Change the email and password, check it is really yours, then confirm.",
    long: `Change the email and password, check the account is really yours, then confirm. You each have ${CONFIRMATION_WINDOW_HOURS} hours. The swap closes only once both of you have confirmed.`,
  },
];

const ar: EscrowStep[] = [
  {
    n: 1,
    who: "أنتما معًا",
    title: "اتفقا على المبادلة أولًا",
    short: "أي حساب يذهب في كل اتجاه يُتفق عليه بينكما، حيث تتحدثان أصلًا.",
    long: "أي حساب يذهب في كل اتجاه، وما يشمله كل منهما. هذا يحدث حيث تتحدثان أصلًا — ديسكورد، واتساب، أو منتدى. لا يُعرض ولا يُباع أي شيء على هذا الموقع.",
  },
  {
    n: 2,
    who: "أي منكما",
    title: "افتح المبادلة وأرسل الرمز",
    short: "من يبدأ أولًا يسجّل الحسابين ويحصل على رمز دعوة يُستخدم مرة واحدة.",
    long: "من يبدأ أولًا يصف الحسابين — حسابه والحساب الذي يتوقعه في المقابل — ويحصل على رمز دعوة يُستخدم مرة واحدة. يفتحه الطرف الآخر، فيرى تلك الشروط بالضبط، ثم ينضم.",
  },
  {
    n: 3,
    who: "أنتما معًا",
    title: "أودِعا الحسابين",
    short: "كل بيانات دخول تُحفظ مشفَّرة. ولا يرى أي منكما حساب الآخر بعد.",
    long: "كل بيانات دخول تُحفظ مشفَّرة، ولا يرى أي منكما حساب الآخر. هذه هي الخطوة التي تزيل الخطر: لا أحد مضطر أن يبدأ أولًا، لأن الخدمة تحتفظ بالنصفين قبل تسليم أي منهما.",
  },
  {
    n: 4,
    who: "المشرف",
    title: "التحقق من الحسابين ثم تسليمهما معًا",
    short: "يُفحص الحسابان مقابل وصفيهما قبل تسليم أي منهما.",
    long: "يسجّل المشرف الدخول إلى الحسابين، ويتحقق من مطابقة كل منهما لما وُعد به، ويدوّن ما وجده، وعندها فقط يسلّمهما — كل واحد إلى الآخر، في اللحظة نفسها. لا يستطيع طرف أن يستلم دون الآخر.",
  },
  {
    n: 5,
    who: "أنتما معًا",
    title: "مرِّرا رموز كونامي",
    short: "ترسل كونامي كل رمز نقل إلى المالك السابق. ويُسلَّم هنا، ضمن السجل.",
    long: "تغيير البريد يجعل كونامي ترسل رمز تحقق إلى العنوان المسجَّل على ذلك الحساب — أي بريد الطرف الآخر. يلصق كل منكما رمزه في صفحة الصفقة فور وصوله. ولا يستطيع أي منكما إنهاء العملية دون أن يفعل الآخر ذلك.",
  },
  {
    n: 6,
    who: "أنتما معًا",
    title: "استلماه ثم أكِّدا",
    short: "غيّر البريد وكلمة المرور، وتأكد أنه أصبح لك فعلًا، ثم أكِّد.",
    long: `غيّر البريد وكلمة المرور، وتأكد أن الحساب أصبح لك فعلًا، ثم أكِّد. أمام كل منكما ${CONFIRMATION_WINDOW_HOURS} ساعة. ولا تُغلق المبادلة إلا بعد أن يؤكد كلاكما.`,
  },
];

const STEPS: Record<Locale, EscrowStep[]> = { en, ar };

export function escrowSteps(locale: Locale = "en"): EscrowStep[] {
  return STEPS[locale];
}

/** The English steps, for callers that have no locale to hand. */
export const ESCROW_STEPS = en;
