// Copy for the promoter surface, in both languages.
//
// Kept out of lib/page-copy.ts because that file is already long and these are
// three whole pages rather than a section each. Same shape and same rule: the
// Arabic object is typed against the English one, so it cannot silently be
// missing a field.
//
// Everything a visitor can reach without signing in is translated. The site
// has a language switcher in the header, and a page that ignores it is worse
// than one that never offered the choice — it looks broken rather than
// English-only.
import type { Locale } from "@/lib/locale";

// ---------------------------------------------------------------------------
// /promote
// ---------------------------------------------------------------------------

const promoteEn = {
  title: "Become a promoter",
  subtitle: "Your code is the door. Nobody registers here without one.",
  leadOne:
    "There is no open sign-up on this site. Every single person who trades here got in through somebody's code. If it is yours, you earn",
  leadOneTail: "every time they complete a swap.",
  leadTwo:
    "You do not need a code to apply for this. This page is the way in if you do not know anyone yet.",

  networkOverline: "We were doing this before the site existed",
  networkPromoters: "Promoters across the network",
  networkPayout: "Paid out to them monthly",
  networkBody:
    "Those are the people already promoting this and what they are paid every month. The escrow you see here is the new part — we built it so the swaps we were already refereeing by hand run on something, and so the code you share leads somewhere.",

  howTitle: "How it works",
  howApply: "Apply below.",
  howApplyBody:
    "Tell us where you would share it and roughly how many people you reach. We read every application — this is the part we actually judge.",
  howCode: "Get your code and auto-fill link.",
  howCodeBody: "Anyone using it registers instantly, no typing.",
  howEarn: "Earn on every swap they complete.",
  howEarnBody: "Forever, not just their first.",

  earnTitle: "What you earn",
  earnPerSwap: "Every completed swap by someone who used your code",
  // {n} is the strength bar. Said on the row it qualifies rather than in a
  // footnote further down: this is the number, and someone deciding whether to
  // promote this deserves it beside the amount.
  earnStrengthNote:
    "Both squads have to be rated above {n}. A rating left blank counts as under.",
  earnBothLead: "A swap where",
  earnBothBold: "both",
  earnBothTail: "sides used your code",
  earnPayoutsAt: "Payouts at",
  earnPaid: "Paid",
  earnPaidValue: "1st of each month, one batch",
  earnPaidNote: "Request any day once you are over.",

  paidTitle: "How you get paid",
  paidIntro:
    "You choose your payout method when you apply, and you can change it any time before a payout goes out.",
  paidMethod: "Method",
  paidSpeed: "Speed",
  paidNotes: "Notes",
  paidCryptoSpeed: "Minutes",
  paidCryptoNote: "Our default. Lowest fees, works anywhere, no bank needed.",
  paidPaypalSpeed: "1–2 days",
  paidPaypalNote:
    "Sent in USD. Your own conversion and withdrawal costs are set by PayPal, not us.",
  paidGift: "Gift card",
  paidGiftSpeed: "Instant",
  paidGiftNote:
    "Steam, Amazon or Google Play. Useful if you do not have a bank account or you are under 18.",
  paidFeeBold: "We cover the sending fee.",
  paidFeeBody:
    "What it costs you to convert or withdraw on your side is between you and your provider — worth checking before you pick.",
  paidUsdBold: "All balances are in US dollars.",
  paidUsdBody: "payout is that amount sent, not that amount after we have taken something out.",
  paidTestBold: "Your first payout gets a test transaction.",
  paidTestBody:
    "We send $1 first and wait for you to confirm it landed, then send the rest. Wallet addresses cannot be undone if they are wrong, and we would rather lose a day than lose your money.",
  paidReceiptBold: "Every payment gets a receipt",
  paidReceiptBody:
    "— a transaction hash or reference, recorded against the payout. Keep them. If we ever disagree about whether something was paid, that record settles it.",

  bothTitle: "You can promote and still trade",
  bothAsk: "This is the question everyone asks, so:",
  bothAnswer: "yes, you can do both.",
  bothBody:
    "A promoter account collects earnings and cannot open swaps itself — that is an anti-farming rule, not a punishment. If you want to trade as well, register a separate normal account using someone else's code. Promoting does not cost you your trading.",
  bothRuleLead: "One rule on that: do not use",
  bothRuleBold: "your own",
  bothRuleTail:
    "code on your trading account. Referring yourself is farming, and it gets the credits reversed and both accounts suspended. Use somebody else's — that is what everyone here did.",

  bestTitle: "This works best if you",
  best: [
    "Run a Discord server, Telegram group or Facebook group where people trade accounts",
    "Sell accounts with real feedback behind you and lose deals to “you go first”",
    "Already middleman for your community — get paid for what you are doing free",
    "Make eFootball content and get trade requests in your comments",
  ],

  removedTitle: "What gets you removed",
  removedBody:
    "Opening deals just to generate credits. Both sides get reversed and the account is suspended. We are paying for real trades between real people; that is the whole point.",

  warningTitle: "Before you promote it, know this",
  warningTail:
    "Say that to your community and you will be the one who told them the truth. It is also the answer to the first hard question anyone will ask you.",

  applyTitle: "Apply",
  applyBody:
    "Every application is read by hand. The thing that decides it is the last question: where you would actually promote this, and to roughly how many people.",

  alreadyLead: "Already have a code from someone?",
  alreadyLink: "Register normally",
  alreadyTail:
    "— you get a promoter code of your own either way, and a normal account can trade too.",
};

