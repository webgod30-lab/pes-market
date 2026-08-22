// Copy for the four auth pages (/login, /register, /forgot-password,
// /reset-password) and the shared pieces they're built from — the shell,
// the two forms, and the recovery-routes list.
//
// Same shape as lib/page-copy.ts: an English object, an Arabic object typed
// against it, and a Record<Locale, ...> export. Kept in its own file because
// the auth pages pull from four or five separate copy blocks each, and mixing
// all of that into page-copy.ts would make one already-long file the place
// two unrelated things go to get lost.
import type { Locale } from "@/lib/locale";

// ---------------------------------------------------------------------------
// /login
// ---------------------------------------------------------------------------

const loginPageEn = {
  title: "Welcome back",
  subtitleNext: "Sign in to continue to where you were headed.",
  subtitleDefault: "Sign in to see your deals and what each one is waiting on.",
  noAccount: "No account yet?",
  createOne: "Create one",
  aside: "We will never ask for your password anywhere except this page. Check the address bar before typing it.",
};

const loginPageAr: typeof loginPageEn = {
  title: "أهلًا بعودتك",
  subtitleNext: "سجّل الدخول لتكمل إلى حيث كنت متوجهًا.",
  subtitleDefault: "سجّل الدخول لترى صفقاتك وما ينتظر كل واحدة منها.",
  noAccount: "لا حساب لديك بعد؟",
  createOne: "أنشئ واحدًا",
  aside: "لن نطلب كلمة مرورك أبدًا في أي مكان غير هذه الصفحة. تحقق من شريط العنوان قبل كتابتها.",
};

export const LOGIN_PAGE: Record<Locale, typeof loginPageEn> = { en: loginPageEn, ar: loginPageAr };

// ---------------------------------------------------------------------------
// /register
// ---------------------------------------------------------------------------

const registerPageEn = {
  title: "Create your account",
  subtitle: "Everyone here arrived through somebody. Paste their code to join.",
  alreadyRegistered: "Already registered?",
  signIn: "Sign in",
  asideLead: "By creating an account you agree to the",
  asideTerms: "terms",
  asideAnd: "and the",
  asidePrivacy: "privacy policy",
};

const registerPageAr: typeof registerPageEn = {
  title: "أنشئ حسابك",
  subtitle: "كل من هنا وصل عبر شخص ما. الصق رمزه لتنضم.",
  alreadyRegistered: "مسجّل بالفعل؟",
  signIn: "سجّل الدخول",
  asideLead: "بإنشائك حسابًا فإنك توافق على",
  asideTerms: "الشروط",
  asideAnd: "و",
  asidePrivacy: "سياسة الخصوصية",
};

export const REGISTER_PAGE: Record<Locale, typeof registerPageEn> = {
  en: registerPageEn,
  ar: registerPageAr,
};

// ---------------------------------------------------------------------------
// /forgot-password and /reset-password
// ---------------------------------------------------------------------------

const forgotPasswordPageEn = {
  title: "Locked out?",
  subtitle: "What to do depends on which part you have lost.",
  remembered: "Remembered it?",
  backToSignIn: "Back to sign in",
  aside: "We will never email you a password reset link. If you receive one, it did not come from us — do not open it.",
};

const forgotPasswordPageAr: typeof forgotPasswordPageEn = {
  title: "نسيت طريقة الدخول؟",
  subtitle: "ما تفعله يعتمد على أي جزء فقدته.",
  remembered: "تذكّرتها؟",
  backToSignIn: "عد لتسجيل الدخول",
  aside: "لن نرسل لك أبدًا رابط إعادة تعيين كلمة مرور عبر البريد. إن وصلك واحد، فهو ليس منا — لا تفتحه.",
};

export const FORGOT_PASSWORD_PAGE: Record<Locale, typeof forgotPasswordPageEn> = {
  en: forgotPasswordPageEn,
  ar: forgotPasswordPageAr,
};

