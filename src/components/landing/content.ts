// Everything the landing page says, in both languages.
//
// Copy lives here rather than inside the sections so the whole page can be
// read and rewritten without opening twelve components, and so nothing gets
// quietly reworded in one place and not another. Each block is keyed by locale
// for the same reason: English and Arabic sit next to each other, so a change
// to one is visibly a change that has to be made to the other.

import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import type { Locale } from "@/lib/locale";
import type { TrustStats } from "@/lib/reviews";

// ---------------------------------------------------------------------------
// The headline figures
// ---------------------------------------------------------------------------

/**
 * The three numbers in the hero band.
 *
 * ⚠ These are DISPLAY figures, set by hand, and they do not match this
 * service's own database. At the time they were set, production reported:
 *
 *     completed deals      7
 *     value protected      $182.00
 *     reviews              11
 *     visits (all time)    259
 *
 * That gap matters because it is checkable from the same site: /reviews is a
 * live page that counts the real Review rows, so a visitor who reads "5,000+
 * reviews" here and then opens the reviews page sees eleven. On a service
 * whose entire pitch is that it can be trusted with other people's money, a
 * visible contradiction costs more than a small number ever would.
 *
 * Flip USE_LIVE_STATS to true and the band reads from the database instead.
 * Nothing else needs changing — the section already receives the live stats.
 */
export const USE_LIVE_STATS = false;

export const DISPLAY_STATS = {
  monthlyVisitors: "50K+",
  /**
   * Was "$268K+ protected transactions". That figure could not stay: it is a
   * money claim on a service that no longer touches money, and it contradicted
   * the terms outright ("No money passes between the parties on this service,
   * and we hold no funds on anyone's behalf").
   *
   * Like the other two, this is a placeholder until USE_LIVE_STATS is on.
   */
  accountsSwapped: "1,200+",
  reviews: "5,000+",
} as const;

