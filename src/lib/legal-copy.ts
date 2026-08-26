// Copy for /terms and /privacy.
//
// The Arabic text here is a machine translation of the English original,
// reviewed for fluency but not by a lawyer. The English version is the
// authoritative one; the Arabic page carries its own notice saying so, on
// top of the existing "this is a template, not legal advice" notice both
// languages already show when the operator details in lib/site.ts are
// still placeholders.
import type { Locale } from "@/lib/locale";

const arabicTranslationNoticeEn = "";
const arabicTranslationNoticeAr =
  "هذه ترجمة آلية للنسخة الإنجليزية من هذه الصفحة، لم تُراجَع من محامٍ. النسخة الإنجليزية هي المرجع القانوني المعتمد عند أي تعارض.";

export const LEGAL_TRANSLATION_NOTICE: Record<Locale, string> = {
  en: arabicTranslationNoticeEn,
  ar: arabicTranslationNoticeAr,
};

// ---------------------------------------------------------------------------
// /terms
// ---------------------------------------------------------------------------

const termsPageEn = {
  title: "Terms of service",
  templateNoticeBold: "This is a template, not legal advice.",
  templateNoticeBody:
    "It is written to describe how this service actually behaves, which is the useful half — but it still needs a lawyer who knows your jurisdiction to review it before you run this with real users. Fill in the operator details in",
  templateNoticeTail: "first; they are referenced throughout this page.",
  s1Title: "1. What this service is",
  s1p1: (name: string, operator: string) =>
    `${name} is an escrow service operated by ${operator}. It holds both accounts in a swap until each has been checked, acting as a neutral third party between two people who have already agreed to trade elsewhere.`,
  s1p2Lead:
    "We do not sell, list, advertise or broker game accounts. We are not party to your agreement with the other person; we hold and release what you both place with us according to the process described in",
  s1p2Link: "How it works",
  s2Title: "2. Who may use it",
  s2Points: [
    "You must be old enough to enter a binding contract where you live.",
    "One account per person. Accounts are personal and may not be shared or sold.",
    "You may not be both sides of the same deal, directly or through another account.",
    "You must give accurate information, including about the account being traded.",
  ],
  s3Title: "3. Account trading carries risks we cannot remove",
  s3p1: "Most game publishers, including Konami, prohibit the sale or transfer of accounts under their own terms of service. A publisher may suspend, reclaim or ban a traded account at any time. We have no relationship with any publisher and no ability to prevent, reverse or appeal that.",
  s3p2: "Escrow protects you from the other person in the trade. It does not protect you from the publisher, and it does not make account trading permitted by them. You use this service understanding that risk, and you accept it.",
  s4Title: "4. Fees",
  s4p1: "We charge nothing. Trades on this service are account-for-account, so there is no price to take a percentage of, and we never ask either party for payment. If that ever changes, it will apply only to deals created after the change.",
  s5Title: "5. Accounts held and released",
  s5Points: (hours: number) => [
    "Both parties deposit their account credentials, which we hold encrypted and release only after we have checked both accounts.",
    "We release each side's credentials to the other after both have been verified, or after a dispute is decided.",
    `Each party has ${hours} hours from the release of credentials to confirm or raise a dispute.`,
    "No money passes between the parties on this service, and we hold no funds on anyone's behalf.",
    "Anything agreed or exchanged outside a deal on this service is not covered by anything on this page.",
  ],
  s5aTitle: "5a. Referral programme",
  s5aPoints: [
    "An account can only be created using a valid promoter code issued by an existing account.",
    "Every account receives a promoter code of its own on registration.",
    "We credit a promoter $2 each time a person who registered with their code completes a swap in which both accounts were recorded with a squad rating above 3000. Both parties to such a deal credit their own promoter separately.",
    "A deal in which either account's rating is 3000 or below, or was not recorded at the time the deal was opened, earns no credit for anyone. This does not affect the deal itself, which is escrowed on the same terms either way.",
    "A promoter earns nothing from a deal they were themselves a party to.",
    "Credits are payable once a promoter's balance reaches $40. Requests may be made on any day and are paid in one batch on the 1st of each month.",
    "Credits for a deal are withdrawn if that deal is later reversed. If the promoter has already been paid, the amount is recovered from later credits before any further payout.",
    "We may refuse or reverse credits we believe were generated by deals arranged solely to obtain them, and may suspend an account that does so.",
  ],
  s5bTitle: "5b. Payment of credits",
  s5bp1: "Credits are payable in US dollars once the balance reaches the applicable minimum. The promoter selects a payout method from those offered at the time of payment, currently USDT (TRC-20), PayPal, or a gift card of the promoter's choice from the available list. We meet the cost of sending; any conversion, withdrawal, or receiving cost charged by the promoter's own provider is the promoter's responsibility.",
  s5bp2: "The promoter is responsible for the accuracy of the payment details they supply. Payments sent to an address or account provided by the promoter are treated as delivered, and cryptocurrency transfers cannot be reversed. On a first payout we send a nominal test amount for confirmation before releasing the balance.",
  s5bp3: "We may change the available payout methods, and will give notice before a change affects a pending balance. A promoter is responsible for any tax due in their own country on amounts received.",
  s6Title: "6. Disputes",
  s6p1: "Either party may open a dispute on a deal once accounts have been deposited. This freezes the deal entirely. We decide from the record available to us: the two account descriptions agreed at the start, our own verification of both accounts, and the messages on the deal.",
  s6p2: "Our decision on whether to release or return the credentials we hold is final as regards those credentials. It is not a legal judgment and does not affect any other rights you may have against the other party.",
  s7Title: "7. What is not allowed",
  s7Points: [
    "Trading accounts you do not own, or that were obtained by fraud, phishing or account theft.",
    "Recovering, reclaiming or interfering with an account after depositing it for a deal.",
    "Opening deals whose purpose is to generate referral credits rather than to trade an account.",
    "Creating additional accounts to obtain or multiply referral credits.",
    "Using the service for any transaction that is illegal where you are.",
    "Abuse, threats or harassment of the other party or of us.",
  ],
  s7p1: "We may suspend or ban an account for any of the above. Where a banned user has deals in progress, we will still resolve those deals fairly rather than keeping either account.",
  s8Title: "8. Limits of our responsibility",
  s8p1: "We provide this service carefully but without warranty. We hold no money for you, so there is no sum we can return: to the extent the law allows, our responsibility for a deal is limited to handling the credentials you place with us according to the process described here. We are not responsible for publisher action against an account, for the condition or value of an account traded through us, for losses on deals conducted outside this service, or for indirect losses.",
  s8p2: "Nothing here limits liability that cannot lawfully be limited, including for fraud.",
  s9Title: "9. Changes and contact",
  s9p1: (jurisdiction: string) =>
    `We may update these terms. Material changes will not be applied retroactively to deals already open. These terms are governed by the law of ${jurisdiction}.`,
  s9p2Lead: "Questions:",
  s9p2Link: "contact us",
};