const resetPasswordPageEn = {
  titleForged: "That link did not come from us",
  titleDefault: "Reset your password",
  subtitleForged: "Do not enter your password on the page that sent you here.",
  subtitleDefault: "There is no automated reset on this service — here is what does work.",
  goTo: "Go to",
  signInInstead: "sign in",
  instead: "instead",
  aside: "Your password is only ever typed on pesescrow.com. Check the address bar before you type it anywhere.",
  alertTitle: "This service has never sent a password reset email.",
  alertBody: "It cannot — there is no mail provider connected to it and no reset link is ever generated. Whatever sent you here is impersonating us. Do not enter your password or your recovery codes anywhere it asks. If you already have, change your password from",
  alertSecurity: "your security settings",
  alertTail: "as soon as you can sign in, and tell us.",
};

const resetPasswordPageAr: typeof resetPasswordPageEn = {
  titleForged: "هذا الرابط لم يصلك منّا",
  titleDefault: "أعد تعيين كلمة المرور",
  subtitleForged: "لا تُدخل كلمة مرورك في الصفحة التي أرسلتك إلى هنا.",
  subtitleDefault: "لا توجد إعادة تعيين تلقائية في هذه الخدمة — إليك ما يعمل فعلًا.",
  goTo: "اذهب إلى",
  signInInstead: "تسجيل الدخول",
  instead: "بدلًا من ذلك",
  aside: "كلمة مرورك تُكتب فقط على pesescrow.com. تحقق من شريط العنوان قبل أن تكتبها في أي مكان.",
  alertTitle: "هذه الخدمة لم ترسل قط بريد إعادة تعيين كلمة مرور.",
  alertBody: "لا يمكنها ذلك — لا يوجد مزود بريد متصل بها ولا يُنشأ أي رابط إعادة تعيين على الإطلاق. ما أرسلك إلى هنا ينتحل صفتنا. لا تُدخل كلمة مرورك ولا رموز الاسترجاع في أي مكان يطلبها. إذا كنت قد فعلت ذلك بالفعل، غيّر كلمة مرورك من",
  alertSecurity: "إعدادات الأمان",
  alertTail: "بمجرد أن تتمكن من تسجيل الدخول، وأخبرنا بذلك.",
};

export const RESET_PASSWORD_PAGE: Record<Locale, typeof resetPasswordPageEn> = {
  en: resetPasswordPageEn,
  ar: resetPasswordPageAr,
};

// ---------------------------------------------------------------------------
// NoResetNotice / RecoveryRoutes — shared by /forgot-password and /reset-password
// ---------------------------------------------------------------------------

const recoveryEn = {
  noticeTitle: "There is no automated reset yet.",
  noticeBody: "This service does not send email, so it cannot send you a reset link. Recovering an account is done by hand, by a person. It is not fast, but it is not lost either.",

  step1Title: "Lost your authenticator, but know your password",
  step1Action: "Sign in with a recovery code",
  step1Body: "Enter your email and password as usual. When the code is asked for, type one of the recovery codes you saved when you turned two-factor on — each works once, in place of a code from the app.",

  step2Title: "Forgotten your password",
  step2Action: "Get in touch",
  step2Body: "Message us from the address on the account",
  step2BodyTail: "Have a deal reference to hand if you have ever opened one; it is the fastest way to show the account is yours.",

  step3Title: "A deal is waiting on you right now",
  step3Body: "Say so in that first message. A deal you cannot reach is not running out of time silently — tell us and it gets held while this is sorted.",
};

const recoveryAr: typeof recoveryEn = {
  noticeTitle: "لا توجد إعادة تعيين تلقائية بعد.",
  noticeBody: "هذه الخدمة لا ترسل بريدًا، فلا تستطيع إرسال رابط إعادة تعيين. استرجاع الحساب يتم يدويًا، بواسطة شخص. الأمر ليس سريعًا، لكنه ليس ضائعًا أيضًا.",

  step1Title: "فقدت جهاز المصادقة، لكنك تعرف كلمة مرورك",
  step1Action: "سجّل الدخول برمز استرجاع",
  step1Body: "أدخل بريدك وكلمة مرورك كالمعتاد. وعندما يُطلب الرمز، اكتب أحد رموز الاسترجاع التي حفظتها عند تفعيل المصادقة الثنائية — كل رمز يعمل مرة واحدة، بدل رمز من التطبيق.",

  step2Title: "نسيت كلمة مرورك",
  step2Action: "تواصل معنا",
  step2Body: "راسلنا من العنوان المسجَّل على الحساب",
  step2BodyTail: "أحضر مرجع صفقة إن كنت قد فتحت واحدة من قبل؛ فهذا أسرع طريقة لإثبات أن الحساب لك.",

  step3Title: "توجد صفقة تنتظرك الآن",
  step3Body: "قل ذلك في رسالتك الأولى. الصفقة التي لا يمكنك الوصول إليها لا ينفد وقتها بصمت — أخبرنا وستُجمَّد ريثما تُحل المشكلة.",
};

