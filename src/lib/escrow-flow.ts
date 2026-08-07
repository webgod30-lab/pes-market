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
    title: "Agree the deal first",
    short: "Account and price are settled between you two, wherever you already talk.",
    long: "Account, price, what is included. That happens wherever you already talk — Discord, WhatsApp, a forum. Nothing is sold on this site.",
  },
  {
    n: 2,
    who: "Either of you",
    title: "Open the deal and send the code",
    short: "Whoever goes first records the terms and gets a single-use invite code.",
    long: "Whoever goes first records the account and the agreed price, and gets a single-use invite code. The other person opens it, sees exactly those terms, and joins.",
  },
  {
    n: 3,
    who: "Seller",
    title: "Deposit the account",
    short: "The login goes in encrypted. The buyer cannot see any of it yet.",
    long: "The login goes in encrypted. The buyer cannot see any of it. You can still correct a typo right up until the buyer pays — after that it is frozen.",
  },
  {
    n: 4,
    who: "Buyer",
    title: "Pay into escrow",
    short: "The money goes to the admin, not the seller. Nothing has moved yet.",
    long: "The money goes to the admin, not the seller. Until it is confirmed, nothing has happened and nobody is out of pocket.",
  },
  {
    n: 5,
    who: "Admin",
    title: "Verify, then release",
    short: "The account is checked against what was promised before anything is handed over.",
    long: "The admin logs into the account and checks it matches what was promised, records what they found, and only then hands the login to the buyer.",
  },
  {
    n: 6,
    who: "Seller",
    title: "Pass on the Konami code",
    short: "Konami sends the transfer code to your inbox. It is handed over here, on the record.",
    long: "Changing the email makes Konami send a verification code to the address still on the account — yours. Paste it on the deal page as soon as it arrives. You are not paid until the buyer is through this.",
  },
  {
    n: 7,
    who: "Buyer",
    title: "Claim it, then confirm",
    short: "Change the email and password, check it is really yours, then confirm.",
    long: `Change the email and password, check the account is really yours, then confirm. You have ${CONFIRMATION_WINDOW_HOURS} hours. The seller is paid only after you confirm.`,
  },
];

const ar: EscrowStep[] = [
  {
    n: 1,
    who: "أنتما معًا",
    title: "اتفقا على الصفقة أولًا",
    short: "الحساب والسعر يُتفق عليهما بينكما، حيث تتحدثان أصلًا.",
    long: "الحساب، السعر، وما يشمله. هذا يحدث حيث تتحدثان أصلًا — ديسكورد، واتساب، أو منتدى. لا يُباع أي شيء على هذا الموقع.",
  },
  {
    n: 2,
    who: "أي منكما",
    title: "افتح الصفقة وأرسل الرمز",
    short: "من يبدأ أولًا يسجّل الشروط ويحصل على رمز دعوة يُستخدم مرة واحدة.",
    long: "من يبدأ أولًا يسجّل الحساب والسعر المتفق عليه، ويحصل على رمز دعوة يُستخدم مرة واحدة. يفتحه الطرف الآخر، فيرى تلك الشروط بالضبط، ثم ينضم.",
  },
  {
    n: 3,
    who: "البائع",
    title: "أودِع الحساب",
    short: "بيانات الدخول تُحفظ مشفَّرة. لا يستطيع المشتري رؤية أي منها بعد.",
    long: "بيانات الدخول تُحفظ مشفَّرة. لا يستطيع المشتري رؤية أي منها. ويمكنك تصحيح أي خطأ مطبعي حتى لحظة دفع المشتري — بعدها تُجمَّد.",
  },
  {
    n: 4,
    who: "المشتري",
    title: "ادفع إلى الضمان",
    short: "المال يذهب إلى المشرف، لا إلى البائع. لم يتحرك شيء بعد.",
    long: "المال يذهب إلى المشرف، لا إلى البائع. وحتى يتم تأكيده، لم يحدث شيء ولم يخسر أحد شيئًا.",
  },
  {
    n: 5,
    who: "المشرف",
    title: "التحقق ثم التسليم",
    short: "يُفحص الحساب مقابل ما وُعد به قبل تسليم أي شيء.",
    long: "يسجّل المشرف الدخول إلى الحساب ويتحقق من مطابقته لما وُعد به، ويدوّن ما وجده، وعندها فقط يسلّم بيانات الدخول إلى المشتري.",
  },
  {
    n: 6,
    who: "البائع",
    title: "مرِّر رمز كونامي",
    short: "ترسل كونامي رمز النقل إلى بريدك. ويُسلَّم هنا، ضمن السجل.",
    long: "تغيير البريد يجعل كونامي ترسل رمز تحقق إلى العنوان المسجَّل على الحساب — أي بريدك أنت. الصقه في صفحة الصفقة فور وصوله. لا تُدفع لك المستحقات حتى ينتهي المشتري من هذه الخطوة.",
  },
  {
    n: 7,
    who: "المشتري",
    title: "استلمه ثم أكِّد",
    short: "غيّر البريد وكلمة المرور، وتأكد أنه أصبح لك فعلًا، ثم أكِّد.",
    long: `غيّر البريد وكلمة المرور، وتأكد أن الحساب أصبح لك فعلًا، ثم أكِّد. أمامك ${CONFIRMATION_WINDOW_HOURS} ساعة. ولا يُدفع للبائع إلا بعد تأكيدك.`,
  },
];

const STEPS: Record<Locale, EscrowStep[]> = { en, ar };

export function escrowSteps(locale: Locale = "en"): EscrowStep[] {
  return STEPS[locale];
}

/** The English steps, for callers that have no locale to hand. */
export const ESCROW_STEPS = en;