const termsPageAr: typeof termsPageEn = {
  title: "شروط الخدمة",
  templateNoticeBold: "هذا نموذج، وليس استشارة قانونية.",
  templateNoticeBody:
    "كُتب ليصف كيف تتصرف هذه الخدمة فعليًا، وهو النصف المفيد — لكنه لا يزال يحتاج مراجعة محامٍ يعرف نطاقك القضائي قبل أن تشغّل هذا مع مستخدمين حقيقيين. املأ تفاصيل المُشغِّل في",
  templateNoticeTail: "أولًا؛ يُشار إليها في هذه الصفحة كلها.",
  s1Title: "١. ما هي هذه الخدمة",
  s1p1: (name: string, operator: string) =>
    `${name} خدمة ضمان يديرها ${operator}. تحتفظ بحسابي المبادلة حتى يُفحص كلاهما، فتعمل كطرف ثالث محايد بين شخصين اتفقا بالفعل على التداول في مكان آخر.`,
  s1p2Lead:
    "نحن لا نبيع الحسابات ولا نُدرجها ولا نعلن عنها ولا نتوسط فيها. لسنا طرفًا في اتفاقك مع الشخص الآخر؛ نحتفظ بما يودعه كلاكما لدينا ونسلّمه وفق العملية الموضحة في",
  s1p2Link: "كيف تعمل الخدمة",
  s2Title: "٢. من يحق له استخدامها",
  s2Points: [
    "يجب أن تكون بالغًا سنًا يخوّلك الدخول في عقد ملزم في مكان إقامتك.",
    "حساب واحد لكل شخص. الحسابات شخصية ولا يجوز مشاركتها أو بيعها.",
    "لا يجوز أن تكون طرفي الصفقة نفسها، مباشرة أو عبر حساب آخر.",
    "يجب أن تقدّم معلومات دقيقة، بما في ذلك عن الحساب المتداوَل.",
  ],
  s3Title: "٣. تداول الحسابات ينطوي على مخاطر لا نستطيع إزالتها",
  s3p1: "معظم ناشري الألعاب، ومنهم كونامي، يمنعون بيع الحسابات أو نقلها بموجب شروط خدمتهم الخاصة. يستطيع الناشر تعليق حساب متداوَل أو استعادته أو حظره في أي وقت. ليست لنا أي علاقة بأي ناشر ولا قدرة على منع ذلك أو التراجع عنه أو الاستئناف ضده.",
  s3p2: "الضمان يحميك من الطرف الآخر في الصفقة. لا يحميك من الناشر، ولا يجعل تداول الحسابات مسموحًا من قِبله. تستخدم هذه الخدمة وأنت مدرك لتلك المخاطرة، وتقبلها.",
  s4Title: "٤. الرسوم",
  s4p1: "لا نتقاضى شيئًا. الصفقات على هذه الخدمة هي حساب مقابل حساب، فلا يوجد سعر تُؤخذ منه نسبة، ولا نطلب دفعًا من أي طرف أبدًا. إذا تغيّر ذلك يومًا، فسيسري فقط على الصفقات المُنشأة بعد التغيير.",
  s5Title: "٥. الحسابات المحتجزة والمُسلَّمة",
  s5Points: (hours: number) => [
    "يودع الطرفان بيانات حساباتهما، ونحتفظ بها مشفَّرة ولا نسلّمها إلا بعد التحقق من الحسابين.",
    "نسلّم بيانات كل طرف للآخر بعد التحقق من كليهما، أو بعد حسم النزاع.",
    `لكل طرف ${hours} ساعة من لحظة تسليم البيانات ليؤكد أو يفتح نزاعًا.`,
    "لا يتبادل الطرفان أي مال على هذه الخدمة، ولا نحتفظ بأي أموال نيابة عن أحد.",
    "أي شيء يُتفق عليه أو يُتبادل خارج صفقة على هذه الخدمة لا يغطيه أي شيء في هذه الصفحة.",
  ],
  s5aTitle: "٥أ. برنامج الدعوة",
  s5aPoints: [
    "لا يمكن إنشاء حساب إلا باستخدام رمز داعٍ صالح صادر عن حساب قائم.",
    "يحصل كل حساب على رمز داعٍ خاص به عند التسجيل.",
    "نمنح الداعي 2 دولار في كل مرة يُتمّ فيها شخص سجّل برمزه مبادلةً يكون تقييم الحسابين المسجَّل فيها أعلى من 3000. وكلا طرفي هذه الصفقة يمنحان داعيهما كل على حدة.",
    "الصفقة التي يكون فيها تقييم أي من الحسابين 3000 أو أقل، أو لم يُسجَّل عند فتح الصفقة، لا تمنح أحدًا أي رصيد. ولا يؤثر ذلك على الصفقة نفسها، فهي تُحفظ بالضمان بنفس الشروط في الحالتين.",
    "لا يربح الداعي شيئًا من صفقة كان هو نفسه طرفًا فيها.",
    "الأرصدة قابلة للسحب بمجرد أن يبلغ رصيد الداعي 40 دولارًا. يمكن تقديم الطلب في أي يوم، وتُدفع دفعة واحدة في الأول من كل شهر.",
    "تُسحب أرصدة الصفقة إذا أُلغيت تلك الصفقة لاحقًا. وإذا كان الداعي قد استلم دفعته بالفعل، يُسترد المبلغ من أرصدة لاحقة قبل أي دفعة أخرى.",
    "يجوز لنا رفض أو استرداد أرصدة نعتقد أنها نشأت من صفقات دُبّرت فقط للحصول عليها، ويجوز لنا تعليق حساب يفعل ذلك.",
  ],
  s5bTitle: "٥ب. دفع الأرصدة",
  s5bp1: "تُدفع الأرصدة بالدولار الأمريكي بمجرد أن يبلغ الرصيد الحد الأدنى المعمول به. يختار الداعي طريقة دفع من بين ما يُعرض وقت الدفع، وهي حاليًا USDT (TRC-20) أو PayPal أو بطاقة هدايا من القائمة المتاحة يختارها الداعي. نتحمل تكلفة الإرسال؛ أي تكلفة تحويل أو سحب أو استلام يفرضها مزود الداعي نفسه هي مسؤولية الداعي.",
  s5bp2: "الداعي مسؤول عن دقة تفاصيل الدفع التي يقدّمها. تُعامل الدفعات المُرسلة إلى عنوان أو حساب قدّمه الداعي على أنها سُلّمت، ولا يمكن التراجع عن تحويلات العملات الرقمية. في أول دفعة نرسل مبلغًا رمزيًا للتأكيد قبل إطلاق الرصيد.",
  s5bp3: "يجوز لنا تغيير طرق الدفع المتاحة، وسنُشعر قبل أن يؤثر أي تغيير على رصيد معلَّق. الداعي مسؤول عن أي ضريبة مستحقة في بلده على المبالغ المستلمة.",
  s6Title: "٦. النزاعات",
  s6p1: "يستطيع أي طرف فتح نزاع على صفقة بمجرد إيداع الحسابين. هذا يجمّد الصفقة تمامًا. نقرر من السجل المتاح لدينا: وصفا الحسابين المتفق عليهما في البداية، وتحققنا الخاص من الحسابين، والرسائل على الصفقة.",
  s6p2: "قرارنا بشأن تسليم بيانات الحسابات التي نحتفظ بها أو إعادتها نهائي فيما يخص تلك البيانات. وهو ليس حكمًا قانونيًا ولا يؤثر على أي حقوق أخرى قد تملكها تجاه الطرف الآخر.",
  s7Title: "٧. ما هو غير مسموح",
  s7Points: [
    "تداول حسابات لا تملكها، أو حصلت عليها عبر احتيال أو تصيّد أو سرقة حساب.",
    "استرجاع حساب أو استرداده أو التدخل فيه بعد إيداعه لصفقة.",
    "فتح صفقات غرضها توليد أرصدة دعوة لا تداول حساب.",
    "إنشاء حسابات إضافية للحصول على أرصدة دعوة أو مضاعفتها.",
    "استخدام الخدمة في أي معاملة غير قانونية في مكانك.",
    "الإساءة أو التهديد أو المضايقة للطرف الآخر أو لنا.",
  ],
  s7p1: "يجوز لنا تعليق حساب أو حظره لأي مما سبق. وإذا كان لمستخدم محظور صفقات جارية، فسنُسوّي تلك الصفقات بإنصاف بدلًا من الاحتفاظ بأي من الحسابين.",
  s8Title: "٨. حدود مسؤوليتنا",
  s8p1: "نقدّم هذه الخدمة بعناية لكن بلا ضمان. لا نحتفظ بأي مال نيابة عنك، فلا يوجد مبلغ يمكننا إعادته: وبقدر ما يسمح به القانون، تقتصر مسؤوليتنا عن أي صفقة على التعامل مع البيانات التي تودعها لدينا وفق العملية الموضحة هنا. لسنا مسؤولين عن إجراء الناشر ضد حساب، ولا عن حالة أو قيمة حساب متداوَل عبرنا، ولا عن خسائر في صفقات تمت خارج هذه الخدمة، ولا عن خسائر غير مباشرة.",
  s8p2: "لا شيء هنا يحدّ من مسؤولية لا يجوز قانونًا الحد منها، بما في ذلك الاحتيال.",
  s9Title: "٩. التغييرات والتواصل",
  s9p1: (jurisdiction: string) =>
    `يجوز لنا تحديث هذه الشروط. لن تُطبَّق التغييرات الجوهرية بأثر رجعي على الصفقات المفتوحة بالفعل. تخضع هذه الشروط لقانون ${jurisdiction}.`,
  s9p2Lead: "أسئلة:",
  s9p2Link: "تواصل معنا",
};