export const RECOVERY_COPY: Record<Locale, typeof recoveryEn> = { en: recoveryEn, ar: recoveryAr };

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------

const loginFormEn = {
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  forgotPassword: "Forgot password?",
  totpLabel: "Authentication code",
  totpHint: "The six-digit code from your authenticator app, or one of your recovery codes.",
  totpPlaceholder: "123456",
  signingIn: "Signing in…",
  verifyAndSignIn: "Verify and sign in",
  signIn: "Sign in",
};

const loginFormAr: typeof loginFormEn = {
  emailLabel: "البريد الإلكتروني",
  emailPlaceholder: "you@example.com",
  passwordLabel: "كلمة المرور",
  forgotPassword: "نسيت كلمة المرور؟",
  totpLabel: "رمز المصادقة",
  totpHint: "الرمز المكوّن من ستة أرقام من تطبيق المصادقة، أو أحد رموز الاسترجاع.",
  totpPlaceholder: "123456",
  signingIn: "جارٍ تسجيل الدخول…",
  verifyAndSignIn: "تحقق وسجّل الدخول",
  signIn: "تسجيل الدخول",
};

export const LOGIN_FORM: Record<Locale, typeof loginFormEn> = { en: loginFormEn, ar: loginFormAr };

// ---------------------------------------------------------------------------
// RegisterForm
// ---------------------------------------------------------------------------

const registerFormEn = {
  referralLabel: "Promoter's code",
  referralHint: "Looks like PES-7F3K9Q. Whoever invited you has one.",
  referralPlaceholder: "PES-XXXXXX",
  nameLabel: "Display name",
  nameHint: "What the other party and the admin will see.",
  namePlaceholder: "Your name or handle",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordHint: "At least 8 characters. Length matters more than symbols.",
  noResetBold: "There is no password reset yet.",
  noResetBody: "Use a password manager, or pick something you will not forget —",
  noResetLink: "recovering an account",
  noResetTail: "currently means contacting us.",
  creatingAccount: "Creating account…",
  createAccount: "Create account",
  footNote: "One account covers both sides of a swap — and comes with a promoter code of your own, so you can earn from everyone you bring in.",
};

const registerFormAr: typeof registerFormEn = {
  referralLabel: "رمز الداعي",
  referralHint: "شكله مثل PES-7F3K9Q. من دعاك يملك واحدًا.",
  referralPlaceholder: "PES-XXXXXX",
  nameLabel: "الاسم المعروض",
  nameHint: "ما سيراه الطرف الآخر والمشرف.",
  namePlaceholder: "اسمك أو معرّفك",
  emailLabel: "البريد الإلكتروني",
  emailPlaceholder: "you@example.com",
  passwordLabel: "كلمة المرور",
  passwordHint: "٨ أحرف على الأقل. الطول أهم من الرموز.",
  noResetBold: "لا توجد إعادة تعيين لكلمة المرور بعد.",
  noResetBody: "استخدم مدير كلمات مرور، أو اختر ما لن تنساه —",
  noResetLink: "استرجاع حساب",
  noResetTail: "يعني حاليًا التواصل معنا.",
  creatingAccount: "جارٍ إنشاء الحساب…",
  createAccount: "أنشئ حسابًا",
  footNote: "حساب واحد يغطي طرفي المبادلة — ويأتي برمز داعٍ خاص بك، فتربح من كل من تدعوه.",
};

export const REGISTER_FORM: Record<Locale, typeof registerFormEn> = {
  en: registerFormEn,
  ar: registerFormAr,
};