const promoteAr: typeof promoteEn = {
  title: "كن داعيًا",
  subtitle: "رمزك هو الباب. لا أحد يسجّل هنا بدونه.",
  leadOne:
    "لا يوجد تسجيل مفتوح على هذا الموقع. كل من يتداول هنا دخل عبر رمز شخص ما. وإن كان الرمز رمزك، فأنت تربح",
  leadOneTail: "في كل مرة يُتمّ فيها مبادلة.",
  leadTwo:
    "لا تحتاج إلى رمز لتقديم هذا الطلب. هذه الصفحة هي طريق الدخول إن لم تكن تعرف أحدًا بعد.",

  networkOverline: "كنا نقوم بهذا قبل وجود الموقع",
  networkPromoters: "داعون عبر الشبكة",
  networkPayout: "يُدفع لهم شهريًا",
  networkBody:
    "هؤلاء هم من يروّجون للخدمة بالفعل، وهذا ما يتقاضونه كل شهر. أما الضمان الذي تراه هنا فهو الجزء الجديد — بنيناه لتجري عليه المبادلات التي كنا ندير أمرها يدويًا، ولكي يقود الرمز الذي تشاركه إلى مكان ما.",

  howTitle: "كيف تعمل",
  howApply: "قدّم طلبك بالأسفل.",
  howApplyBody:
    "أخبرنا أين ستشارك الرمز وكم شخصًا تصل إليه تقريبًا. نقرأ كل طلب — وهذا هو الجزء الذي نحكم عليه فعلًا.",
  howCode: "احصل على رمزك ورابط التعبئة التلقائية.",
  howCodeBody: "من يستخدمه يسجّل فورًا، بلا كتابة.",
  howEarn: "اربح من كل مبادلة يُتمّونها.",
  howEarnBody: "دائمًا، لا من أول مبادلة فقط.",

  earnTitle: "ما تربحه",
  earnPerSwap: "كل مبادلة مكتملة من شخص استخدم رمزك",
  earnStrengthNote: "يجب أن يكون تقييم الفريقين أعلى من {n}. والتقييم المتروك فارغًا يُعدّ دون الحد.",
  earnBothLead: "مبادلة استخدم فيها",
  earnBothBold: "الطرفان",
  earnBothTail: "رمزك",
  earnPayoutsAt: "الحد الأدنى للسحب",
  earnPaid: "موعد الدفع",
  earnPaidValue: "اليوم الأول من كل شهر، دفعة واحدة",
  earnPaidNote: "اطلب في أي يوم بعد تجاوز الحد.",

  paidTitle: "كيف تستلم أموالك",
  paidIntro: "تختار طريقة الاستلام عند التقديم، ويمكنك تغييرها في أي وقت قبل إرسال الدفعة.",
  paidMethod: "الطريقة",
  paidSpeed: "السرعة",
  paidNotes: "ملاحظات",
  paidCryptoSpeed: "دقائق",
  paidCryptoNote: "طريقتنا الافتراضية. أقل الرسوم، تعمل في أي مكان، ولا تحتاج حسابًا بنكيًا.",
  paidPaypalSpeed: "يوم إلى يومين",
  paidPaypalNote: "تُرسل بالدولار. رسوم التحويل والسحب لديك تحددها باي بال لا نحن.",
  paidGift: "بطاقة هدايا",
  paidGiftSpeed: "فورية",
  paidGiftNote:
    "ستيم أو أمازون أو جوجل بلاي. مفيدة إن لم يكن لديك حساب بنكي أو كان عمرك دون الثامنة عشرة.",
  paidFeeBold: "نحن نتحمل رسوم الإرسال.",
  paidFeeBody:
    "أما ما يكلفك التحويل أو السحب من جهتك فهو بينك وبين مزوّدك — ويستحق التحقق قبل أن تختار.",
  paidUsdBold: "كل الأرصدة بالدولار الأمريكي.",
  paidUsdBody: "يعني أن هذا المبلغ يُرسل كاملًا، لا بعد أن نقتطع منه شيئًا.",
  paidTestBold: "دفعتك الأولى تسبقها معاملة تجريبية.",
  paidTestBody:
    "نرسل دولارًا واحدًا أولًا وننتظر تأكيدك أنه وصل، ثم نرسل الباقي. عناوين المحافظ لا يمكن التراجع عنها إن كانت خاطئة، ونفضّل أن نخسر يومًا على أن نخسر مالك.",
  paidReceiptBold: "كل دفعة لها إيصال",
  paidReceiptBody:
    "— رمز معاملة أو مرجع، مسجَّل مع الدفعة. احتفظ بها. وإن اختلفنا يومًا حول ما إذا كان شيء قد دُفع، فهذا السجل يحسم الأمر.",

  bothTitle: "يمكنك أن تدعو وتتداول معًا",
  bothAsk: "هذا سؤال الجميع، فإليك الجواب:",
  bothAnswer: "نعم، يمكنك الأمرين.",
  bothBody:
    "حساب الداعي يجمع الأرباح ولا يستطيع فتح مبادلات بنفسه — وهذه قاعدة لمنع الاستغلال، لا عقوبة. وإن أردت التداول أيضًا، فسجّل حسابًا عاديًا منفصلًا برمز شخص آخر. الدعوة لا تكلفك تداولك.",
  bothRuleLead: "قاعدة واحدة في ذلك: لا تستخدم",
  bothRuleBold: "رمزك أنت",
  bothRuleTail:
    "على حساب التداول الخاص بك. دعوة نفسك استغلال، وتؤدي إلى إلغاء الأرصدة وتعليق الحسابين. استخدم رمز شخص آخر — هكذا فعل كل من هنا.",

  bestTitle: "هذا يناسبك أكثر إن كنت",
  best: [
    "تدير سيرفر ديسكورد أو مجموعة تيليجرام أو فيسبوك يتبادل فيها الناس الحسابات",
    "تبيع حسابات ولديك تقييمات حقيقية، وتخسر صفقات بسبب «من يبدأ أولًا»",
    "تتوسّط بالفعل لمجتمعك — احصل على مقابل لما تفعله مجانًا",
    "تصنع محتوى عن eFootball وتصلك طلبات تبادل في التعليقات",
  ],

  removedTitle: "ما الذي يُخرجك من البرنامج",
  removedBody:
    "فتح صفقات لمجرد توليد أرصدة. يُلغى الرصيدان ويُعلَّق الحساب. نحن ندفع مقابل تداولات حقيقية بين أشخاص حقيقيين؛ هذا هو الهدف كله.",

  warningTitle: "قبل أن تروّج لها، اعرف هذا",
  warningTail:
    "قل ذلك لمجتمعك وستكون أنت من قال لهم الحقيقة. وهو أيضًا الجواب على أول سؤال صعب سيطرحه عليك أحد.",

  applyTitle: "قدّم طلبك",
  applyBody:
    "كل طلب يُقرأ يدويًا. وما يحسمه هو السؤال الأخير: أين ستروّج لهذا فعلًا، ولكم من الناس تقريبًا.",

  alreadyLead: "لديك رمز من شخص ما بالفعل؟",
  alreadyLink: "سجّل بالطريقة العادية",
  alreadyTail: "— ستحصل على رمز داعٍ خاص بك في الحالتين، والحساب العادي يمكنه التداول أيضًا.",
};