export const TERMS_PAGE: Record<Locale, typeof termsPageEn> = { en: termsPageEn, ar: termsPageAr };

// ---------------------------------------------------------------------------
// /privacy
// ---------------------------------------------------------------------------

const privacyPageEn = {
  title: "Privacy policy",
  templateNoticeBold: "This is a template, not legal advice.",
  templateNoticeBody:
    "It accurately describes what the software does with data, which is the part most policies get wrong — but it needs review against the privacy law that applies to you (GDPR, UK GDPR, CCPA and others differ). Fill in the operator details in",
  templateNoticeTail: "; naming who controls the data is a legal requirement in most places.",
  whoControlsTitle: "Who controls your data",
  whoControls: (operator: string, name: string, jurisdiction: string, email: string) =>
    `${operator}, operating ${name} from ${jurisdiction}. Contact us at ${email} about anything on this page.`,
  whatWeCollectTitle: "What we collect",
  accountLabel: "Your account:",
  accountBody: "email address, display name, and a hashed password. We never store your password itself — only a bcrypt hash, which cannot be reversed back into it.",
  dealsLabel: "Deals:",
  dealsBody: "what was traded, the agreed price, who the parties are, timestamps, and every state change.",
  credentialsLabel: "Game account credentials:",
  credentialsBody: "the login the seller deposits, encrypted (see below).",
  paymentRefsLabel: "Payment references:",
  paymentRefsBody: "the transaction hash or reference you give us so we can match a payment. We do not collect or store card numbers — no card details ever pass through this service.",
  messagesLabel: "Messages and reviews",
  messagesBody: "you write on deals.",
  howProtectedTitle: "How account credentials are protected",
  howProtectedP1: "Credentials deposited for a deal are encrypted with AES-256-GCM before they are written to the database, using a key held outside it. They are decrypted in exactly two situations: for the administrator to verify the account works before releasing it, and for the buyer after that release is approved.",
  howProtectedP2: "They are never included in a page unless specifically requested by someone entitled to see them, never written to logs, and never sent to any third party. Database query logging is deliberately disabled so credentials cannot leak into log files.",
  whatIsPublicTitle: "What is public",
  whatIsPublicP1: "Reviews are public, along with the display names of the people involved and the rating. This is the point of them: it is how someone decides whether to trade with a stranger.",
  whatIsPublicP2: "Public pages never include email addresses, deal references, what was traded, or amounts. Choose a display name you are comfortable being seen — you are not required to use your real name.",
  whoWeShareTitle: "Who we share it with",
  whoWeShareP1: "We do not sell your data and we do not use it for advertising. It is shared only with the services needed to run this one: our database host, and — if you use an automatic payment method — the payment provider, which receives the amount and a deal reference. We share data with law enforcement only where legally required.",
  whoWeShareP2: "The other party to your deal sees your display name, your messages, and your reviews.",
  howLongTitle: "How long we keep it",
  howLongPoints: (hours: number) => [
    "Deal records are kept while the deal is open and afterwards as a record of the transaction, including for resolving later disputes.",
    `Credentials are kept for the deal they belong to. Once a deal is complete and the ${hours}-hour window has passed, you should have changed them anyway — change the email and password on any account you buy, immediately.`,
    "Messages and reviews are kept as part of the deal record.",
    "If you close your account, we remove your personal details but keep the minimum needed to show that past deals happened and were settled.",
  ],
  yourRightsTitle: "Your rights",
  yourRightsP1: "Depending on where you live, you may have the right to see the data we hold about you, correct it, ask us to delete it, or object to how we use it. Ask us and we will do it, subject to keeping what we genuinely need for deals that have happened and for legal obligations.",
  yourRightsP2: "One thing we cannot do is delete a review purely because it is unflattering. Removing bad reviews on request would make every good review worthless.",
  cookiesTitle: "Cookies",
  cookiesP1: "Two, and neither is used to identify you across the web. One holds your sign-in session so you stay signed in between pages; signing out clears it. The other remembers whether you chose the light or dark theme, and is set only if you press that button.",
  cookiesP2: "There is no advertising cookie and no third-party tracker on this site.",
  analyticsTitle: "Analytics",
  analyticsP1: "We count page views and measure how quickly pages load, through Vercel Analytics and Speed Insights. This records the page visited, the referring site, and coarse details like country, browser and device type.",
  analyticsP2: "It sets no cookie, assigns you no identifier, and cannot follow you to other websites, so there is nothing here to ask your consent for. We use it to see which pages people actually read and which ones are slow — not to build a picture of you. If that ever changes, this page changes with it, and you will be asked first.",
  analyticsP3: "The visit count shown on the home page is our own, and it is a counter rather than a log: one number per calendar month, incremented when the page loads. No row is written for your visit, and no address, browser or identifier is stored alongside it. That is also why it counts visits and not visitors — telling two people apart would mean marking you, which is the thing being avoided.",
  securityTitle: "Security, honestly stated",
  securityP1Lead: "Passwords are hashed, credentials are encrypted, and every action that moves money or releases an account is checked against who you are on the server rather than trusted from the browser. No system is perfect. If you find a problem, please",
  securityP1Link: "tell us",
  securityP1Tail: "rather than exploiting it — we would rather hear it from you.",
};

