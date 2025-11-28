export type Lang = 'fr' | 'ar';

const translations: Record<Lang, Record<string, string | Record<string,string>>> = {
  fr: {
    welcome_title: 'Bienvenue au Portail SHM',
    welcome_subtitle: 'Sélectionnez votre profil pour accéder aux ressources appropriées',
    member: 'Membre',
    chef: 'Chef',
    member_cta: 'Continuer en tant que Membre',
    chef_cta: 'Continuer en tant que Chef',
    create_account: 'Créer un compte',
    step_of: 'Étape {step} de {total}',
    tutor: 'Tuteur',
    dob_invalid: "Date de naissance invalide.",
    dob_label: 'Date de naissance',
    required_fields: 'Champ(s) obligatoires manquant(s) : {fields}',
    fill_all_fields: 'Veuillez remplir tous les champs.',
    passwords_mismatch: 'Les mots de passe ne correspondent pas.',
    created_success: 'Compte créé avec succès',
    your_id: 'Votre identifiant :',
    niche_sans: '(sans niche)',
    login_title: 'Se connecter',
    login_subtitle: 'Accédez à votre espace SHM Portal',
    id_label: 'ID (ex: E0001)',
    first_name: 'Prénom',
    last_name: 'Nom',
    password_label: 'Mot de passe',
    confirm_password: 'Confirmer le mot de passe',
    signin_button: 'Se connecter',
    signing_in: 'Connexion…',
    forgot_password: 'Mot de passe oublié?',
    cin: 'CIN',
    registering: 'Enregistrement…',
    register_button: 'Créer le compte',
    niche_labels: {
      actualites: 'Actualités',
      organisation: 'Organisation',
      projet: 'Projet',
      rapports: 'Rapports',
      lois: 'Lois'
    },
    roles: {
      membre: 'Membre',
      chef_niche: 'Chef de niches',
      sous_chef: 'Sous-chef',
      chef_superieur: 'Chef supérieur'
    },
    chefs_title: 'Chefs',
    chefs_subtitle: 'Liste et évaluations des chefs.',
    niche_sup_label: 'Niche supérieure',
    niche_super_label: 'Niche Supérieure',
    niche_principale: 'Niche principale'
  },
  ar: {
    welcome_title: 'مرحبا بكم في بوابة SHM',
    welcome_subtitle: 'اختر ملفك للوصول إلى الموارد المناسبة',
    member: 'عضو',
    chef: 'قائد/قادة',
    member_cta: 'المتابعة كعضو',
    chef_cta: 'المتابعة كقائد',
    create_account: 'إنشاء حساب',
    step_of: 'المرحلة {step} من {total}',
    tutor: 'الوكيل/الولي',
    dob_invalid: 'تاريخ الميلاد غير صالح.',
    dob_label: 'تاريخ الميلاد',
    required_fields: 'حقول إجبارية مفقودة: {fields}',
    fill_all_fields: 'المرجو تعبئة جميع الحقول.',
    passwords_mismatch: 'كلمتا المرور غير متطابقتين.',
    created_success: 'تم إنشاء الحساب بنجاح',
    your_id: 'معرّفك:',
    niche_sans: '(بدون خلية)',
    login_title: 'تسجيل الدخول',
    login_subtitle: 'ادخل إلى مساحة بوابة SHM الخاصة بك',
    id_label: 'مع��ّف (مثال: E0001)',
    first_name: 'الاسم',
    last_name: 'اللقب',
    password_label: 'كلمة المرور',
    confirm_password: 'تأكيد كلمة المرور',
    signin_button: 'تسجيل الدخول',
    signing_in: 'جاري تسجيل الدخول…',
    forgot_password: 'هل نسيت كلمة المرور؟',
    cin: 'بطاقة الهوية (CIN)',
    registering: 'جاري الإنشاء…',
    register_button: 'إنشاء الحساب',
    niche_labels: {
      actualites: 'أخبار',
      organisation: 'منظمة',
      projet: 'مشروع',
      rapports: 'تقارير',
      lois: 'قوانين'
    },
    roles: {
      membre: 'عضو',
      chef_niche: 'رئيس خلية',
      sous_chef: 'قائد',
      chef_superieur: 'قائد أعلى'
    },
    chefs_title: 'القادة',
    chefs_subtitle: 'قائمة وتقييمات القادة.',
    niche_sup_label: 'خلية عليا',
    niche_super_label: 'خلية عليا',
    niche_principale: 'الخلية الرئيسية'
  }
};

function detectLang(): Lang {
  try {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const q = params.get('lang');
    if (q === 'ar') return 'ar';
    const htmlLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
    if (htmlLang && htmlLang.startsWith('ar')) return 'ar';
  } catch (e) {}
  return 'fr';
}

const lang = detectLang();

export function t(key: string, vars?: Record<string, string | number>) {
  const node = translations[lang] as any;
  const val = node && node[key];
  if (typeof val === 'string') {
    if (!vars) return val;
    let s = val;
    Object.keys(vars).forEach(k => { s = s.replace(`{${k}}`, String(vars[k])); });
    return s;
  }
  return val ?? key;
}

export function tRoles(): Record<string,string> {
  return (translations[lang] as any).roles || {};
}

export function tNiches(): Record<string,string> {
  return (translations[lang] as any).niche_labels || {};
}

export function currentLang() { return lang; }