export const PROMOTE: Record<Locale, typeof promoteEn> = { en: promoteEn, ar: promoteAr };

// ---------------------------------------------------------------------------
// The application form, and the live payout ticker
// ---------------------------------------------------------------------------
//
// Both are client components, so their copy is passed in as a prop rather than
// read from a server-only helper.

const applyFormEn = {
  nameLabel: "Display name",
  nameHint: "What people will see next to your code.",
  namePlaceholder: "Your name or handle",
  emailLabel: "Email",
  channelLabel: "Where would you promote it?",
  channelHint: "A Discord server, a YouTube channel, a group chat — and roughly how many people.",
  channelPlaceholder:
    "I run a 4,000-member eFootball Discord where people arrange account trades in a #trading channel. I would pin the link and post it when someone asks how to swap safely.",
  payoutLegend: "How would you like to be paid?",
  payoutNote:
    "You can change this any time before a payout goes out. Everything is in US dollars, and we cover the cost of sending.",
  cryptoLabel: "USDT (TRC-20)",
  cryptoDetail: "Arrives in minutes, costs almost nothing to send, and needs no bank account.",
  paypalLabel: "PayPal",
  paypalDetail:
    "One to two days, sent in US dollars. Their conversion and withdrawal fees are theirs, not ours.",
  giftLabel: "Gift card — Steam, Amazon or Google Play",
  giftDetail: "Instant. The one that works if you have no bank account, or you are under 18.",
  passwordLabel: "Password",
  passwordHint: "At least 8 characters. You will use this to sign in once you are approved.",
  submit: "Apply to promote",
  submitting: "Sending…",
  foot: "A promoter account shares a code and collects earnings. It cannot open or join a swap — if you want to trade accounts too, ask someone for their code and register normally.",
  doneTail: "Nothing else to do for now. Applications are read by hand, so it will not be instant.",
};