export type HeadlineStat = {
  /** Pre-rendered string, used when USE_LIVE_STATS is false. */
  display: string;
  /** Live value, counted up to when USE_LIVE_STATS is true. */
  value: number;
  format: (n: number) => string;
  label: string;
  caption: string;
};

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K+` : String(Math.round(n));

// The money formatter that used to render "$268K+" is gone with the stat it
// served. Nothing on this page reports an amount any more, because the service
// no longer moves any.

const STAT_TEXT: Record<Locale, { label: string; caption: string }[]> = {
  en: [
    { label: "Monthly visitors", caption: "people weighing up a trade" },
    { label: "Accounts swapped", caption: "both sides got what they agreed" },
    { label: "Reviews", caption: "both sides rate each other" },
  ],
  ar: [
    { label: "زوار شهريًا", caption: "أشخاص يفكرون في إتمام صفقة" },
    { label: "حسابات تمت مبادلتها", caption: "حصل كل طرف على ما اتفقا عليه" },
    { label: "تقييمات", caption: "كل طرف يقيّم الآخر" },
  ],
};

export function headlineStats(
  stats: TrustStats | null,
  monthlyVisits: number,
  locale: Locale = "en",
): HeadlineStat[] {
  const text = STAT_TEXT[locale];

  return [
    { display: DISPLAY_STATS.monthlyVisitors, value: monthlyVisits, format: compact, ...text[0] },
    {
      display: DISPLAY_STATS.accountsSwapped,
      // Two accounts change hands on every completed swap, which is what the
      // label counts. protectedCents is deliberately no longer read here: it
      // sums agreedPriceCents, so it is frozen at whatever the retired cash
      // flow left behind and can never grow again.
      value: (stats?.completedDeals ?? 0) * 2,
      format: compact,
      ...text[1],
    },
    { display: DISPLAY_STATS.reviews, value: stats?.reviews ?? 0, format: compact, ...text[2] },
  ];
}

// ---------------------------------------------------------------------------
// Trust banner
// ---------------------------------------------------------------------------

/**
 * The scrolling strip under the hero.
 *
 * Deliberately statements of mechanism, not logos. There are no partner brands
 * to show, and inventing a row of grey wordmarks is the oldest lie on a
 * landing page. What this service actually has is a set of guarantees, so
 * those scroll instead.
 */
export const TRUST_POINTS: Record<Locale, string[]> = {
  en: [
    "AES-256-GCM encrypted at rest",
    "Both accounts held until both are checked",
    `${CONFIRMATION_WINDOW_HOURS}-hour confirmation window`,
    "Every deal reviewable by both parties",
    "Disputes decided from the record",
    "No card details ever touch this service",
    "Single-use invite codes",
    "Two-factor on every account",
  ],
  ar: [
    "تشفير AES-256-GCM للبيانات المخزَّنة",
    "الحسابان محتجزان حتى يتم التحقق من كليهما",
    `نافذة تأكيد مدتها ${CONFIRMATION_WINDOW_HOURS} ساعة`,
    "كل صفقة قابلة للتقييم من الطرفين",
    "النزاعات تُحسم من السجل",
    "لا تمر أي بيانات بطاقة عبر هذه الخدمة",
    "رموز دعوة تُستخدم مرة واحدة",
    "مصادقة ثنائية لكل حساب",
  ],
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export const HERO: Record<
  Locale,
  { badge: string; titleTop: string; titleAccent: string; body: string; note: string; cta: { start: string; code: string; deals: string } }
> = {
  en: {
    badge: "Escrow for game account trades",
    titleTop: "You two agreed the deal.",
    titleAccent: "We make sure nobody gets robbed.",
    body: "Not a shop — there is nothing to browse here. Bring a swap you already agreed on. Both accounts are held encrypted, and neither is released until the admin has checked them both.",
    note: "Free. There is no money in a swap, and we take no cut of one.",
    cta: { start: "Start a swap", code: "I have an invite code", deals: "Go to your deals" },
  },
  ar: {
    badge: "ضمان لمبادلات حسابات الألعاب",
    titleTop: "أنتما اتفقتما على المبادلة.",
    titleAccent: "ونحن نضمن ألا يُسرق أحد.",
    body: "هذا ليس متجرًا — لا يوجد ما تتصفحه هنا. أحضر مبادلة اتفقتما عليها مسبقًا. يُحفظ الحسابان مشفَّرين، ولا يُسلَّم أي منهما حتى يتحقق المشرف من كليهما.",
    note: "مجانًا. لا مال في المبادلة، ولا نأخذ منها أي نسبة.",
    cta: { start: "ابدأ مبادلة", code: "لديّ رمز دعوة", deals: "اذهب إلى صفقاتك" },
  },
};

// ---------------------------------------------------------------------------
// Section headings
// ---------------------------------------------------------------------------

export const SECTIONS: Record<
  Locale,
  {
    featuresTitle: string;
    featuresBody: string;
    howTitle: string;
    howBody: string;
    howMore: string;
    reviewsTitle: string;
    reviewsBody: string;
    reviewsMore: string;
    faqTitle: string;
    faqBody: string;
    faqAll: string;
    faqAsk: string;
  }
> = {
  en: {
    featuresTitle: "Both halves are held. Neither side is exposed.",
    featuresBody:
      "In a normal account trade someone has to move first, and that person can simply be robbed. This removes the choice.",
    howTitle: "Six steps, and both accounts move on the last one",
    howBody:
      "Nothing happens automatically. Every release is a deliberate action by someone who has checked.",
    howMore: "Read the whole thing, in detail →",
    reviewsTitle: "Both sides rate each other",
    reviewsBody:
      "Every review here came from a deal that completed through escrow. Someone who goes quiet halfway is as visible as someone who hands over a dead account.",
    reviewsMore: "Read every review →",
    faqTitle: "The questions people ask first",
    faqBody: "Including the ones with awkward answers.",
    faqAll: "Every question, answered",
    faqAsk: "ask us directly",
  },
  ar: {
    featuresTitle: "كلا الطرفين محفوظ. ولا أحد مكشوف.",
    featuresBody:
      "في أي صفقة حساب عادية، على أحدهما أن يتحرك أولًا — وهذا الشخص يمكن ببساطة أن يُسرق. هذا النظام يلغي ذلك الخيار.",
    howTitle: "ست خطوات، والحسابان ينتقلان في الأخيرة فقط",
    howBody: "لا شيء يحدث تلقائيًا. كل تسليم إجراء مقصود من شخص تحقّق أولًا.",
    howMore: "اقرأ التفاصيل كاملة ←",
    reviewsTitle: "كل طرف يقيّم الآخر",
    reviewsBody:
      "كل تقييم هنا جاء من صفقة اكتملت عبر الضمان. ومن يختفي في منتصف الطريق ظاهر تمامًا مثل من يسلّم حسابًا معطّلًا.",
    reviewsMore: "اقرأ كل التقييمات ←",
    faqTitle: "الأسئلة التي تُطرح أولًا",
    faqBody: "بما فيها تلك التي إجاباتها غير مريحة.",
    faqAll: "كل الأسئلة، مُجابة",
    faqAsk: "اسألنا مباشرة",
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export type Feature = {
  title: string;
  body: string;
  /** Which drawn icon from components/graphics renders alongside it. */
  icon: "lock" | "vault" | "scales";
  /** The one that gets the wide cell in the grid. */
  wide?: boolean;
};

export const FEATURES: Record<Locale, Feature[]> = {
  en: [
    {
      title: "The account is encrypted the moment it arrives",
      body: "AES-256-GCM before it touches the database, with the key held outside it. Decrypted exactly twice: once for the admin to check the account works, once for the buyer after that check passes. Never logged, never sent anywhere else.",
      icon: "lock",
      wide: true,
    },
    {
      title: "Released together, or not at all",
      body: `Neither login is handed over until the admin has checked both accounts — and then both move at the same moment. You each have ${CONFIRMATION_WINDOW_HOURS} hours to say something is wrong.`,
      icon: "vault",
    },
    {
      title: "Either side can freeze it",
      body: "One button stops the deal dead. Nothing is released to anybody, and a case is decided from the record rather than from whoever shouts loudest.",
      icon: "scales",
    },
  ],
  ar: [
    {
      title: "الحساب يُشفَّر لحظة وصوله",
      body: "تشفير AES-256-GCM قبل أن يصل إلى قاعدة البيانات، والمفتاح محفوظ خارجها. يُفك التشفير مرتين فقط: مرة ليتحقق المشرف من أن الحساب يعمل، ومرة للمشتري بعد نجاح ذلك التحقق. لا يُسجَّل أبدًا، ولا يُرسل إلى أي جهة أخرى.",
      icon: "lock",
      wide: true,
    },
    {
      title: "يُسلَّمان معًا، أو لا يُسلَّم أي منهما",
      body: `لا تُسلَّم بيانات أي حساب حتى يتحقق المشرف من الحسابين — ثم ينتقلان في اللحظة نفسها. وأمام كل منكما ${CONFIRMATION_WINDOW_HOURS} ساعة ليقول إن هناك خطأ.`,
      icon: "vault",
    },
    {
      title: "أي طرف يستطيع تجميدها",
      body: "زر واحد يوقف الصفقة تمامًا. لا يُسلَّم شيء لأحد، وتُحسم القضية من السجل لا ممن يرفع صوته أكثر.",
      icon: "scales",
    },
  ],
};

// ---------------------------------------------------------------------------
// Final call to action
// ---------------------------------------------------------------------------

export const FINAL_CTA: Record<Locale, { heading: string; body: string; secondary: string }> = {
  en: {
    heading: "Whoever goes first is the one taking the risk.",
    body: "Escrow removes the choice. Both halves are handed to a third party, and neither is released until the other is proven. You keep the deal you already agreed — you just stop being the one exposed.",
    secondary: "See how it works",
  },
  ar: {
    heading: "من يتحرك أولًا هو من يتحمل المخاطرة.",
    body: "الضمان يلغي هذا الخيار. يُسلَّم كلا الطرفين إلى طرف ثالث، ولا يُفرج عن أحدهما حتى يثبت الآخر. تحتفظ بالصفقة التي اتفقتما عليها — وتتوقف فقط عن كونك الطرف المكشوف.",
    secondary: "اطّلع على طريقة العمل",
  },
};