const privacyPageAr: typeof privacyPageEn = {
  title: "سياسة الخصوصية",
  templateNoticeBold: "هذا نموذج، وليس استشارة قانونية.",
  templateNoticeBody:
    "يصف بدقة ما يفعله البرنامج بالبيانات، وهو الجزء الذي تخطئ فيه معظم السياسات — لكنه يحتاج مراجعة مقابل قانون الخصوصية المعمول به لديك (GDPR وUK GDPR وCCPA وغيرها تختلف). املأ تفاصيل المُشغِّل في",
  templateNoticeTail: "؛ تسمية من يتحكم في البيانات مطلب قانوني في معظم الأماكن.",
  whoControlsTitle: "من يتحكم في بياناتك",
  whoControls: (operator: string, name: string, jurisdiction: string, email: string) =>
    `${operator}، يشغّل ${name} من ${jurisdiction}. تواصل معنا على ${email} بخصوص أي شيء في هذه الصفحة.`,
  whatWeCollectTitle: "ما نجمعه",
  accountLabel: "حسابك:",
  accountBody: "عنوان البريد، الاسم المعروض، وكلمة مرور مُجزّأة. لا نخزّن كلمة مرورك نفسها أبدًا — فقط تجزئة bcrypt لا يمكن عكسها إليها.",
  dealsLabel: "الصفقات:",
  dealsBody: "ما جرى تداوله، السعر المتفق عليه، من هما الطرفان، الطوابع الزمنية، وكل تغيير حالة.",
  credentialsLabel: "بيانات حساب اللعبة:",
  credentialsBody: "بيانات الدخول التي يودعها البائع، مشفَّرة (انظر أدناه).",
  paymentRefsLabel: "مراجع الدفع:",
  paymentRefsBody: "رمز المعاملة أو المرجع الذي تعطينا إياه لمطابقة دفعة. لا نجمع أو نخزّن أرقام البطاقات — لا تمر أي بيانات بطاقة عبر هذه الخدمة أبدًا.",
  messagesLabel: "الرسائل والتقييمات",
  messagesBody: "التي تكتبها على الصفقات.",
  howProtectedTitle: "كيف تُحمى بيانات الحساب",
  howProtectedP1: "البيانات المودعة لصفقة تُشفَّر بـ AES-256-GCM قبل كتابتها في قاعدة البيانات، باستخدام مفتاح محفوظ خارجها. يُفك تشفيرها في حالتين فقط: ليتحقق المشرف من أن الحساب يعمل قبل تسليمه، وللمشتري بعد الموافقة على ذلك التسليم.",
  howProtectedP2: "لا تُدرج أبدًا في صفحة إلا بطلب صريح من شخص له حق رؤيتها، ولا تُكتب في السجلات أبدًا، ولا تُرسل لأي طرف ثالث أبدًا. تسجيل استعلامات قاعدة البيانات مُعطَّل عمدًا حتى لا تتسرب البيانات إلى ملفات السجل.",
  whatIsPublicTitle: "ما هو عام",
  whatIsPublicP1: "التقييمات عامة، مع الأسماء المعروضة للأشخاص المعنيين والتقييم. هذا هو الغرض منها: هكذا يقرر أحدهم ما إذا كان سيتداول مع شخص غريب.",
  whatIsPublicP2: "الصفحات العامة لا تتضمن أبدًا عناوين البريد، أو مراجع الصفقات، أو ما جرى تداوله، أو المبالغ. اختر اسمًا معروضًا ترتاح لأن يُرى — لست مُلزمًا باستخدام اسمك الحقيقي.",
  whoWeShareTitle: "مع من نشاركها",
  whoWeShareP1: "نحن لا نبيع بياناتك ولا نستخدمها للإعلانات. تُشارَك فقط مع الخدمات اللازمة لتشغيل هذه الخدمة: مضيف قاعدة بياناتنا، و— إذا استخدمت طريقة دفع تلقائية — مزود الدفع، الذي يستلم المبلغ ومرجع الصفقة. نشارك البيانات مع جهات إنفاذ القانون فقط عند الإلزام القانوني.",
  whoWeShareP2: "الطرف الآخر في صفقتك يرى اسمك المعروض ورسائلك وتقييماتك.",
  howLongTitle: "كم من الوقت نحتفظ بها",
  howLongPoints: (hours: number) => [
    "تُحفظ سجلات الصفقة أثناء فتحها وبعده كسجل للمعاملة، بما في ذلك لحسم نزاعات لاحقة.",
    `تُحفظ البيانات للصفقة التي تخصها. بمجرد اكتمال الصفقة ومرور نافذة الـ ${hours} ساعة، كان ينبغي أن تكون قد غيّرتها على أي حال — غيّر البريد وكلمة المرور فورًا على أي حساب تشتريه.`,
    "تُحفظ الرسائل والتقييمات كجزء من سجل الصفقة.",
    "إذا أغلقت حسابك، نزيل بياناتك الشخصية لكن نحتفظ بالحد الأدنى اللازم لإظهار أن صفقات سابقة حدثت وسُوّيت.",
  ],
  yourRightsTitle: "حقوقك",
  yourRightsP1: "بحسب مكان إقامتك، قد يحق لك رؤية البيانات التي نحتفظ بها عنك، أو تصحيحها، أو طلب حذفها، أو الاعتراض على كيفية استخدامنا لها. اطلب منا وسنفعل ذلك، مع الاحتفاظ بما نحتاجه فعلًا لصفقات حدثت والتزامات قانونية.",
  yourRightsP2: "شيء واحد لا نستطيع فعله وهو حذف تقييم لمجرد أنه غير مُجامل. حذف التقييمات السيئة عند الطلب سيجعل كل تقييم جيد بلا قيمة.",
  cookiesTitle: "ملفات تعريف الارتباط",
  cookiesP1: "اثنان فقط، ولا يُستخدم أي منهما لتحديد هويتك عبر الويب. أحدهما يحمل جلسة تسجيل دخولك حتى تبقى مسجَّلًا بين الصفحات؛ وتسجيل الخروج يمسحه. والآخر يتذكر ما إذا اخترت المظهر الفاتح أو الداكن، ولا يُضبط إلا إذا ضغطت ذلك الزر.",
  cookiesP2: "لا يوجد كوكيز إعلاني ولا متتبّع طرف ثالث على هذا الموقع.",
  analyticsTitle: "التحليلات",
  analyticsP1: "نحصي مشاهدات الصفحات ونقيس سرعة تحميلها، عبر Vercel Analytics وSpeed Insights. هذا يسجّل الصفحة المُزارة، والموقع المُحيل، وتفاصيل عامة مثل الدولة والمتصفح ونوع الجهاز.",
  analyticsP2: "لا يضبط أي كوكيز، ولا يمنحك أي معرّف، ولا يستطيع تتبعك إلى مواقع أخرى، فلا شيء هنا يستدعي طلب موافقتك عليه. نستخدمه لمعرفة أي الصفحات يقرأها الناس فعلًا وأيها بطيء — لا لبناء صورة عنك. إذا تغيّر ذلك يومًا، ستتغيّر هذه الصفحة معه، وستُسأل أولًا.",
  analyticsP3: "عداد الزيارات المعروض على الصفحة الرئيسية هو عدّاد خاص بنا، وهو عدّاد لا سجل: رقم واحد لكل شهر تقويمي، يزداد عند تحميل الصفحة. لا يُكتب أي سطر لزيارتك، ولا يُخزَّن أي عنوان أو متصفح أو معرّف بجانبه. ولهذا يحسب الزيارات لا الزوار — فتمييز شخصين عن بعضهما يعني تعليمك، وهذا ما نتجنبه.",
  securityTitle: "الأمان، بصراحة",
  securityP1Lead: "كلمات المرور مُجزّأة، والبيانات مشفَّرة، وكل إجراء يحرّك مالًا أو يسلّم حسابًا يُتحقق منه في مقابل هويتك على الخادم لا بالثقة بما يرسله المتصفح. لا يوجد نظام كامل. إذا وجدت مشكلة، رجاءً",
  securityP1Link: "أخبرنا",
  securityP1Tail: "بدلًا من استغلالها — نفضّل أن نسمع بها منك.",
};

export const PRIVACY_PAGE: Record<Locale, typeof privacyPageEn> = {
  en: privacyPageEn,
  ar: privacyPageAr,
};