const applyFormAr: typeof applyFormEn = {
  nameLabel: "الاسم المعروض",
  nameHint: "ما سيراه الناس بجانب رمزك.",
  namePlaceholder: "اسمك أو معرّفك",
  emailLabel: "البريد الإلكتروني",
  channelLabel: "أين ستروّج لها؟",
  channelHint: "سيرفر ديسكورد، قناة يوتيوب، مجموعة محادثة — وكم شخصًا تقريبًا.",
  channelPlaceholder:
    "أدير سيرفر ديسكورد لـ eFootball فيه 4000 عضو، ويرتّب الناس فيه تبادل الحسابات في قناة #trading. سأثبّت الرابط وأنشره كلما سأل أحد كيف يبادل بأمان.",
  payoutLegend: "كيف تفضّل أن تُدفع لك أموالك؟",
  payoutNote:
    "يمكنك تغيير هذا في أي وقت قبل إرسال الدفعة. كل شيء بالدولار الأمريكي، ونحن نتحمل تكلفة الإرسال.",
  cryptoLabel: "USDT (TRC-20)",
  cryptoDetail: "تصل خلال دقائق، وتكلفة إرسالها تكاد تكون معدومة، ولا تحتاج حسابًا بنكيًا.",
  paypalLabel: "باي بال",
  paypalDetail: "يوم إلى يومين، تُرسل بالدولار. رسوم التحويل والسحب لديهم لا لدينا.",
  giftLabel: "بطاقة هدايا — ستيم أو أمازون أو جوجل بلاي",
  giftDetail: "فورية. وهي الخيار الذي يعمل إن لم يكن لديك حساب بنكي أو كان عمرك دون الثامنة عشرة.",
  passwordLabel: "كلمة المرور",
  passwordHint: "٨ أحرف على الأقل. ستستخدمها لتسجيل الدخول بعد قبولك.",
  submit: "قدّم طلب الدعوة",
  submitting: "جارٍ الإرسال…",
  foot: "حساب الداعي يشارك رمزًا ويجمع الأرباح. لا يستطيع فتح مبادلة أو الانضمام إليها — وإن أردت تداول الحسابات أيضًا، فاطلب رمزًا من أحدهم وسجّل بالطريقة العادية.",
  doneTail: "لا شيء آخر عليك فعله الآن. الطلبات تُقرأ يدويًا، لذا لن يكون الرد فوريًا.",
};

export const APPLY_FORM: Record<Locale, typeof applyFormEn> = { en: applyFormEn, ar: applyFormAr };

const tickerEn = {
  overline: "Paid out just now",
  earned: "earned",
  foot: "Every credit here is a real swap that completed through the escrow. Names are shortened — what somebody earns is their business, not the page's.",
  justNow: "just now",
  minutesAgo: "{n}m ago",
  hoursAgo: "{n}h ago",
  daysAgo: "{n}d ago",
};

const tickerAr: typeof tickerEn = {
  overline: "دُفعت للتو",
  earned: "ربح",
  foot: "كل رصيد هنا مبادلة حقيقية اكتملت عبر الضمان. والأسماء مختصرة — فما يربحه أحدهم شأنه هو، لا شأن الصفحة.",
  justNow: "الآن",
  minutesAgo: "منذ {n} د",
  hoursAgo: "منذ {n} س",
  daysAgo: "منذ {n} ي",
};

export const TICKER: Record<Locale, typeof tickerEn> = { en: tickerEn, ar: tickerAr };

// ---------------------------------------------------------------------------
// /explainer — the promoter kit
// ---------------------------------------------------------------------------
//
// The paste text and the script are translated, not just the page around them.
// A promoter running an Arabic Discord needs Arabic to paste; handing them
// English defeats the entire purpose of the kit, which is that their effort
// should be pasting rather than writing.

const explainerEn = {
  title: "The 60-second explainer",
  subtitle:
    "Everything you need to explain this service in one minute. Copy it, paste it, done — you should never have to write this yourself.",

  signedIn: "Your code is already in both of these. Anyone opening the link gets it filled in for them.",
  signedOutLink: "Sign in",
  signedOutLead: "and your own code appears in both of these automatically. Otherwise, replace",
  signedOutTail: "with yours.",

  pasteTitle: "Paste anywhere",
  pasteBody:
    "For a Discord pin, a group description, a forum reply, a DM to someone who asked how to swap safely.",
  pasteLabel: "Copy the explainer",

  scriptTitle: "Video script — 60 seconds",
  scriptBody:
    "A screen recording, no face needed. It ends on the caveat deliberately: that is the line people screenshot, and being the one who said it is worth more than the thirty seconds before it.",
  scriptLabel: "Copy the script",

  questionTitle: "The question you will get asked",
  questionBody:
    "Sooner or later somebody replies \u201cwhat if Konami bans the account?\u201d. Do not soften it. This is the answer, and it is the same one printed on the site:",

  avoidTitle: "What not to say",
  avoid: [
    "Not \u201c100% safe\u201d or \u201cguaranteed\u201d. It is not, and the people you are talking to know it is not.",
    "Not that we hold money. We do not hold any, and the product pages say so — a promoter promising otherwise is the fastest way to look like a scam.",
    "Do not promise how fast an admin will verify. Say it is checked by a person, because it is.",
  ],

  footEarnings: "Your code and earnings",
  footPays: "How the programme pays",

  paste: (code: string, hours: number) => `How PESescrow works — 60 seconds

It's a referee for account-for-account swaps. Free, and no money is involved at any point.

1. You and the other trader agree the swap wherever you normally talk.
2. One of you opens the deal and describes both accounts. You get a code to send them.
3. You both deposit your login details. They're encrypted — the other person can't see yours.
4. An admin logs into both and checks each account is actually what was promised. This is the bit that stops the lying.
5. You each get your Konami codes and submit them.
6. You both change the email and password, and confirm within ${hours} hours.

Neither of you goes first. That's the entire idea. Nobody is exposed while the other decides whether to behave.

Registration is invite-only. Code: ${code}
Sign up: https://pesescrow.com/register?ref=${code}

One honest note: this protects you from the other trader, not from Konami. Publishers can suspend traded accounts and no service can stop that.`,

  script: (code: string, hours: number) => `[0:00] "You want to swap accounts with someone. Neither of you wants to go first. That's the whole problem, so here's how this fixes it."

[0:08] "You agree the swap wherever you normally talk — Discord, WhatsApp, wherever."

[0:14] [screen: opening a deal] "One of you opens a deal and describes both accounts. You get a code, you send it over."

[0:24] [screen: deposit] "You both deposit your logins. Encrypted. They can't see yours, you can't see theirs."

[0:34] "An admin logs into both accounts and checks they're actually what was promised. This is the step that matters — it's where lies get caught, before anyone's exposed."

[0:46] [screen: codes] "Konami codes get exchanged, you both change the email and password, you confirm within ${hours} hours. Done."

[0:54] "It's free. There's no money in it anywhere. It's invite-only, so you need a code — mine is ${code}, it's in the description."

[1:00] "And to be straight with you: this protects you from the other trader. It doesn't protect you from Konami. Nothing does."`,
};

const explainerAr: typeof explainerEn = {
  title: "الشرح في ٦٠ ثانية",
  subtitle:
    "كل ما تحتاجه لتشرح هذه الخدمة في دقيقة واحدة. انسخ، الصق، انتهى — لا ينبغي أن تكتب هذا بنفسك أبدًا.",

  signedIn: "رمزك موجود في النصّين بالفعل. ومن يفتح الرابط تُملأ له الخانة تلقائيًا.",
  signedOutLink: "سجّل الدخول",
  signedOutLead: "ليظهر رمزك تلقائيًا في النصّين. وإلا فاستبدل",
  signedOutTail: "برمزك أنت.",

  pasteTitle: "الصقه في أي مكان",
  pasteBody: "لتثبيته في ديسكورد، أو وصف مجموعة، أو ردّ في منتدى، أو رسالة لمن سأل كيف يبادل بأمان.",
  pasteLabel: "انسخ الشرح",

  scriptTitle: "نص فيديو — ٦٠ ثانية",
  scriptBody:
    "تسجيل شاشة، بلا وجه. وينتهي على التحذير عن قصد: فتلك هي الجملة التي يلتقط الناس صورة لها، وأن تكون أنت من قالها يساوي أكثر من الثلاثين ثانية التي قبلها.",
  scriptLabel: "انسخ النص",

  questionTitle: "السؤال الذي سيُطرح عليك",
  questionBody:
    "عاجلًا أو آجلًا سيردّ أحدهم: «وماذا لو حظرت كونامي الحساب؟». لا تلطّف الجواب. هذا هو الجواب، وهو نفسه المكتوب على الموقع:",

  avoidTitle: "ما لا تقوله",
  avoid: [
    "لا تقل «آمن ١٠٠٪» أو «مضمون». فهو ليس كذلك، ومن تحدّثهم يعرفون أنه ليس كذلك.",
    "لا تقل إننا نحتفظ بالأموال. نحن لا نحتفظ بأي مال، وصفحات الموقع تقول ذلك — والداعي الذي يعد بغير هذا هو أسرع طريق لتبدو الخدمة احتيالًا.",
    "لا تَعِد بسرعة تحقّق المشرف. قل إن التحقق يقوم به شخص، لأن هذا ما يحدث فعلًا.",
  ],

  footEarnings: "رمزك وأرباحك",
  footPays: "كيف يدفع البرنامج",

  paste: (code: string, hours: number) => `كيف يعمل PESescrow — في ٦٠ ثانية

هو حكَم لمبادلات حساب بحساب. مجاني، ولا مال يدخل في الأمر إطلاقًا.

1. تتفقان على المبادلة في المكان الذي تتحدثان فيه عادةً.
2. أحدكما يفتح الصفقة ويصف الحسابين. يصلك رمز ترسله للطرف الآخر.
3. يودع كلٌّ منكما بيانات دخوله. البيانات مشفّرة — الطرف الآخر لا يرى بياناتك.
4. يدخل مشرف إلى الحسابين ويتأكد أن كل حساب هو فعلًا ما وُعد به. هذه هي الخطوة التي توقف الكذب.
5. يتسلّم كلٌّ منكما رموز كونامي ويرسلها.
6. يغيّر كلٌّ منكما البريد وكلمة المرور، ويؤكد خلال ${hours} ساعة.

لا أحد منكما يبدأ أولًا. هذه هي الفكرة كلها. لا أحد مكشوف بينما يقرر الآخر إن كان سيلتزم.

التسجيل بدعوة فقط. الرمز: ${code}
سجّل من هنا: https://pesescrow.com/register?ref=${code}

ملاحظة صادقة واحدة: هذا يحميك من الطرف الآخر، لا من كونامي. الناشرون يستطيعون تعليق الحسابات المتداولة، ولا توجد خدمة تمنع ذلك.`,

  script: (code: string, hours: number) => `[0:00] «تريد أن تبادل حسابك مع أحدهم. ولا أحد منكما يريد أن يبدأ أولًا. هذه هي المشكلة كلها، وإليك كيف تُحلّ.»

[0:08] «تتفقان على المبادلة في المكان الذي تتحدثان فيه عادةً — ديسكورد، واتساب، أيًّا كان.»

[0:14] [الشاشة: فتح صفقة] «أحدكما يفتح صفقة ويصف الحسابين. يصلك رمز، ترسله له.»

[0:24] [الشاشة: إيداع البيانات] «يودع كلٌّ منكما بيانات دخوله. مشفّرة. هو لا يرى بياناتك، وأنت لا ترى بياناته.»

[0:34] «يدخل مشرف إلى الحسابين ويتأكد أنهما فعلًا كما وُصفا. هذه هي الخطوة المهمة — هنا يُكشف الكذب، قبل أن ينكشف أحد.»

[0:46] [الشاشة: الرموز] «تُتبادل رموز كونامي، ويغيّر كلٌّ منكما البريد وكلمة المرور، وتؤكدان خلال ${hours} ساعة. انتهى.»

[0:54] «الخدمة مجانية. لا مال فيها في أي مرحلة. والتسجيل بدعوة فقط، فتحتاج رمزًا — رمزي هو ${code}، وهو في الوصف.»

[1:00] «ولأكون صريحًا معك: هذا يحميك من الطرف الآخر. لا يحميك من كونامي. لا شيء يحميك منها.»`,
};

export const EXPLAINER: Record<Locale, typeof explainerEn> = { en: explainerEn, ar: explainerAr };

// ---------------------------------------------------------------------------
// /referrals — the signed-in promoter page, and the code-sharing card on it
// ---------------------------------------------------------------------------

const shareEn = {
  overline: "Your promoter code",
  copyLink: "Copy invite link",
  copyCode: "Copy code",
  foot: "Post it anywhere — nobody can sign up without a code, so this is how people get in. The link fills it in for them automatically.",
  copied: "Copied.",
  codeCopied: "Code copied.",
  linkCopied: "Invite link copied.",
  copyFailed: "Could not reach the clipboard — copy it by hand.",
};

const shareAr: typeof shareEn = {
  overline: "رمزك كداعٍ",
  copyLink: "انسخ رابط الدعوة",
  copyCode: "انسخ الرمز",
  foot: "انشره في أي مكان — لا أحد يستطيع التسجيل بلا رمز، فهذه هي الطريقة التي يدخل بها الناس. والرابط يملأ الخانة لهم تلقائيًا.",
  copied: "تم النسخ.",
  codeCopied: "نُسخ الرمز.",
  linkCopied: "نُسخ رابط الدعوة.",
  copyFailed: "تعذّر الوصول إلى الحافظة — انسخه يدويًا.",
};

export const SHARE: Record<Locale, typeof shareEn> = { en: shareEn, ar: shareAr };

const referralsEn = {
  title: "Promote & earn",
  subtitleLead: "Share your code. You earn",
  subtitleTail: "every time someone who signed up with it completes a swap.",

  kitLead: "Do not write the pitch yourself —",
  kitLink: "the 60-second explainer",
  kitTail: "has a paste-anywhere version and a video script with your code already in them.",

  statSignUps: "Signed up with your code",
  statNobody: "Nobody yet",
  // "that paid" rather than "completed": this figure counts credits, and a
  // swap under the strength bar completes without producing one.
  statCompletedSuffix: "have completed a swap that paid",
  statEarned: "Earned all time",
  statThisMonth: "this month",
  statAvailable: "Available to withdraw",
  statPaidOn: "Paid out on",
  statToMinimum: "to the minimum",

  paysTitle: "How it pays",
  paysRateTail: "per completed swap",
  paysRateBody:
    "by anyone who signed up with your code. Both sides of a swap earn for their own promoter, so a deal between two people you introduced pays you twice.",
  paysMinimumTail: "minimum",
  paysMinimumBody:
    "before you can request a payout. Every payout is a transfer sent by hand, and smaller ones would go entirely on the fee.",
  paysDateBold: "Paid on the 1st of the month.",
  paysDateBody: "Request it on any day once you are over the minimum; it goes out in the next batch, on",
  // {n} is the bar, filled in from the same constant the credit is checked
  // against, so the promise on this page cannot drift from what gets paid.
  paysStrengthBold: "Both squads above {n}.",
  paysStrengthBody:
    "A swap only earns anything if the accounts on both sides are rated above it. Two throwaway accounts passed back and forth are the cheapest thing in the world to manufacture, and this pays for real trades between real people. A swap where either rating was left blank counts as under.",
  paysOwnDeals:
    "You earn nothing from a deal you were part of yourself, and deals opened only to generate credits are reversed.",
  paysRequest: "Request your payout →",
  paysToGo: "{n} more completed {noun} and you can request a payout.",
  dealSingular: "deal",
  dealPlural: "deals",
  completedDeals: "{n} {noun} that paid you",

  introducedTitle: "People you introduced",
  introducedBody: "Everyone who signed up with your code, and what each has earned you.",
  introducedEmptyTitle: "Nobody has used your code yet",
  introducedEmptyBody:
    "Send the link above to anyone who trades eFootball accounts. They cannot create an account without a code from someone, so yours is as good as anyone's.",
  joined: "Joined",
  noDealsYet: "no deals that paid yet",

  creditsTitle: "Recent credits",
  creditsLead: "The last",
  creditsMid: ". Your",
  creditsLink: "balance page",
  creditsTail: "has the full list.",

  byTitle: "You were introduced by",
  byLead: "They earn",
  byTail: "each time you complete a swap. It costs you nothing.",
};

const referralsAr: typeof referralsEn = {
  title: "ادعُ واربح",
  subtitleLead: "شارك رمزك. تربح",
  subtitleTail: "في كل مرة يُتمّ فيها شخص سجّل به مبادلة.",

  kitLead: "لا تكتب الشرح بنفسك —",
  kitLink: "شرح الستين ثانية",
  kitTail: "فيه نصّ جاهز للّصق ونصّ فيديو، ورمزك موجود فيهما بالفعل.",

  statSignUps: "سجّلوا برمزك",
  statNobody: "لا أحد بعد",
  statCompletedSuffix: "أتمّوا مبادلة دفعت لك",
  statEarned: "الأرباح الإجمالية",
  statThisMonth: "هذا الشهر",
  statAvailable: "المتاح للسحب",
  statPaidOn: "يُدفع في",
  statToMinimum: "للوصول إلى الحد الأدنى",

  paysTitle: "كيف يُدفع لك",
  paysRateTail: "لكل مبادلة مكتملة",
  paysRateBody:
    "ينفّذها أي شخص سجّل برمزك. وطرفا المبادلة يربح كلٌّ منهما لداعيه، فالصفقة بين شخصين أدخلتهما أنت تدفع لك مرتين.",
  paysMinimumTail: "حدٌّ أدنى",
  paysMinimumBody: "قبل أن تطلب دفعة. كل دفعة تحويل يُرسَل يدويًا، والدفعات الأصغر تذهب كلها في الرسوم.",
  paysDateBold: "تُدفع في الأول من كل شهر.",
  paysDateBody: "اطلبها في أي يوم بعد تجاوزك الحد الأدنى؛ وتخرج في الدفعة التالية، في",
  paysStrengthBold: "قوة الفريقين فوق {n}.",
  paysStrengthBody:
    "لا تربح المبادلة شيئًا إلا إذا كان تقييم الحسابين في الطرفين أعلى من ذلك. حسابان بلا قيمة يتبادلهما اثنان ذهابًا وإيابًا أرخص ما يمكن صنعه، وهذا البرنامج يدفع مقابل تداول حقيقي بين أشخاص حقيقيين. والمبادلة التي يُترك فيها أي تقييم فارغًا تُعدّ دون الحد.",
  paysOwnDeals:
    "لا تربح شيئًا من صفقة كنت طرفًا فيها، والصفقات التي تُفتح لمجرد توليد أرصدة تُلغى.",
  paysRequest: "اطلب دفعتك ←",
  paysToGo: "بقيت {n} {noun} ويمكنك طلب دفعة.",
  dealSingular: "صفقة مكتملة",
  dealPlural: "صفقات مكتملة",
  completedDeals: "{n} {noun} دفعت لك",

  introducedTitle: "من أدخلتهم",
  introducedBody: "كل من سجّل برمزك، وكم ربّحك كلٌّ منهم.",
  introducedEmptyTitle: "لم يستخدم أحد رمزك بعد",
  introducedEmptyBody:
    "أرسل الرابط أعلاه لأي شخص يتداول حسابات eFootball. لا يستطيعون إنشاء حساب بلا رمز من أحد، فرمزك مثل أي رمز آخر تمامًا.",
  joined: "انضم في",
  noDealsYet: "لا صفقات دفعت لك بعد",

  creditsTitle: "أحدث الأرصدة",
  creditsLead: "آخر",
  creditsMid: ". وصفحة",
  creditsLink: "رصيدك",
  creditsTail: "فيها القائمة كاملة.",

  byTitle: "أدخلك إلى الموقع",
  byLead: "يربح",
  byTail: "في كل مرة تُتمّ فيها مبادلة. ولا يكلفك ذلك شيئًا.",
};

export const REFERRALS: Record<Locale, typeof referralsEn> = { en: referralsEn, ar: referralsAr };
