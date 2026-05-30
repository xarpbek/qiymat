/* =========================================================
   Qiymat — main application
   Vanilla JS · Hash Router · localStorage · Chart.js
   ========================================================= */
'use strict';

/* ---------- DOM helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const el = (tag, attrs={}, children=[]) => {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const html = (strings, ...vals) => {
  let out = '';
  strings.forEach((s,i)=> out += s + (i < vals.length ? escapeHtml(vals[i]) : ''));
  return out;
};
const raw = (strings, ...vals) => strings.map((s,i)=> s + (vals[i] ?? '')).join('');
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = (p='id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

/* ---------- Constants ---------- */
const SUPPORTED_CURRENCIES = ['UZS','USD','EUR','RUB','KZT','CNY','GBP','AED','TRY'];

const DEFAULT_CATEGORIES = [
  // Expenses
  { id:'c_food',    name:'Oziq-ovqat',  emoji:'🍔', color:'#f97316', type:'expense' },
  { id:'c_transport',name:'Transport',  emoji:'🚗', color:'#3b82f6', type:'expense' },
  { id:'c_home',    name:'Uy-joy',      emoji:'🏠', color:'#10b981', type:'expense' },
  { id:'c_util',    name:'Kommunal',    emoji:'💡', color:'#eab308', type:'expense' },
  { id:'c_shop',    name:'Xarid',       emoji:'🛒', color:'#a855f7', type:'expense' },
  { id:'c_fun',     name:'Ko\'ngilochar',emoji:'🎬',color:'#ec4899', type:'expense' },
  { id:'c_health',  name:'Sog\'liq',    emoji:'💊', color:'#22c55e', type:'expense' },
  { id:'c_edu',     name:'Ta\'lim',     emoji:'📚', color:'#6366f1', type:'expense' },
  { id:'c_travel',  name:'Sayohat',     emoji:'✈️', color:'#06b6d4', type:'expense' },
  { id:'c_clothes', name:'Kiyim',       emoji:'👔', color:'#0ea5e9', type:'expense' },
  { id:'c_gift',    name:'Sovg\'a',     emoji:'🎁', color:'#f43f5e', type:'expense' },
  { id:'c_cafe',    name:'Kafe',        emoji:'☕', color:'#b45309', type:'expense' },
  { id:'c_phone',   name:'Aloqa',       emoji:'📱', color:'#0891b2', type:'expense' },
  { id:'c_fuel',    name:'Yoqilg\'i',   emoji:'⛽', color:'#dc2626', type:'expense' },
  { id:'c_sport',   name:'Sport',       emoji:'🏋️', color:'#14b8a6', type:'expense' },
  { id:'c_beauty',  name:'Go\'zallik',  emoji:'💄', color:'#e11d48', type:'expense' },
  { id:'c_pet',     name:'Hayvonlar',   emoji:'🐕', color:'#84cc16', type:'expense' },
  { id:'c_kids',    name:'Bolalar',     emoji:'🧒', color:'#f59e0b', type:'expense' },
  { id:'c_repair',  name:'Ta\'mir',     emoji:'🔧', color:'#64748b', type:'expense' },
  { id:'c_taxes',   name:'Soliq',       emoji:'🏛️', color:'#475569', type:'expense' },
  { id:'c_other_e', name:'Boshqa',      emoji:'💸', color:'#71717a', type:'expense' },
  // Incomes
  { id:'c_salary',  name:'Maosh',       emoji:'💰', color:'#16a34a', type:'income' },
  { id:'c_business',name:'Biznes',      emoji:'💼', color:'#0d9488', type:'income' },
  { id:'c_freelance',name:'Frilans',    emoji:'💻', color:'#2563eb', type:'income' },
  { id:'c_invest_in',name:'Investitsiya',emoji:'📈',color:'#7c3aed', type:'income' },
  { id:'c_gift_in', name:'Sovg\'a',     emoji:'🎁', color:'#db2777', type:'income' },
  { id:'c_other_i', name:'Boshqa',      emoji:'✨', color:'#0891b2', type:'income' },
];

const ACCOUNT_TYPES = [
  { id:'cash',    name:'Naqd',         emoji:'💵', cls:'c-cash' },
  { id:'card',    name:'Plastik karta',emoji:'💳', cls:'c-card' },
  { id:'bank',    name:'Bank hisobi',  emoji:'🏦', cls:'c-bank' },
  { id:'ewallet', name:'E-hamyon',     emoji:'📱', cls:'c-ewallet' },
  { id:'savings', name:'Jamg\'arma',   emoji:'💰', cls:'c-savings' },
  { id:'invest',  name:'Investitsiya', emoji:'📊', cls:'c-invest' },
  { id:'crypto',  name:'Kripto',       emoji:'🪙', cls:'c-crypto' },
];

const GOAL_ICONS = ['🚗','🏠','✈️','🎓','🆘','🎁','📱','💍','👶','🎯','💻','🎮','📷','⌚','🛵'];

/* ---------- I18n ---------- */
const I18N = {
  uz: {
    app_title: 'Qiymat',
    tagline: 'Premium shaxsiy moliya',
    nav_home:'Bosh', nav_tx:'Tarix', nav_budget:'Byudjet', nav_more:'Yana',
    dashboard:'Bosh sahifa', transactions:'Tranzaksiyalar', budget:'Byudjet',
    goals:'Maqsadlar', accounts:'Hisoblar', reports:'Hisobotlar',
    categories:'Kategoriyalar', recurring:'Takroriy', networth:'Sof aktiv',
    settings:'Sozlamalar', mini:'Mini-ilovalar', insights:'Tavsiyalar',
    total_balance:'Umumiy balans', net_worth:'Sof aktiv',
    income:'Daromad', expense:'Xarajat', transfer:'Transfer',
    today:'Bugun', this_week:'Shu hafta', this_month:'Shu oy', this_year:'Shu yil',
    yesterday:"Kecha",
    add:'Qo\'shish', save:'Saqlash', cancel:'Bekor qilish', delete:'O\'chirish',
    edit:'Tahrirlash', confirm:'Tasdiqlash', close:'Yopish',
    amount:'Summa', category:'Kategoriya', account:'Hisob', date:'Sana',
    note:'Izoh', note_ph:'Izoh qo\'shing...',
    select_cat:'Kategoriya tanlang', select_acc:'Hisob tanlang',
    no_tx:'Hali tranzaksiyalar yo\'q', no_tx_desc:'Birinchi tranzaksiyangizni qo\'shing — daromad yoki xarajat.',
    no_goals:'Hali maqsadlar yo\'q', no_goals_desc:'Yangi maqsad qo\'shing va orzuyingizga yaqinlashing.',
    no_budget:'Byudjet hali sozlanmagan', no_budget_desc:'Kategoriyalar uchun byudjet belgilang.',
    recent:'So\'nggi tranzaksiyalar', view_all:'Barchasi',
    quick_add:'Tezkor qo\'shish',
    welcome:'Xush kelibsiz',
    onboard_1_title:'Qiymat — moliyangiz nazorati',
    onboard_1_desc:'Daromad va xarajatlarni kuzating, byudjet tuzing, maqsadlarga erishing — barchasi privatlikda, qurilmangizda.',
    onboard_2_title:'Sizni qanday chaqirsam bo\'ladi?',
    onboard_2_desc:'Bu ma\'lumot faqat qurilmangizda saqlanadi.',
    onboard_3_title:'Asosiy valyutangiz qaysi?',
    onboard_3_desc:'Buni keyin sozlamalardan o\'zgartira olasiz.',
    onboard_4_title:'Birinchi hisobingizni qo\'shing',
    onboard_4_desc:'Naqd pul, karta yoki bank hisobi — eng asosiysi.',
    onboard_5_title:'Tayyor!',
    onboard_5_desc:'Endi tranzaksiyalarni qo\'shishni boshlashingiz mumkin.',
    your_name:'Ismingiz', acc_name:'Hisob nomi', start_balance:'Boshlang\'ich balans',
    next:'Davom etish', back:'Orqaga', start:'Boshlash',
    saved:'Saqlandi', deleted:'O\'chirildi',
    spent_today:'Bugungi xarajat', spent_week:'Haftalik', spent_month:'Oylik xarajat', spent_year:'Yillik xarajat',
    new_tx:'Yangi tranzaksiya', edit_tx:'Tranzaksiyani tahrirlash',
    no_acc:'Avval hisob qo\'shing',
    add_account:'Hisob qo\'shish', new_account:'Yangi hisob',
    add_goal:'Maqsad qo\'shish', new_goal:'Yangi maqsad',
    target:'Maqsad summasi', current:'Jamlangan', deadline:'Muddati', goal_name:'Maqsad nomi',
    add_money:'Pul qo\'shish',
    monthly_budget:'Oylik byudjet', set_budget:'Byudjet belgilash',
    spent:'sarflangan', of:'/',
    over_budget:'Byudjetdan oshib ketdingiz',
    daily_allowance:'Bugun sarflashingiz mumkin',
    insight_of_day:'Kun tavsiyasi',
    streak:'Ketma-ketlik', days:'kun',
    search_ph:'Tranzaksiya, kategoriya yoki izoh bo\'yicha izlash...',
    filter:'Filtr', all:'Barchasi',
    theme:'Mavzu', accent:'Aksent rangi', language:'Til',
    light:'Yorug\'', dark:'Qorong\'i', auto:'Avto',
    sounds:'Ovozlar', haptics:'Tebranish', notifications:'Bildirishnomalar', privacy_mode:'Maxfiylik rejimi',
    export:'Eksport', import:'Import', backup:'Zaxira',
    danger_zone:'Xavfli zona', reset_all:'Barcha ma\'lumotlarni o\'chirish',
    confirm_reset:'Ishonchingiz komilmi? Bu amalni qaytarib bo\'lmaydi.',
    keyboard_shortcuts:'Klaviatura yorliqlari',
    transfer_from:'Qayerdan', transfer_to:'Qayerga',
    progress:'Progress', achieved:'Erishildi',
    daily:'Har kuni', weekly:'Haftalik', biweekly:'Ikki haftalik', monthly:'Har oy', yearly:'Har yili',
    next_payment:'Keyingi to\'lov',
    add_recurring:'Takroriy qo\'shish',
    new_recurring:'Yangi takroriy to\'lov',
    frequency:'Davriylik',
    name:'Nomi',
    custom_categories:'Maxsus kategoriyalar',
    add_category:'Kategoriya qo\'shish',
    new_category:'Yangi kategoriya',
    income_vs_expense:'Daromad va xarajat',
    by_category:'Kategoriyalar bo\'yicha',
    monthly_trend:'Oylik tendensiya',
    top_categories:'Eng ko\'p sarflanganlar',
    avg_daily:'O\'rtacha kunlik',
    savings_rate:'Jamg\'arish darajasi',
    spending_calendar:'Sarflashlar kalendari',
    loan_calc:'Kredit hisoblagich',
    interest_calc:'Murakkab foiz',
    fx_calc:'Valyuta konvertor',
    mortgage_calc:'Ipoteka',
    tip_calc:'Choychaqa hisoblagich',
    roi_calc:'ROI hisoblagich',
    bill_split:'Hisobni bo\'lish',
    inflation_calc:'Inflyatsiya',
    goal_planner:'Maqsad rejasi',
    networth_snap:'Sof aktiv kesimi',
    select_emoji:'Belgi tanlang',
    color:'Rang',
    type:'Turi', limit:'Limit',
    period:'Davr',
    all_time:'Hammasi',
    today_:'Bugun', week_:'Hafta', month_:'Oy', year_:'Yil',
    total:'Jami',
    enabled:'Yoqilgan', disabled:'O\'chirilgan',
    upcoming:'Yaqinlashayotgan',
    no_recurring:'Takroriy to\'lovlar yo\'q', no_recurring_desc:'Obunalar va muntazam to\'lovlarni qo\'shing.',
    no_categories:'Maxsus kategoriya yo\'q',
    achievements:'Yutuqlar',
    level:'Daraja', xp:'Tajriba',
    money_score:'Moliyaviy ball',
    no_insights:'Hali tavsiyalar yo\'q', no_insights_desc:'Bir necha tranzaksiya qo\'shganingizdan so\'ng paydo bo\'ladi.',
    privacy_first:'Maxfiylik birinchi o\'rinda',
    privacy_first_desc:'Barcha ma\'lumotlar faqat sizning qurilmangizda saqlanadi.',
    overview:'Umumiy ko\'rinish',
    archive:'Arxivlash', archived:'Arxivlangan',
    transfer_done:'Transfer bajarildi',
    insufficient:'Hisobda yetarli mablag\' yo\'q',
    add_first:'Birinchini qo\'shish',
    confetti_msg:'Tabriklaymiz!',
    show_all:'Hammasi',
    duplicate:'Nusxalash',
    select_currency:'Valyutani tanlang',
    enter_amount:'Summa kiriting',
    please_select_cat:'Kategoriya tanlang',
    please_select_acc:'Hisob tanlang',
    fab_hint:'Yangi tranzaksiya (N)',
    daily_log:'Kunlik yozuv',
    last_7:'So\'nggi 7 kun',
    last_30:'So\'nggi 30 kun',
    last_90:'So\'nggi 90 kun',
    summary:'Xulosa',
    delta_vs_last:'O\'tgan oyga nisbatan',
    no_data:'Ma\'lumot yetarli emas',
    add_some_tx:'Bir nechta tranzaksiya qo\'shing — grafiklar shu yerda paydo bo\'ladi.',
    swipe_hint:'Surib o\'chiring yoki tahrirlang',
    bills_in_3d:'3 kun ichida to\'lanadigan',
    no_upcoming:'Yaqinlashayotgan to\'lov yo\'q',
    everything_local:'Hammasi qurilmangizda. Hech qaerga yuborilmaydi.',
  },
  en: {
    app_title:'Qiymat', tagline:'Premium personal finance',
    nav_home:'Home', nav_tx:'History', nav_budget:'Budget', nav_more:'More',
    dashboard:'Dashboard', transactions:'Transactions', budget:'Budget',
    goals:'Goals', accounts:'Accounts', reports:'Reports', categories:'Categories',
    recurring:'Recurring', networth:'Net Worth', settings:'Settings', mini:'Mini Apps',
    insights:'Insights', total_balance:'Total balance', net_worth:'Net worth',
    income:'Income', expense:'Expense', transfer:'Transfer',
    today:'Today', this_week:'This week', this_month:'This month', this_year:'This year',
    yesterday:'Yesterday',
    add:'Add', save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit', confirm:'Confirm', close:'Close',
    amount:'Amount', category:'Category', account:'Account', date:'Date',
    note:'Note', note_ph:'Add a note...',
    select_cat:'Select category', select_acc:'Select account',
    no_tx:'No transactions yet', no_tx_desc:'Add your first transaction — income or expense.',
    no_goals:'No goals yet', no_goals_desc:'Create a savings goal and track your progress.',
    no_budget:'No budgets yet', no_budget_desc:'Set monthly limits per category.',
    recent:'Recent transactions', view_all:'View all',
    quick_add:'Quick add',
    welcome:'Welcome',
    onboard_1_title:'Qiymat — your money, your control',
    onboard_1_desc:'Track income and expenses, budget smart, and reach your goals — all privately, on your device.',
    onboard_2_title:'What should we call you?',
    onboard_2_desc:'This stays only on your device.',
    onboard_3_title:'What\'s your primary currency?',
    onboard_3_desc:'You can change this later in settings.',
    onboard_4_title:'Add your first account',
    onboard_4_desc:'Cash, card, or bank — pick the one you use most.',
    onboard_5_title:'You\'re all set!',
    onboard_5_desc:'Start adding transactions and watch your money work.',
    your_name:'Your name', acc_name:'Account name', start_balance:'Starting balance',
    next:'Continue', back:'Back', start:'Get started',
    saved:'Saved', deleted:'Deleted',
    spent_today:'Spent today', spent_week:'This week', spent_month:'This month', spent_year:'This year',
    new_tx:'New transaction', edit_tx:'Edit transaction',
    no_acc:'Add an account first',
    add_account:'Add account', new_account:'New account',
    add_goal:'Add goal', new_goal:'New goal',
    target:'Target', current:'Saved', deadline:'Deadline', goal_name:'Goal name',
    add_money:'Add money',
    monthly_budget:'Monthly budget', set_budget:'Set budget',
    spent:'spent', of:'of',
    over_budget:'Over budget',
    daily_allowance:'You can spend today',
    insight_of_day:'Insight of the day',
    streak:'Streak', days:'days',
    search_ph:'Search transactions, categories, notes...',
    filter:'Filter', all:'All',
    theme:'Theme', accent:'Accent', language:'Language',
    light:'Light', dark:'Dark', auto:'Auto',
    sounds:'Sounds', haptics:'Haptics', notifications:'Notifications', privacy_mode:'Privacy mode',
    export:'Export', import:'Import', backup:'Backup',
    danger_zone:'Danger zone', reset_all:'Erase all data',
    confirm_reset:'Are you sure? This cannot be undone.',
    keyboard_shortcuts:'Keyboard shortcuts',
    transfer_from:'From', transfer_to:'To',
    progress:'Progress', achieved:'Achieved',
    daily:'Daily', weekly:'Weekly', biweekly:'Bi-weekly', monthly:'Monthly', yearly:'Yearly',
    next_payment:'Next payment',
    add_recurring:'Add recurring', new_recurring:'New recurring',
    frequency:'Frequency', name:'Name',
    custom_categories:'Custom categories', add_category:'Add category', new_category:'New category',
    income_vs_expense:'Income vs Expense', by_category:'By category', monthly_trend:'Monthly trend',
    top_categories:'Top categories', avg_daily:'Average daily', savings_rate:'Savings rate',
    spending_calendar:'Spending calendar',
    loan_calc:'Loan calculator', interest_calc:'Compound interest', fx_calc:'Currency converter',
    mortgage_calc:'Mortgage', tip_calc:'Tip calculator', roi_calc:'ROI calculator',
    bill_split:'Bill split', inflation_calc:'Inflation', goal_planner:'Goal planner',
    networth_snap:'Net worth snapshot',
    select_emoji:'Select emoji', color:'Color', type:'Type', limit:'Limit', period:'Period',
    all_time:'All time', today_:'Today', week_:'Week', month_:'Month', year_:'Year',
    total:'Total', enabled:'On', disabled:'Off', upcoming:'Upcoming',
    no_recurring:'No recurring payments', no_recurring_desc:'Add subscriptions and regular bills.',
    no_categories:'No custom categories',
    achievements:'Achievements', level:'Level', xp:'XP',
    money_score:'Money score',
    no_insights:'No insights yet', no_insights_desc:'They appear after a few transactions.',
    privacy_first:'Privacy first',
    privacy_first_desc:'All your data stays on your device.',
    overview:'Overview', archive:'Archive', archived:'Archived',
    transfer_done:'Transfer complete', insufficient:'Insufficient funds',
    add_first:'Add the first one', confetti_msg:'Congratulations!',
    show_all:'Show all', duplicate:'Duplicate',
    select_currency:'Select currency',
    enter_amount:'Enter an amount',
    please_select_cat:'Please select a category',
    please_select_acc:'Please select an account',
    fab_hint:'New transaction (N)',
    daily_log:'Daily log',
    last_7:'Last 7 days', last_30:'Last 30 days', last_90:'Last 90 days',
    summary:'Summary', delta_vs_last:'vs last month',
    no_data:'Not enough data',
    add_some_tx:'Add a few transactions and charts will appear here.',
    swipe_hint:'Swipe to delete or edit',
    bills_in_3d:'Due within 3 days',
    no_upcoming:'No upcoming bills',
    everything_local:'Everything stays on your device.',
  },
  ru: {
    app_title:'Qiymat', tagline:'Премиум финансы',
    nav_home:'Главная', nav_tx:'История', nav_budget:'Бюджет', nav_more:'Ещё',
    dashboard:'Главная', transactions:'Транзакции', budget:'Бюджет',
    goals:'Цели', accounts:'Счета', reports:'Отчёты', categories:'Категории',
    recurring:'Регулярные', networth:'Капитал', settings:'Настройки', mini:'Мини-приложения',
    insights:'Подсказки', total_balance:'Общий баланс', net_worth:'Чистый капитал',
    income:'Доход', expense:'Расход', transfer:'Перевод',
    today:'Сегодня', this_week:'Эта неделя', this_month:'Этот месяц', this_year:'Этот год',
    yesterday:'Вчера',
    add:'Добавить', save:'Сохранить', cancel:'Отмена', delete:'Удалить', edit:'Изменить', confirm:'Подтвердить', close:'Закрыть',
    amount:'Сумма', category:'Категория', account:'Счёт', date:'Дата',
    note:'Заметка', note_ph:'Добавить заметку...',
    select_cat:'Выберите категорию', select_acc:'Выберите счёт',
    no_tx:'Транзакций пока нет', no_tx_desc:'Добавьте первую — доход или расход.',
    no_goals:'Целей пока нет', no_goals_desc:'Создайте цель для накоплений.',
    no_budget:'Бюджет не настроен', no_budget_desc:'Установите лимиты по категориям.',
    recent:'Недавние транзакции', view_all:'Все',
    quick_add:'Быстро добавить',
    welcome:'Добро пожаловать',
    onboard_1_title:'Qiymat — финансы под контролем',
    onboard_1_desc:'Отслеживайте доходы и расходы, планируйте бюджет, достигайте целей — приватно, на вашем устройстве.',
    onboard_2_title:'Как вас зовут?',
    onboard_2_desc:'Эта информация хранится только у вас.',
    onboard_3_title:'Основная валюта?',
    onboard_3_desc:'Можно изменить позже.',
    onboard_4_title:'Добавьте первый счёт',
    onboard_4_desc:'Наличные, карта или банк — самый используемый.',
    onboard_5_title:'Готово!',
    onboard_5_desc:'Начните добавлять транзакции.',
    your_name:'Ваше имя', acc_name:'Название счёта', start_balance:'Начальный баланс',
    next:'Дальше', back:'Назад', start:'Начать',
    saved:'Сохранено', deleted:'Удалено',
    spent_today:'Сегодня', spent_week:'Неделя', spent_month:'Месяц', spent_year:'Год',
    new_tx:'Новая транзакция', edit_tx:'Изменить транзакцию',
    no_acc:'Сначала добавьте счёт',
    add_account:'Добавить счёт', new_account:'Новый счёт',
    add_goal:'Добавить цель', new_goal:'Новая цель',
    target:'Цель', current:'Накоплено', deadline:'Срок', goal_name:'Название цели',
    add_money:'Пополнить',
    monthly_budget:'Месячный бюджет', set_budget:'Задать бюджет',
    spent:'потрачено', of:'из',
    over_budget:'Превышение бюджета',
    daily_allowance:'Можно потратить сегодня',
    insight_of_day:'Подсказка дня',
    streak:'Серия', days:'дн.',
    search_ph:'Поиск по транзакциям, категориям, заметкам...',
    filter:'Фильтр', all:'Все',
    theme:'Тема', accent:'Акцент', language:'Язык',
    light:'Светлая', dark:'Тёмная', auto:'Авто',
    sounds:'Звуки', haptics:'Вибрация', notifications:'Уведомления', privacy_mode:'Приватность',
    export:'Экспорт', import:'Импорт', backup:'Бэкап',
    danger_zone:'Опасная зона', reset_all:'Удалить все данные',
    confirm_reset:'Уверены? Действие необратимо.',
    keyboard_shortcuts:'Горячие клавиши',
    transfer_from:'Откуда', transfer_to:'Куда',
    progress:'Прогресс', achieved:'Достигнуто',
    daily:'Ежедневно', weekly:'Еженедельно', biweekly:'Раз в 2 недели', monthly:'Ежемесячно', yearly:'Ежегодно',
    next_payment:'Следующий платёж',
    add_recurring:'Регулярный платёж', new_recurring:'Новый регулярный',
    frequency:'Периодичность', name:'Название',
    custom_categories:'Свои категории', add_category:'Добавить категорию', new_category:'Новая категория',
    income_vs_expense:'Доходы и расходы', by_category:'По категориям', monthly_trend:'Помесячно',
    top_categories:'Топ категорий', avg_daily:'Среднее в день', savings_rate:'Норма сбережений',
    spending_calendar:'Календарь расходов',
    loan_calc:'Кредитный калькулятор', interest_calc:'Сложный процент', fx_calc:'Конвертер валют',
    mortgage_calc:'Ипотека', tip_calc:'Чаевые', roi_calc:'ROI',
    bill_split:'Разделить счёт', inflation_calc:'Инфляция', goal_planner:'Планировщик цели',
    networth_snap:'Снимок капитала',
    select_emoji:'Выберите эмодзи', color:'Цвет', type:'Тип', limit:'Лимит', period:'Период',
    all_time:'Всё время', today_:'Сегодня', week_:'Неделя', month_:'Месяц', year_:'Год',
    total:'Всего', enabled:'Вкл', disabled:'Выкл', upcoming:'Скоро',
    no_recurring:'Регулярных платежей нет', no_recurring_desc:'Добавьте подписки и регулярные счета.',
    no_categories:'Своих категорий нет',
    achievements:'Достижения', level:'Уровень', xp:'Опыт', money_score:'Финансовый балл',
    no_insights:'Подсказок пока нет', no_insights_desc:'Появятся после нескольких транзакций.',
    privacy_first:'Приватность прежде всего',
    privacy_first_desc:'Все данные остаются на вашем устройстве.',
    overview:'Обзор', archive:'Архив', archived:'В архиве',
    transfer_done:'Перевод выполнен', insufficient:'Недостаточно средств',
    add_first:'Добавить первое', confetti_msg:'Поздравляем!',
    show_all:'Показать все', duplicate:'Дублировать',
    select_currency:'Валюта', enter_amount:'Введите сумму',
    please_select_cat:'Выберите категорию', please_select_acc:'Выберите счёт',
    fab_hint:'Новая транзакция (N)',
    daily_log:'Дневник',
    last_7:'7 дней', last_30:'30 дней', last_90:'90 дней',
    summary:'Сводка', delta_vs_last:'к прошлому месяцу',
    no_data:'Недостаточно данных',
    add_some_tx:'Добавьте транзакции, и графики появятся здесь.',
    swipe_hint:'Свайп для удаления',
    bills_in_3d:'В ближайшие 3 дня',
    no_upcoming:'Нет ближайших платежей',
    everything_local:'Всё хранится только у вас.',
  }
};
const t = (key) => (I18N[State.lang()] && I18N[State.lang()][key]) || I18N.uz[key] || key;

/* ---------- Formatters ---------- */
const Fmt = {
  number(n, opts={}){
    // Always group with commas (e.g. 5,000,000) per product spec, across all languages.
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, ...opts }).format(Number(n) || 0);
  },
  money(n, currency){
    currency = currency || State.user().currency || 'UZS';
    const v = Fmt.number(n, currency === 'UZS' ? { maximumFractionDigits: 0 } : {});
    const sym = Fmt.currencySymbol(currency);
    return currency === 'UZS' ? `${v} ${sym}` : `${sym}${v}`;
  },
  moneyShort(n){
    n = Number(n) || 0;
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs/1e9).toFixed(1).replace(/\.0$/,'') + 'B';
    if (abs >= 1e6) return sign + (abs/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
    if (abs >= 1e3) return sign + (abs/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
    return sign + Fmt.number(abs);
  },
  currencySymbol(c){
    return ({UZS:"so'm", USD:'$', EUR:'€', RUB:'₽', KZT:'₸', CNY:'¥', GBP:'£', AED:'د.إ', TRY:'₺'})[c] || c;
  },
  date(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    const lang = State.lang();
    const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    return dt.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  },
  dayLabel(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    const today = new Date(); today.setHours(0,0,0,0);
    const yest = new Date(today); yest.setDate(today.getDate()-1);
    const day = new Date(dt); day.setHours(0,0,0,0);
    if (day.getTime() === today.getTime()) return t('today');
    if (day.getTime() === yest.getTime()) return t('yesterday');
    return Fmt.date(dt);
  },
  iso(d){ const dt = (d instanceof Date) ? d : new Date(d); const z = (n)=>String(n).padStart(2,'0'); return `${dt.getFullYear()}-${z(dt.getMonth()+1)}-${z(dt.getDate())}`; },
  monthLabel(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    const lang = State.lang();
    const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    return dt.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }
};

/* ---------- State / Storage ---------- */
const STORAGE_KEY = 'qiymat:v1';
const State = (() => {
  const initial = () => ({
    user: { name: '', currency: 'UZS', language: 'uz', createdAt: Date.now(), level: 1, xp: 0, onboarded: false },
    accounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    categories: DEFAULT_CATEGORIES.slice(),
    recurring: [],
    achievements: [],
    reminders: [],
    insights: [],
    settings: {
      theme: 'auto',         // light | dark | auto
      accent: 'default',     // default | green | blue | purple | orange | rose
      language: 'uz',
      sounds: true,
      haptics: true,
      notifications: false,
      privacyMode: false,
      autoBackup: true,
      lastBackup: 0,
    },
  });

  let data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : initial();
  } catch { data = initial(); }
  // migrate missing keys
  Object.assign(data, { ...initial(), ...data });
  data.settings = { ...initial().settings, ...(data.settings || {}) };
  data.user = { ...initial().user, ...(data.user || {}) };

  let timer = null;
  const persist = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
      catch (e) { console.warn('persist failed', e); }
    }, 60);
  };

  const subs = new Set();
  const emit = () => subs.forEach((f)=>{ try{ f(data); }catch(e){console.error(e);} });

  return {
    raw: () => data,
    save(){ persist(); emit(); },
    set(updater){
      if (typeof updater === 'function') updater(data);
      else Object.assign(data, updater);
      persist(); emit();
    },
    on(fn){ subs.add(fn); return () => subs.delete(fn); },
    reset(){ data = initial(); persist(); emit(); },
    /* convenience getters */
    user(){ return data.user; },
    settings(){ return data.settings; },
    lang(){ return data.user.language || data.settings.language || 'uz'; },
    accounts(includeArchived=false){ return includeArchived ? data.accounts : data.accounts.filter(a=>!a.archived); },
    transactions(){ return data.transactions; },
    budgets(){ return data.budgets; },
    goals(){ return data.goals; },
    categories(type){
      const list = data.categories.filter(c => !c.archived);
      return type ? list.filter(c => c.type === type || c.type === 'both') : list;
    },
    recurring(){ return data.recurring; },
    insights(){ return data.insights; },
    achievements(){ return data.achievements; },
    /* CRUD helpers */
    addTx(tx){
      const id = uid('tx');
      const full = { id, createdAt: Date.now(), ...tx };
      data.transactions.unshift(full);
      this._applyTxToBalance(full, +1);
      this.save();
      return full;
    },
    updateTx(id, patch){
      const idx = data.transactions.findIndex(t=>t.id===id);
      if (idx<0) return;
      const old = data.transactions[idx];
      this._applyTxToBalance(old, -1);
      const updated = { ...old, ...patch };
      data.transactions[idx] = updated;
      this._applyTxToBalance(updated, +1);
      this.save();
      return updated;
    },
    removeTx(id){
      const idx = data.transactions.findIndex(t=>t.id===id);
      if (idx<0) return;
      this._applyTxToBalance(data.transactions[idx], -1);
      data.transactions.splice(idx, 1);
      this.save();
    },
    _applyTxToBalance(tx, sign){
      // sign: +1 add tx, -1 reverse tx
      const apply = (accId, delta) => {
        const a = data.accounts.find(x=>x.id===accId);
        if (a) a.balance = Number((a.balance + delta).toFixed(2));
      };
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income')   apply(tx.account, sign * amt);
      if (tx.type === 'expense')  apply(tx.account, sign * -amt);
      if (tx.type === 'transfer'){
        apply(tx.account,    sign * -amt);
        apply(tx.toAccount,  sign *  amt);
      }
    },
    addAccount(a){
      const acc = { id: uid('acc'), balance: 0, currency: data.user.currency, archived: false, createdAt: Date.now(), ...a };
      data.accounts.push(acc); this.save(); return acc;
    },
    updateAccount(id, patch){
      const a = data.accounts.find(x=>x.id===id);
      if (a) Object.assign(a, patch);
      this.save();
    },
    addGoal(g){
      const goal = { id: uid('goal'), current: 0, createdAt: Date.now(), achieved: false, ...g };
      data.goals.push(goal); this.save(); return goal;
    },
    updateGoal(id, patch){
      const g = data.goals.find(x=>x.id===id);
      if (g) Object.assign(g, patch);
      this.save();
    },
    removeGoal(id){
      data.goals = data.goals.filter(g=>g.id!==id);
      this.save();
    },
    setBudget(category, limit){
      const month = new Date().getMonth();
      const year  = new Date().getFullYear();
      let b = data.budgets.find(x=>x.category===category && x.month===month && x.year===year);
      if (b) b.limit = limit;
      else data.budgets.push({ id: uid('bud'), category, limit, period:'monthly', month, year });
      this.save();
    },
    removeBudget(id){
      data.budgets = data.budgets.filter(b=>b.id!==id);
      this.save();
    },
    addCategory(c){
      const cat = { id: uid('c'), color: '#64748b', type: 'expense', archived: false, ...c };
      data.categories.push(cat); this.save(); return cat;
    },
    addRecurring(r){
      const rec = { id: uid('rec'), enabled: true, createdAt: Date.now(), lastTriggered: 0, ...r };
      data.recurring.push(rec); this.save(); return rec;
    },
    updateRecurring(id, patch){
      const r = data.recurring.find(x=>x.id===id);
      if (r) Object.assign(r, patch);
      this.save();
    },
    removeRecurring(id){
      data.recurring = data.recurring.filter(r=>r.id!==id);
      this.save();
    },
  };
})();

/* ---------- Theme & Accent ---------- */
const Theme = {
  apply(){
    const s = State.settings();
    const root = document.documentElement;
    let theme = s.theme;
    if (theme === 'auto'){
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', s.accent);
    root.setAttribute('data-privacy', s.privacyMode ? 'on' : 'off');
    // theme-color meta dynamic
    const meta = document.querySelector('meta[name="theme-color"]:not([media])') || $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#fafafa');
  },
  setTheme(t){ State.set(d => { d.settings.theme = t; }); Theme.apply(); },
  setAccent(a){ State.set(d => { d.settings.accent = a; }); Theme.apply(); },
};

/* ---------- Toast & Haptics & Sounds ---------- */
const Toast = {
  show(msg, kind=''){
    const node = el('div', { class: `toast ${kind}` }, [msg]);
    $('#toasts').append(node);
    setTimeout(()=> node.style.opacity='0', 1800);
    setTimeout(()=> node.remove(), 2200);
  }
};
const Haptic = {
  light(){ if (State.settings().haptics && navigator.vibrate) navigator.vibrate(10); },
  medium(){ if (State.settings().haptics && navigator.vibrate) navigator.vibrate(20); },
  success(){ if (State.settings().haptics && navigator.vibrate) navigator.vibrate([10, 60, 30]); },
  error(){ if (State.settings().haptics && navigator.vibrate) navigator.vibrate([40, 40, 40]); }
};
const Audio_ = (() => {
  let ctx;
  const ensure = () => { if (!ctx) try { ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch{} return ctx; };
  const beep = (freq=600, dur=0.08, type='sine', gain=0.05) => {
    if (!State.settings().sounds) return;
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  };
  return {
    tap(){ beep(720, 0.04, 'triangle', 0.03); },
    success(){ beep(720, 0.08, 'sine', 0.05); setTimeout(()=>beep(960, 0.10, 'sine', 0.05), 80); },
    error(){ beep(220, 0.18, 'sawtooth', 0.05); }
  };
})();

/* ---------- Router ---------- */
const Router = (() => {
  const routes = {};
  const titles = {
    '/':            () => t('app_title'),
    '/transactions':() => t('transactions'),
    '/add':         () => t('new_tx'),
    '/budget':      () => t('budget'),
    '/goals':       () => t('goals'),
    '/accounts':    () => t('accounts'),
    '/reports':     () => t('reports'),
    '/categories':  () => t('categories'),
    '/recurring':   () => t('recurring'),
    '/networth':    () => t('networth'),
    '/insights':    () => t('insights'),
    '/mini':        () => t('mini'),
    '/settings':    () => t('settings'),
    '/more':        () => t('nav_more'),
  };
  const register = (path, handler) => routes[path] = handler;
  const navigate = (path) => { location.hash = '#' + path; };
  const current = () => {
    let h = (location.hash || '#/').slice(1);
    if (!h.startsWith('/')) h = '/' + h;
    return h;
  };
  const render = () => {
    const path = current();
    const view = $('#view');
    // Highlight nav
    $$('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.route === path || (path === '/' && n.dataset.route === '/')));
    $$('.side-link').forEach(n => n.classList.toggle('is-active', n.dataset.route === path));
    // Title
    const titleFn = titles[path] || titles['/'];
    $('#topbarTitle').textContent = titleFn ? titleFn() : t('app_title');
    // Show back arrow if not root
    $('#navBack').hidden = (path === '/' || path === '/more');
    // Reset scroll
    view.scrollTo?.(0,0);
    // Render
    const handler = routes[path] || routes['__notfound__'] || routes['/'];
    view.innerHTML = '';
    handler && handler(view, path);
    // Focus for a11y
    view.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', render);
  return { register, navigate, render, current };
})();

/* ---------- Demo data (first run only) ---------- */
function seedDemoData(){
  // Account: Naqd
  const cash = State.addAccount({ name: 'Naqd pul', type: 'cash', balance: 0, color:'#10b981', cls:'c-cash' });
  const card = State.addAccount({ name: 'UzCard', type: 'card',  balance: 0, color:'#1f2937', cls:'c-card' });
  // Some demo transactions
  const today = new Date();
  const back = (n)=>{ const d=new Date(today); d.setDate(today.getDate()-n); return Fmt.iso(d); };
  State.addTx({ amount: 5_000_000, type: 'income',  category: 'c_salary', account: card.id, date: back(2),  note: 'Maosh', currency: State.user().currency });
  State.addTx({ amount: 85_000,    type: 'expense', category: 'c_food',   account: cash.id, date: back(1),  note: 'Tushlik', currency: State.user().currency });
  State.addTx({ amount: 24_000,    type: 'expense', category: 'c_cafe',   account: card.id, date: back(0),  note: 'Latte', currency: State.user().currency });
  State.addTx({ amount: 320_000,   type: 'expense', category: 'c_shop',   account: card.id, date: back(3),  note: 'Kiyim', currency: State.user().currency });
  State.addTx({ amount: 150_000,   type: 'expense', category: 'c_transport', account: cash.id, date: back(4), note: 'Yoqilg\'i', currency: State.user().currency });
  // Budgets
  State.setBudget('c_food', 1_500_000);
  State.setBudget('c_transport', 700_000);
  State.setBudget('c_shop', 1_000_000);
  // Goals
  State.addGoal({ name: 'Yangi telefon', target: 12_000_000, current: 2_500_000, deadline: Fmt.iso(new Date(today.getFullYear(), today.getMonth()+5, 1)), icon: '📱', color: '#7c3aed' });
  State.addGoal({ name: 'Sayohat',       target: 8_000_000,  current: 1_200_000, deadline: Fmt.iso(new Date(today.getFullYear(), today.getMonth()+8, 15)), icon: '✈️', color: '#0ea5e9' });
}

/* ---------- Onboarding ---------- */
const Onboarding = (() => {
  const steps = ['welcome','name','currency','account','done'];
  let step = 0;
  let draft = { name:'', currency:'UZS', acc: { name:'Naqd pul', type:'cash', balance: 0 } };

  const node = () => $('#onboarding');
  const renderStep = () => {
    const s = steps[step];
    const root = node();
    root.hidden = false;

    const prog = steps.map((_,i)=> `<span class="${i<=step?'is-active':''}"></span>`).join('');

    const wrap = (inner) => `
      <div class="onboard-card">
        <div class="onboard-step">
          <div class="onboard-pre">Qiymat · ${step+1}/${steps.length}</div>
          ${inner}
          <div class="onboard-prog">${prog}</div>
        </div>
      </div>`;

    if (s === 'welcome') {
      root.innerHTML = wrap(`
        <div style="font-size:56px;line-height:1;margin-bottom:8px">💎</div>
        <h2 class="onboard-title">${escapeHtml(t('onboard_1_title'))}</h2>
        <p class="onboard-desc">${escapeHtml(t('onboard_1_desc'))}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <select class="select" id="ob_lang">
            <option value="uz">O'zbek</option><option value="en">English</option><option value="ru">Русский</option>
          </select>
        </div>
        <button class="btn btn-primary btn-lg btn-block" id="ob_next">${escapeHtml(t('next'))}</button>
        <p class="small muted" style="text-align:center;margin:6px 0 0">${escapeHtml(t('everything_local'))}</p>
      `);
      $('#ob_lang').value = State.lang();
      $('#ob_lang').onchange = (e) => {
        State.set(d => { d.user.language = e.target.value; d.settings.language = e.target.value; });
        renderStep();
      };
      $('#ob_next').onclick = () => { step++; renderStep(); };
    } else if (s === 'name') {
      root.innerHTML = wrap(`
        <h2 class="onboard-title">${escapeHtml(t('onboard_2_title'))}</h2>
        <p class="onboard-desc">${escapeHtml(t('onboard_2_desc'))}</p>
        <div class="field">
          <label class="field-label">${escapeHtml(t('your_name'))}</label>
          <input class="input" id="ob_name" placeholder="${escapeHtml(t('your_name'))}" />
        </div>
        <div class="row" style="gap:8px">
          <button class="btn" id="ob_back">${escapeHtml(t('back'))}</button>
          <button class="btn btn-primary btn-block" id="ob_next">${escapeHtml(t('next'))}</button>
        </div>
      `);
      const inp = $('#ob_name'); inp.value = draft.name; setTimeout(()=>inp.focus(),50);
      inp.oninput = e => draft.name = e.target.value;
      $('#ob_back').onclick = ()=>{ step--; renderStep(); };
      $('#ob_next').onclick = ()=>{ step++; renderStep(); };
    } else if (s === 'currency') {
      const opts = SUPPORTED_CURRENCIES.map(c => `<option value="${c}">${c} — ${Fmt.currencySymbol(c)}</option>`).join('');
      root.innerHTML = wrap(`
        <h2 class="onboard-title">${escapeHtml(t('onboard_3_title'))}</h2>
        <p class="onboard-desc">${escapeHtml(t('onboard_3_desc'))}</p>
        <div class="field">
          <label class="field-label">${escapeHtml(t('select_currency'))}</label>
          <select class="select" id="ob_cur">${opts}</select>
        </div>
        <div class="row" style="gap:8px">
          <button class="btn" id="ob_back">${escapeHtml(t('back'))}</button>
          <button class="btn btn-primary btn-block" id="ob_next">${escapeHtml(t('next'))}</button>
        </div>
      `);
      $('#ob_cur').value = draft.currency;
      $('#ob_cur').onchange = e => draft.currency = e.target.value;
      $('#ob_back').onclick = ()=>{ step--; renderStep(); };
      $('#ob_next').onclick = ()=>{ step++; renderStep(); };
    } else if (s === 'account') {
      const types = ACCOUNT_TYPES.slice(0,5).map(at => `
        <button class="cat-tile ${draft.acc.type===at.id?'is-active':''}" data-type="${at.id}">
          <span class="e">${at.emoji}</span><span class="n">${escapeHtml(at.name)}</span>
        </button>`).join('');
      root.innerHTML = wrap(`
        <h2 class="onboard-title">${escapeHtml(t('onboard_4_title'))}</h2>
        <p class="onboard-desc">${escapeHtml(t('onboard_4_desc'))}</p>
        <div class="cat-grid" id="ob_types">${types}</div>
        <div class="field"><label class="field-label">${escapeHtml(t('acc_name'))}</label><input class="input" id="ob_acc_name"/></div>
        <div class="field"><label class="field-label">${escapeHtml(t('start_balance'))} (${escapeHtml(draft.currency)})</label><input class="input" id="ob_acc_bal" type="number" inputmode="decimal" step="0.01"/></div>
        <div class="row" style="gap:8px">
          <button class="btn" id="ob_back">${escapeHtml(t('back'))}</button>
          <button class="btn btn-primary btn-block" id="ob_next">${escapeHtml(t('next'))}</button>
        </div>
      `);
      $('#ob_acc_name').value = draft.acc.name;
      $('#ob_acc_bal').value  = draft.acc.balance;
      $('#ob_acc_name').oninput = e => draft.acc.name = e.target.value;
      $('#ob_acc_bal').oninput  = e => draft.acc.balance = parseFloat(e.target.value) || 0;
      $$('#ob_types .cat-tile').forEach(b => b.onclick = () => {
        draft.acc.type = b.dataset.type;
        $$('#ob_types .cat-tile').forEach(x => x.classList.toggle('is-active', x === b));
        Haptic.light();
      });
      $('#ob_back').onclick = ()=>{ step--; renderStep(); };
      $('#ob_next').onclick = ()=>{ step++; renderStep(); };
    } else if (s === 'done') {
      root.innerHTML = wrap(`
        <div style="font-size:56px;line-height:1;margin-bottom:8px">🎉</div>
        <h2 class="onboard-title">${escapeHtml(t('onboard_5_title'))}</h2>
        <p class="onboard-desc">${escapeHtml(t('onboard_5_desc'))}</p>
        <button class="btn btn-primary btn-lg btn-block" id="ob_finish">${escapeHtml(t('start'))}</button>
      `);
      $('#ob_finish').onclick = finish;
    }
  };

  const finish = () => {
    State.set(d => {
      d.user.name = draft.name || 'Friend';
      d.user.currency = draft.currency;
      d.user.onboarded = true;
    });
    // Add their first account
    const at = ACCOUNT_TYPES.find(x=>x.id===draft.acc.type) || ACCOUNT_TYPES[0];
    State.addAccount({ name: draft.acc.name || at.name, type: at.id, balance: draft.acc.balance, currency: draft.currency, cls: at.cls });
    // Add demo data
    seedDemoData();
    // Silently unlock achievements already earned via demo data (no toast spam)
    try {
      const s = State.raw();
      ACHIEVEMENTS.forEach(a => { try { if (a.test(s) && !s.achievements.some(x=>x.id===a.id)) s.achievements.push({ id:a.id, unlockedAt: Date.now() }); } catch {} });
      State.save();
    } catch {}
    // Hide onboarding, start app
    node().hidden = true;
    Theme.apply();
    Router.render();
    Confetti?.fire?.();
    Audio_.success();
    Haptic.success();
    Toast.show(`${t('welcome')}, ${escapeHtml(State.user().name)} 👋`, 'success');
  };

  const start = () => {
    step = 0;
    draft = { name:'', currency: State.user().currency || 'UZS', acc: { name:'Naqd pul', type:'cash', balance: 0 } };
    renderStep();
  };
  return { start };
})();

/* ---------- Modal ---------- */
const Modal = (() => {
  const openHTML = (markup, opts={}) => {
    const portal = $('#portal');
    const scrim = el('div', { class:'scrim', onclick: opts.dismissOnScrim===false ? null : close });
    const wrap = el('div', { class:'modal' });
    const card = el('div', { class:'modal-card', role:'dialog', 'aria-modal':'true', html: markup });
    wrap.append(card);
    portal.append(scrim, wrap);
    document.body.style.overflow = 'hidden';
    // Escape to close
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    card._onKey = onKey;
    card._onClose = typeof opts.onClose === 'function' ? opts.onClose : null;
    // Focus first focusable for a11y
    setTimeout(() => { const f = card.querySelector('input,select,textarea,button'); f?.focus?.({ preventScroll:true }); }, 60);
    return card;
  };
  const close = () => {
    const portal = $('#portal');
    const card = portal.querySelector('.modal-card');
    if (!card) return;
    const cb = card._onClose;
    if (card._onKey) document.removeEventListener('keydown', card._onKey);
    portal.innerHTML = '';
    document.body.style.overflow = '';
    if (cb) cb();
  };
  const isOpen = () => !!$('#portal').querySelector('.modal-card');
  return { open: openHTML, close, isOpen };
})();

/* ---------- Helpers used by views ---------- */
const Q = {
  cat(id){ return State.raw().categories.find(c=>c.id===id) || { name:'?', emoji:'•', color:'#999' }; },
  acc(id){ return State.raw().accounts.find(a=>a.id===id) || { name:'?', cls:'c-card' }; },
  monthRange(d=new Date()){
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59);
    return { start, end };
  },
  dayRange(d=new Date()){
    const s = new Date(d); s.setHours(0,0,0,0);
    const e = new Date(d); e.setHours(23,59,59,999);
    return { start: s, end: e };
  },
  weekRange(d=new Date()){
    const s = new Date(d); s.setHours(0,0,0,0);
    const dow = (s.getDay() + 6) % 7; // Mon=0
    s.setDate(s.getDate() - dow);
    const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999);
    return { start: s, end: e };
  },
  yearRange(d=new Date()){
    return { start: new Date(d.getFullYear(),0,1), end: new Date(d.getFullYear(),11,31,23,59,59) };
  },
  txInRange(start, end){
    const s = +new Date(start), e = +new Date(end);
    return State.transactions().filter(t => {
      const x = +new Date(t.date);
      return x >= s && x <= e;
    });
  },
  sum(list, type){ return list.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount||0),0); },
  totalBalance(){ return State.accounts().reduce((s,a)=>s+Number(a.balance||0),0); },
  delta(a, b){ if (b === 0) return a > 0 ? 100 : 0; return ((a - b) / Math.abs(b)) * 100; },
};

// Safe arithmetic eval for "calculator mode" — only digits, parens and + - * /
function safeCalc(expr){
  if (!/^[\d+\-*/.\s()]+$/.test(expr)) return null;
  try { /* eslint-disable no-new-func */ const v = Function(`"use strict";return (${expr});`)(); return Number.isFinite(v) ? v : null; }
  catch { return null; }
}

/* ---------- Views (defined in next chunks) ---------- */
const Views = {};

// Placeholder views — gradually replaced.
function placeholder(view, title, desc){
  view.append(el('div', { class:'card card-pad-lg' }, [
    el('h2', { class:'h-display', style:'font-size:24px;margin-bottom:6px' }, [title]),
    el('p', { class:'muted' }, [desc])
  ]));
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function moneyHTML(n, currency){
  currency = currency || State.user().currency;
  const num = Fmt.number(n, currency === 'UZS' ? { maximumFractionDigits: 0 } : {});
  const sym = Fmt.currencySymbol(currency);
  if (currency === 'UZS') return `<span class="num">${num}</span> <span class="cur">${escapeHtml(sym)}</span>`;
  return `<span class="cur">${escapeHtml(sym)}</span><span class="num">${num}</span>`;
}

function sparklinePath(values, w=320, h=56, pad=4){
  if (!values.length) return { path:'', area:'' };
  const min = Math.min(...values, 0), max = Math.max(...values, 0);
  const span = (max - min) || 1;
  const stepX = (w - pad*2) / Math.max(1, values.length - 1);
  const ptsArr = values.map((v,i) => [pad + i*stepX, h - pad - ((v - min)/span) * (h - pad*2)]);
  let p = '';
  ptsArr.forEach(([x,y], i) => p += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
  const a = p + ` L${(pad + (values.length-1)*stepX).toFixed(1)} ${(h-pad).toFixed(1)} L${pad} ${(h-pad).toFixed(1)} Z`;
  return { path: p, area: a };
}

function netFlowDaily(days=30){
  const out = []; const today = new Date(); today.setHours(0,0,0,0);
  for (let i = days - 1; i >= 0; i--){
    const d = new Date(today); d.setDate(today.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate()+1);
    const list = Q.txInRange(d, new Date(next.getTime()-1));
    out.push(Q.sum(list, 'income') - Q.sum(list, 'expense'));
  }
  return out;
}

function topCategories(period='month', limit=3){
  const r = period === 'month' ? Q.monthRange() : Q.weekRange();
  const list = Q.txInRange(r.start, r.end).filter(t => t.type === 'expense');
  const map = new Map();
  for (const t of list){
    map.set(t.category, (map.get(t.category) || 0) + Number(t.amount || 0));
  }
  return [...map.entries()]
    .map(([cat, sum]) => ({ cat, sum, info: Q.cat(cat) }))
    .sort((a,b) => b.sum - a.sum)
    .slice(0, limit);
}

function dashboardInsight(){
  const txs = State.transactions();
  if (txs.length < 3) return { emoji:'✨', text: t('add_some_tx') };
  const lang = State.lang();

  // Compare this week vs last
  const thisWeek = Q.weekRange();
  const last = { start: new Date(thisWeek.start), end: new Date(thisWeek.end) };
  last.start.setDate(last.start.getDate()-7);
  last.end.setDate(last.end.getDate()-7);
  const tw = Q.sum(Q.txInRange(thisWeek.start, thisWeek.end), 'expense');
  const lw = Q.sum(Q.txInRange(last.start,    last.end),    'expense');
  if (lw > 0){
    const diff = ((tw - lw) / lw) * 100;
    if (Math.abs(diff) >= 15){
      if (diff > 0){
        if (lang === 'ru') return { emoji:'⚠️', text:`Вы тратите на ${Math.round(diff)}% больше, чем на прошлой неделе.` };
        if (lang === 'en') return { emoji:'⚠️', text:`You're spending ${Math.round(diff)}% more than last week.` };
        return { emoji:'⚠️', text:`Bu hafta o'tgan haftaga nisbatan ${Math.round(diff)}% ko'proq sarfladingiz.` };
      } else {
        if (lang === 'ru') return { emoji:'🌱', text:`Расходы снизились на ${Math.abs(Math.round(diff))}% к прошлой неделе. Так держать!` };
        if (lang === 'en') return { emoji:'🌱', text:`Spending is down ${Math.abs(Math.round(diff))}% from last week. Nice.` };
        return { emoji:'🌱', text:`Bu hafta o'tganga nisbatan ${Math.abs(Math.round(diff))}% kam sarfladingiz. Zo'r!` };
      }
    }
  }

  // Savings rate
  const m = Q.monthRange();
  const inc = Q.sum(Q.txInRange(m.start, m.end), 'income');
  const exp = Q.sum(Q.txInRange(m.start, m.end), 'expense');
  if (inc > 0){
    const rate = Math.max(0, Math.round(((inc - exp) / inc) * 100));
    if (lang === 'ru') return { emoji:'💎', text:`Норма сбережений в этом месяце — ${rate}%.` };
    if (lang === 'en') return { emoji:'💎', text:`Your savings rate this month is ${rate}%.` };
    return { emoji:'💎', text:`Bu oyda jamg'arish darajangiz: ${rate}%.` };
  }
  return { emoji:'✨', text: 'Davom eting!' };
}

function renderDashboard(view){
  const accs = State.accounts();
  if (accs.length === 0){
    const btn = el('button', { class:'btn btn-primary' }, [t('add_account')]);
    btn.onclick = () => Router.navigate('/accounts');
    renderEmpty(view, '💎', t('app_title'), t('no_acc'), btn);
    return;
  }

  const monthR = Q.monthRange();
  const lastMonthR = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return Q.monthRange(d); })();
  const todayR = Q.dayRange();
  const weekR  = Q.weekRange();
  const yearR  = Q.yearRange();

  const incM = Q.sum(Q.txInRange(monthR.start, monthR.end), 'income');
  const expM = Q.sum(Q.txInRange(monthR.start, monthR.end), 'expense');
  const expLM = Q.sum(Q.txInRange(lastMonthR.start, lastMonthR.end), 'expense');
  const incLM = Q.sum(Q.txInRange(lastMonthR.start, lastMonthR.end), 'income');

  const totalBal = Q.totalBalance();
  const sparkData = netFlowDaily(30);
  const sp = sparklinePath(sparkData);

  const expDelta = Q.delta(expM, expLM);
  const incDelta = Q.delta(incM, incLM);

  // Hero balance card
  const hero = el('section', { class:'hero', style:'margin-bottom:14px' });
  hero.innerHTML = `
    <div class="hero-row">
      <div>
        <div class="hero-label">${escapeHtml(t('total_balance'))}</div>
        <div class="hero-balance balance">${moneyHTML(totalBal)}</div>
      </div>
    </div>
    <div class="hero-meta">
      <span class="pill"><span class="dot dot-success"></span>${escapeHtml(t('income'))}: <strong>${moneyHTML(incM)}</strong>${incLM>0 ? ` <span class="${incDelta>=0?'delta-up':'delta-down'}" style="margin-left:6px">${incDelta>=0?'↑':'↓'} ${Math.abs(Math.round(incDelta))}%</span>` : ''}</span>
      <span class="pill"><span class="dot dot-danger"></span>${escapeHtml(t('expense'))}: <strong>${moneyHTML(expM)}</strong>${expLM>0 ? ` <span class="${expDelta<=0?'delta-up':'delta-down'}" style="margin-left:6px">${expDelta>=0?'↑':'↓'} ${Math.abs(Math.round(expDelta))}%</span>` : ''}</span>
    </div>
    <div class="spark" aria-hidden="true">
      <svg viewBox="0 0 320 56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${sp.area}" fill="url(#spg)"/>
        <path d="${sp.path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" opacity="0.95"/>
      </svg>
    </div>`;
  view.append(hero);

  // Quick stat tiles
  const expToday = Q.sum(Q.txInRange(todayR.start, todayR.end), 'expense');
  const expWeek  = Q.sum(Q.txInRange(weekR.start, weekR.end),  'expense');
  const expYear  = Q.sum(Q.txInRange(yearR.start, yearR.end),  'expense');
  const tiles = el('section', { class:'tiles', style:'margin-bottom:14px' });
  const mkTile = (label, value) => `
    <div class="tile">
      <span class="tile-label">${escapeHtml(label)}</span>
      <span class="tile-value amount">${moneyHTML(value)}</span>
    </div>`;
  tiles.innerHTML = [
    mkTile(t('today'),     expToday),
    mkTile(t('this_week'), expWeek),
    mkTile(t('this_month'), expM),
    mkTile(t('this_year'), expYear),
  ].join('');
  view.append(tiles);

  // Insight of the day
  const ins = dashboardInsight();
  const insightCard = el('section', { class:'insight', style:'margin-bottom:14px' });
  insightCard.innerHTML = `
    <span class="insight-emoji">${ins.emoji}</span>
    <div>
      <div class="label" style="margin-bottom:2px">${escapeHtml(t('insight_of_day'))}</div>
      <div style="font-size:14px;font-weight:600">${escapeHtml(ins.text)}</div>
    </div>`;
  view.append(insightCard);

  // Two-column: Recent tx + Top categories
  const grid = el('section', { class:'grid', style:'grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap:14px; margin-bottom:14px' });

  const recent = State.transactions().slice(0, 5);
  const recentCard = el('div', { class:'card' });
  recentCard.innerHTML = `
    <div class="card-h">
      <h3>${escapeHtml(t('recent'))}</h3>
      <a class="link" href="#/transactions">${escapeHtml(t('view_all'))} →</a>
    </div>
    <div id="dash_recent"></div>`;
  grid.append(recentCard);

  const topCats = topCategories('month', 3);
  const topCard = el('div', { class:'card' });
  topCard.innerHTML = `
    <div class="card-h"><h3>${escapeHtml(t('top_categories'))}</h3></div>
    <div id="dash_top"></div>`;
  grid.append(topCard);
  view.append(grid);

  // Stack on small screens
  if (window.matchMedia('(max-width: 760px)').matches){
    grid.style.gridTemplateColumns = '1fr';
  }

  // Render recent
  const recentBox = $('#dash_recent', view);
  if (recent.length === 0){
    const btn = el('button', { class:'btn btn-primary' }, [t('add_first')]);
    btn.onclick = () => openAddTransaction();
    renderEmpty(recentBox, '📭', t('no_tx'), t('no_tx_desc'), btn);
  } else {
    recent.forEach(tx => recentBox.append(renderTxRow(tx)));
  }

  // Render top categories with mini donut
  const topBox = $('#dash_top', view);
  if (topCats.length === 0){
    renderEmpty(topBox, '🥧', t('no_data'), t('add_some_tx'));
  } else {
    const total = topCats.reduce((s,x)=>s+x.sum, 0);
    const r = 28; const C = 2*Math.PI*r;
    let acc = 0; let segments = '';
    topCats.forEach((c) => {
      const frac = c.sum / total;
      const dash = (frac * C);
      const offset = -acc;
      segments += `<circle cx="36" cy="36" r="${r}" fill="none" stroke="${c.info.color}" stroke-width="10" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 36 36)"/>`;
      acc += dash;
    });
    const donut = el('div', { style:'display:flex;align-items:center;gap:14px;padding:6px 2px 12px' });
    donut.innerHTML = `
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="10"/>
        ${segments}
      </svg>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0">
        ${topCats.map(c => `
          <div class="row" style="gap:8px">
            <span style="width:8px;height:8px;border-radius:50%;background:${c.info.color};flex-shrink:0"></span>
            <span style="flex:1;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.info.emoji} ${escapeHtml(c.info.name)}</span>
            <span class="amount" style="font-weight:700;font-size:12.5px">${moneyHTML(c.sum)}</span>
          </div>`).join('')}
      </div>`;
    topBox.append(donut);
  }

  // Budgets ring overview
  const buds = State.budgets().filter(b => b.month === new Date().getMonth() && b.year === new Date().getFullYear());
  if (buds.length){
    const card = el('div', { class:'card', style:'margin-bottom:14px' });
    card.innerHTML = `
      <div class="card-h">
        <h3>${escapeHtml(t('budget'))} · ${escapeHtml(Fmt.monthLabel(new Date()))}</h3>
        <a class="link" href="#/budget">${escapeHtml(t('view_all'))} →</a>
      </div>
      <div id="dash_buds" class="grid grid-3"></div>`;
    view.append(card);
    const box = $('#dash_buds', view);
    buds.slice(0, 6).forEach(b => {
      const c = Q.cat(b.category);
      const spent = Q.txInRange(monthR.start, monthR.end)
        .filter(t => t.type==='expense' && t.category===b.category)
        .reduce((s,t)=>s+Number(t.amount||0),0);
      const pct = Math.min(100, Math.round((spent / Math.max(1,b.limit)) * 100));
      const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
      const r = 22, C = 2*Math.PI*r;
      const off = C - (pct/100)*C;
      const item = el('div', { class:'card', style:'display:flex;align-items:center;gap:12px;padding:12px' });
      item.innerHTML = `
        <svg class="ring" width="56" height="56" viewBox="0 0 56 56">
          <circle class="ring-bg" cx="28" cy="28" r="${r}" fill="none" stroke-width="6"/>
          <circle class="ring-fg ${cls}" cx="28" cy="28" r="${r}" fill="none" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 28 28)"/>
        </svg>
        <div style="min-width:0;flex:1">
          <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.emoji} ${escapeHtml(c.name)}</div>
          <div class="small muted">${moneyHTML(spent)} / ${moneyHTML(b.limit)}</div>
        </div>
        <span class="chip ${cls === 'success' ? 'chip-success' : cls === 'warning' ? 'chip-warning' : 'chip-danger'}">${pct}%</span>`;
      box.append(item);
    });
  }

  // Goals mini progress
  const goals = State.goals().slice(0, 3);
  if (goals.length){
    const card = el('div', { class:'card', style:'margin-bottom:14px' });
    card.innerHTML = `
      <div class="card-h">
        <h3>${escapeHtml(t('goals'))}</h3>
        <a class="link" href="#/goals">${escapeHtml(t('view_all'))} →</a>
      </div>
      <div id="dash_goals" class="stack"></div>`;
    view.append(card);
    const box = $('#dash_goals', view);
    goals.forEach(g => {
      const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
      const row = el('div');
      row.innerHTML = `
        <div class="row" style="margin-bottom:6px">
          <span style="font-size:18px">${g.icon || '🎯'}</span>
          <span style="font-weight:700;font-size:14px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(g.name)}</span>
          <span class="muted small">${moneyHTML(g.current)} / ${moneyHTML(g.target)}</span>
        </div>
        <div class="progress ${pct>=100?'success':''}"><div class="progress-fill" style="width:${pct}%"></div></div>`;
      box.append(row);
    });
  }
}
Router.register('/', renderDashboard);

/* Render a single transaction row (reused in dashboard + transactions list) */
function renderTxRow(tx){
  const c = Q.cat(tx.category);
  const a = Q.acc(tx.account);
  const sign = tx.type === 'income' ? '+' : (tx.type === 'expense' ? '−' : '↔');

  const wrap = el('div', { class:'tx-wrap' });
  const bg = el('div', { class:'tx-delete-bg', 'aria-hidden':'true' });
  bg.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;

  const node = el('div', {
    class: 'tx',
    style: `--cat-color:${c.color}; --cat-soft:${c.color}22`,
  });
  node.innerHTML = `
    <div class="tx-icon">${c.emoji}</div>
    <div class="tx-meta">
      <div class="tx-title">${escapeHtml(tx.note || c.name)}</div>
      <div class="tx-sub">${escapeHtml(c.name)} · ${escapeHtml(a.name || '—')}</div>
    </div>
    <div class="tx-amount ${tx.type}">${sign} ${moneyHTML(tx.amount, tx.currency)}</div>`;

  // Click to edit (suppressed right after a swipe)
  let swiped = false;
  node.addEventListener('click', () => {
    if (swiped) { swiped = false; return; }
    Views.editTransaction(tx.id);
  });

  // Touch swipe-to-delete (mobile)
  let startX = 0, startY = 0, dx = 0, dragging = false;
  node.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; dragging = true; dx = 0;
    node.style.transition = 'none';
  }, { passive: true });
  node.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const x = e.touches[0].clientX, y = e.touches[0].clientY;
    if (Math.abs(y - startY) > Math.abs(x - startX)) { dragging = false; node.style.transform = ''; return; }
    dx = Math.min(0, x - startX);
    node.style.transform = `translateX(${Math.max(dx, -96)}px)`;
    bg.style.opacity = String(Math.min(1, -dx / 80));
  }, { passive: true });
  node.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    node.style.transition = '';
    if (dx < -72){
      swiped = true;
      node.style.transform = 'translateX(-100%)';
      node.style.opacity = '0';
      const id = tx.id;
      Haptic.medium();
      setTimeout(() => { State.removeTx(id); Toast.show(t('deleted')); Router.render(); }, 180);
    } else {
      node.style.transform = '';
      bg.style.opacity = '0';
    }
  });

  wrap.append(bg, node);
  return wrap;
}

/* =========================================================
   ADD / EDIT TRANSACTION (modal-as-page)
   ========================================================= */
Views.openTxEditor = function(existing, opts={}){
  const isEdit = !!existing;
  const accs = State.accounts();
  if (accs.length === 0){
    Toast.show(t('no_acc'), 'danger');
    Router.navigate('/accounts');
    return;
  }
  // Working draft
  const today = Fmt.iso(new Date());
  const draft = existing ? { ...existing } : {
    type: 'expense',
    amount: 0,
    currency: State.user().currency,
    category: null,
    account: accs[0]?.id,
    toAccount: accs[1]?.id || null,
    date: today,
    note: '',
    tags: [],
    recurring: null,
  };
  let calcExpr = String(draft.amount || '').replace(/^0$/, '');

  const cats = () => State.categories(draft.type === 'transfer' ? null : draft.type);
  const accOpts = () => accs.map(a => `<option value="${a.id}">${escapeHtml(a.name)} · ${moneyShortText(a.balance)} ${escapeHtml(Fmt.currencySymbol(a.currency))}</option>`).join('');

  function moneyShortText(n){
    return Fmt.moneyShort(n);
  }

  const card = Modal.open(`
    <div class="modal-h">
      <button class="icon-btn" id="m_close" aria-label="${escapeHtml(t('close'))}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="title">${escapeHtml(isEdit ? t('edit_tx') : t('new_tx'))}</div>
      ${isEdit ? `<button class="icon-btn" id="m_dup" aria-label="${escapeHtml(t('duplicate'))}" title="${escapeHtml(t('duplicate'))}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>` : ''}
    </div>
    <div class="modal-body">
      <div class="seg seg-${draft.type === 'income' ? 'income' : draft.type === 'expense' ? 'expense' : 'transfer'}" id="m_type" role="tablist">
        <button data-v="income"   role="tab">${escapeHtml(t('income'))}</button>
        <button data-v="expense"  role="tab">${escapeHtml(t('expense'))}</button>
        <button data-v="transfer" role="tab">${escapeHtml(t('transfer'))}</button>
      </div>

      <div>
        <div class="calc" id="m_calc">${moneyHTML(0, draft.currency)}</div>
        <div class="calc-eval" id="m_eval">&nbsp;</div>
        <div class="keypad" id="m_pad" style="margin-top:8px">
          <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button data-k="op" class="op" data-op="/">÷</button>
          <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button data-k="op" class="op" data-op="*">×</button>
          <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button data-k="op" class="op" data-op="-">−</button>
          <button data-k="000">000</button><button data-k="0">0</button><button data-k=".">.</button><button data-k="op" class="op" data-op="+">+</button>
          <button data-k="back">⌫</button><button data-k="clear">C</button><button data-k="voice" id="m_voice">🎤</button><button data-k="ok" class="ok">=</button>
        </div>
      </div>

      <div id="m_section_cat" class="field">
        <label class="field-label">${escapeHtml(t('category'))}</label>
        <div class="cat-grid" id="m_cats"></div>
      </div>

      <div id="m_section_accs">
        <div class="grid grid-2">
          <div class="field" id="m_field_from">
            <label class="field-label">${escapeHtml(t('account'))}</label>
            <select class="select" id="m_acc">${accOpts()}</select>
          </div>
          <div class="field" id="m_field_to" hidden>
            <label class="field-label">${escapeHtml(t('transfer_to'))}</label>
            <select class="select" id="m_acc_to">${accOpts()}</select>
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="field">
          <label class="field-label">${escapeHtml(t('date'))}</label>
          <input class="input" type="date" id="m_date" value="${escapeHtml(draft.date)}"/>
        </div>
        <div class="field">
          <label class="field-label">${escapeHtml(t('frequency'))}</label>
          <select class="select" id="m_rec">
            <option value="">${escapeHtml(t('disabled'))}</option>
            <option value="daily">${escapeHtml(t('daily'))}</option>
            <option value="weekly">${escapeHtml(t('weekly'))}</option>
            <option value="biweekly">${escapeHtml(t('biweekly'))}</option>
            <option value="monthly">${escapeHtml(t('monthly'))}</option>
            <option value="yearly">${escapeHtml(t('yearly'))}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field-label">${escapeHtml(t('note'))}</label>
        <input class="input" id="m_note" placeholder="${escapeHtml(t('note_ph'))}" value="${escapeHtml(draft.note || '')}"/>
      </div>
    </div>
    <div class="modal-foot">
      ${isEdit ? `<button class="btn btn-danger" id="m_del">${escapeHtml(t('delete'))}</button>` : ''}
      <span class="spacer"></span>
      <button class="btn" id="m_cancel">${escapeHtml(t('cancel'))}</button>
      <button class="btn btn-primary" id="m_save">${escapeHtml(t('save'))}</button>
    </div>
  `, { onClose: opts.onClose });

  // Helpers
  const calcEl = card.querySelector('#m_calc');
  const evalEl = card.querySelector('#m_eval');
  const renderCalc = () => {
    const v = safeCalc(calcExpr || '0');
    draft.amount = (v == null ? 0 : v);
    calcEl.innerHTML = (calcExpr || '0').match(/[+\-*/]/) ? `<span class="num">${escapeHtml(calcExpr)}</span>` : moneyHTML(draft.amount, draft.currency);
    evalEl.textContent = (calcExpr.match(/[+\-*/]/) && v != null) ? '= ' + Fmt.number(v) : '\u00A0';
  };
  const renderType = () => {
    card.querySelectorAll('#m_type button').forEach(b => b.classList.toggle('is-active', b.dataset.v === draft.type));
    card.querySelector('#m_type').className = `seg seg-${draft.type === 'income' ? 'income' : draft.type === 'expense' ? 'expense' : 'transfer'}`;
    const isXfer = draft.type === 'transfer';
    card.querySelector('#m_field_to').hidden = !isXfer;
    card.querySelector('#m_section_cat').hidden = isXfer;
    renderCats();
  };
  const renderCats = () => {
    const box = card.querySelector('#m_cats'); box.innerHTML = '';
    cats().forEach(c => {
      const tile = el('button', { class: 'cat-tile' + (draft.category === c.id ? ' is-active' : ''), 'data-id': c.id });
      tile.innerHTML = `<span class="e" style="background: ${c.color}1a;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;font-size:20px">${c.emoji}</span><span class="n">${escapeHtml(c.name)}</span>`;
      tile.onclick = () => { draft.category = c.id; renderCats(); Haptic.light(); };
      box.append(tile);
    });
  };

  // Set initial state from draft
  if (draft.category) {/* keep */} else {
    const list = cats(); if (list.length) draft.category = list[0].id;
  }

  // Wire events
  card.querySelector('#m_close').onclick = card.querySelector('#m_cancel').onclick = () => Modal.close();
  card.querySelectorAll('#m_type button').forEach(b => b.onclick = () => { draft.type = b.dataset.v; renderType(); Haptic.light(); });
  card.querySelector('#m_acc').value = draft.account || accs[0]?.id;
  card.querySelector('#m_acc').onchange = e => draft.account = e.target.value;
  card.querySelector('#m_acc_to').value = draft.toAccount || accs[1]?.id || '';
  card.querySelector('#m_acc_to').onchange = e => draft.toAccount = e.target.value;
  card.querySelector('#m_date').onchange = e => draft.date = e.target.value;
  card.querySelector('#m_note').oninput = e => draft.note = e.target.value;
  card.querySelector('#m_rec').value = draft.recurring || '';
  card.querySelector('#m_rec').onchange = e => draft.recurring = e.target.value || null;

  // Keypad
  card.querySelectorAll('#m_pad button').forEach(b => b.onclick = (e) => {
    const k = b.dataset.k;
    Audio_.tap(); Haptic.light();
    if (k === 'back')  { calcExpr = calcExpr.slice(0, -1); }
    else if (k === 'clear') { calcExpr = ''; }
    else if (k === 'ok')    { const v = safeCalc(calcExpr || '0'); if (v != null) calcExpr = String(Math.abs(Math.round(v*100)/100)); }
    else if (k === 'op')    { calcExpr += b.dataset.op; }
    else if (k === 'voice') { startVoiceInput(); }
    else { calcExpr += k; }
    renderCalc();
  });

  // Voice input
  function startVoiceInput(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR){ Toast.show('Voice input not supported', 'danger'); return; }
    const rec = new SR();
    rec.lang = State.lang() === 'ru' ? 'ru-RU' : (State.lang() === 'uz' ? 'uz-UZ' : 'en-US');
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      const num = parseFloat(text);
      if (!isNaN(num)) { calcExpr = String(num); renderCalc(); Audio_.success(); }
    };
    rec.onerror = () => Toast.show('Voice error', 'danger');
    rec.start();
    Toast.show('🎤 ...');
  }

  if (isEdit){
    card.querySelector('#m_dup').onclick = () => {
      const copy = { ...existing }; delete copy.id; delete copy.createdAt; copy.date = today;
      State.addTx(copy);
      Audio_.success(); Haptic.success(); Toast.show(t('saved'), 'success');
      Modal.close();
      if (!opts.onClose) Router.render();
    };
    card.querySelector('#m_del').onclick = () => {
      State.removeTx(existing.id);
      Toast.show(t('deleted')); Haptic.medium();
      Modal.close();
      if (!opts.onClose) Router.render();
    };
  }

  card.querySelector('#m_save').onclick = () => {
    if (!draft.amount || draft.amount <= 0){ Toast.show(t('enter_amount'), 'danger'); Haptic.error(); Audio_.error(); return; }
    if (draft.type !== 'transfer' && !draft.category){ Toast.show(t('please_select_cat'), 'danger'); Haptic.error(); return; }
    if (!draft.account){ Toast.show(t('please_select_acc'), 'danger'); Haptic.error(); return; }
    if (draft.type === 'transfer' && (!draft.toAccount || draft.toAccount === draft.account)){ Toast.show('From ≠ To', 'danger'); Haptic.error(); return; }

    // Normalize: transfers carry no category
    if (draft.type === 'transfer') draft.category = null;

    if (isEdit){
      State.updateTx(existing.id, draft);
    } else {
      const tx = State.addTx(draft);
      // Recurring registration
      if (draft.recurring){
        State.addRecurring({ name: draft.note || Q.cat(draft.category).name, amount: draft.amount, category: draft.category, account: draft.account, frequency: draft.recurring, nextDate: nextDateForFreq(draft.date, draft.recurring) });
      }
      // Award XP + check achievements
      State.set(d => { d.user.xp = (d.user.xp || 0) + 5; while (d.user.xp >= d.user.level * 50){ d.user.xp -= d.user.level * 50; d.user.level += 1; } });
      if (tx.type === 'income') Confetti?.fire?.({ count: 40 });
      checkAchievements();
    }
    Audio_.success(); Haptic.success(); Toast.show(t('saved'), 'success');
    Modal.close();
    if (!opts.onClose) Router.render();
  };

  renderType();
  renderCalc();
};

Views.editTransaction = function(id){
  const tx = State.transactions().find(t => t.id === id);
  if (!tx) return;
  Views.openTxEditor(tx);
};

function nextDateForFreq(fromISO, freq){
  const d = new Date(fromISO);
  switch (freq){
    case 'daily':    d.setDate(d.getDate()+1); break;
    case 'weekly':   d.setDate(d.getDate()+7); break;
    case 'biweekly': d.setDate(d.getDate()+14); break;
    case 'monthly':  d.setMonth(d.getMonth()+1); break;
    case 'yearly':   d.setFullYear(d.getFullYear()+1); break;
  }
  return Fmt.iso(d);
}

/* Open the add-transaction editor as an overlay over the current page (FAB, nav, keyboard). */
function openAddTransaction(){
  if (State.accounts().length === 0){
    Toast.show(t('no_acc'), 'danger');
    Router.navigate('/accounts');
    return;
  }
  Views.openTxEditor(null);
}

Router.register('/add', (view) => {
  // Deep-link / shortcut entry: render dashboard underneath, then open editor.
  // On close (incl. scrim dismiss) return to dashboard so we never leave a blank page.
  renderDashboard(view);
  if (State.accounts().length === 0){ Router.navigate('/accounts'); return; }
  Views.openTxEditor(null, { onClose: () => { if (Router.current() === '/add') Router.navigate('/'); } });
});

/* =========================================================
   TRANSACTIONS LIST
   ========================================================= */
Router.register('/transactions', (view) => {
  const filtersBar = el('div', { class:'card', style:'margin-bottom:12px;display:flex;flex-direction:column;gap:10px' });
  filtersBar.innerHTML = `
    <input class="input input-search" id="tx_search" type="search" placeholder="${escapeHtml(t('search_ph'))}"/>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="chip is-active" data-f="all">${escapeHtml(t('all'))}</button>
      <button class="chip" data-f="income">${escapeHtml(t('income'))}</button>
      <button class="chip" data-f="expense">${escapeHtml(t('expense'))}</button>
      <button class="chip" data-f="transfer">${escapeHtml(t('transfer'))}</button>
      <span style="flex:1"></span>
      <button class="chip" id="tx_export">${escapeHtml(t('export'))} CSV</button>
    </div>`;
  view.append(filtersBar);

  const listBox = el('div', { class:'tx-list' });
  view.append(listBox);

  let filter = 'all';
  let search = '';

  function render(){
    listBox.innerHTML = '';
    const all = State.transactions();
    const items = all
      .filter(t => filter === 'all' ? true : t.type === filter)
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        const c = Q.cat(t.category);
        const a = Q.acc(t.account);
        return (t.note||'').toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (a.name||'').toLowerCase().includes(q) || String(t.amount).includes(q);
      });

    if (items.length === 0){
      const btn = el('button', { class:'btn btn-primary' }, [t('add_first')]);
      btn.onclick = () => openAddTransaction();
      renderEmpty(listBox, '🔎', t('no_tx'), t('no_tx_desc'), btn);
      return;
    }

    // Group by day
    const groups = new Map();
    for (const t of items){
      const k = t.date;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    }
    const sortedKeys = [...groups.keys()].sort((a,b) => b.localeCompare(a));
    sortedKeys.forEach(k => {
      const list = groups.get(k);
      const inc = Q.sum(list, 'income');
      const exp = Q.sum(list, 'expense');
      const net = inc - exp;
      const head = el('div', { class:'tx-day' });
      head.innerHTML = `
        <span class="day">${escapeHtml(Fmt.dayLabel(k))}</span>
        <span class="day-total ${net >= 0 ? 'delta-up' : 'delta-down'}" style="margin-left:auto">${net >= 0 ? '+' : '−'} ${Fmt.moneyShort(Math.abs(net))}</span>`;
      listBox.append(head);
      list.forEach(tx => listBox.append(renderTxRow(tx)));
    });
  }

  filtersBar.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    filter = b.dataset.f;
    filtersBar.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('is-active', x === b));
    render();
  });
  let to = 0;
  filtersBar.querySelector('#tx_search').oninput = (e) => {
    clearTimeout(to); to = setTimeout(() => { search = e.target.value; render(); }, 180);
  };
  filtersBar.querySelector('#tx_export').onclick = exportCSV;

  render();
});

function exportCSV(){
  const txs = State.transactions();
  const header = ['date','type','amount','currency','category','account','note'];
  const rows = txs.map(t => [
    t.date, t.type, t.amount, t.currency || State.user().currency,
    (Q.cat(t.category).name || ''), (Q.acc(t.account).name || ''), (t.note || '')
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `qiymat-${Fmt.iso(new Date())}.csv`;
  document.body.append(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  Toast.show(t('saved'), 'success');
}

/* "More" menu (mobile) — tiles for everything */
Router.register('/more', (view) => {
  const u = State.user();
  const greet = el('div', { class:'card', style:'margin-bottom:14px' });
  greet.innerHTML = `
    <div class="row">
      <div style="width:44px;height:44px;border-radius:50%;background:var(--accent);color:var(--accent-on);display:grid;place-items:center;font-family:var(--font-display);font-size:20px">${escapeHtml((u.name||'?').slice(0,1).toUpperCase())}</div>
      <div>
        <div style="font-weight:700">${escapeHtml(u.name || 'Friend')}</div>
        <div class="muted small">${escapeHtml(t('level'))} ${u.level} · ${u.xp} ${escapeHtml(t('xp'))}</div>
      </div>
    </div>`;
  view.append(greet);
  const items = [
    ['/goals',      t('goals'),      '💎'],
    ['/accounts',   t('accounts'),   '💳'],
    ['/reports',    t('reports'),    '📊'],
    ['/categories', t('categories'), '🏷️'],
    ['/recurring',  t('recurring'),  '🔁'],
    ['/networth',   t('networth'),   '📈'],
    ['/insights',   t('insights'),   '✨'],
    ['/mini',       t('mini'),       '🛠️'],
    ['/settings',   t('settings'),   '⚙️'],
  ];
  const grid = el('div', { class:'grid grid-3' });
  items.forEach(([href, label, emo]) => {
    const a = el('a', { href:'#'+href, class:'card', style:'display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:18px;min-height:96px;border-radius:18px' });
    a.innerHTML = `<span style="font-size:28px;line-height:1">${emo}</span><span style="font-weight:700;font-size:14px">${escapeHtml(label)}</span>`;
    grid.append(a);
  });
  view.append(grid);
});

/* Empty state helper */
function renderEmpty(parent, glyph, title, desc, action){
  const tpl = $('#tpl-empty').content.cloneNode(true);
  tpl.querySelector('.empty-glyph').textContent = glyph;
  tpl.querySelector('.empty-title').textContent = title;
  tpl.querySelector('.empty-desc').textContent  = desc;
  if (action) tpl.querySelector('.empty-action').append(action);
  parent.append(tpl);
}

/* =========================================================
   ACHIEVEMENTS (gamification)
   ========================================================= */
const ACHIEVEMENTS = [
  { id:'first_tx',    emoji:'✨', name:{uz:'Birinchi qadam', en:'First step', ru:'Первый шаг'}, test: s => s.transactions.length >= 1 },
  { id:'first_save',  emoji:'💰', name:{uz:'Birinchi jamg\'arma', en:'First savings', ru:'Первые накопления'}, test: s => s.goals.some(g => g.current > 0) },
  { id:'tracker_10',  emoji:'🎓', name:{uz:'10 ta yozuv', en:'10 entries', ru:'10 записей'}, test: s => s.transactions.length >= 10 },
  { id:'tracker_30',  emoji:'📈', name:{uz:'30 ta yozuv', en:'30 entries', ru:'30 записей'}, test: s => s.transactions.length >= 30 },
  { id:'budget_set',  emoji:'🎯', name:{uz:'Byudjetchi', en:'Budgeter', ru:'Бюджетник'}, test: s => s.budgets.length >= 1 },
  { id:'goal_done',   emoji:'🏆', name:{uz:'Maqsadga yetdi', en:'Goal achiever', ru:'Цель достигнута'}, test: s => s.goals.some(g => g.achieved || g.current >= g.target) },
  { id:'multi_acc',   emoji:'💳', name:{uz:'Ko\'p hisob', en:'Multi-account', ru:'Несколько счетов'}, test: s => s.accounts.filter(a=>!a.archived).length >= 3 },
  { id:'saver_100k',  emoji:'💪', name:{uz:'100K jamg\'arma', en:'Saved 100K', ru:'Накоплено 100K'}, test: s => s.goals.reduce((x,g)=>x+Number(g.current||0),0) >= 100000 },
  { id:'saver_1m',    emoji:'💎', name:{uz:'1M jamg\'arma', en:'Saved 1M', ru:'Накоплено 1M'}, test: s => s.goals.reduce((x,g)=>x+Number(g.current||0),0) >= 1000000 },
  { id:'recurring_1', emoji:'🔁', name:{uz:'Obunalar', en:'Subscriptions', ru:'Подписки'}, test: s => s.recurring.length >= 1 },
  { id:'income_in',   emoji:'🤑', name:{uz:'Daromad kirdi', en:'Income tracked', ru:'Доход учтён'}, test: s => s.transactions.some(t=>t.type==='income') },
  { id:'level_5',     emoji:'🌟', name:{uz:'5-daraja', en:'Level 5', ru:'Уровень 5'}, test: s => (s.user.level||1) >= 5 },
];

function achName(a){ return a.name[State.lang()] || a.name.uz; }

function checkAchievements(){
  const s = State.raw();
  const unlocked = new Set((s.achievements || []).map(a => a.id));
  let newly = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.has(a.id)){
      let ok = false;
      try { ok = a.test(s); } catch {}
      if (ok){ s.achievements.push({ id: a.id, unlockedAt: Date.now() }); newly.push(a); }
    }
  });
  if (newly.length){
    State.save();
    const a = newly[0];
    Confetti?.fire?.({ count: 80 });
    Audio_.success(); Haptic.success();
    Toast.show(`${a.emoji} ${achName(a)}!`, 'success');
  }
  return newly;
}

/* =========================================================
   RECURRING — auto-trigger due payments
   ========================================================= */
function processRecurring(){
  const today = new Date(); today.setHours(23,59,59,999);
  let added = 0;
  State.recurring().forEach(r => {
    if (!r.enabled || !r.nextDate) return;
    if (!State.raw().accounts.find(a => a.id === r.account)) return; // account removed
    let guard = 0;
    while (new Date(r.nextDate) <= today && guard < 120){
      State.addTx({
        type: 'expense', amount: r.amount, category: r.category, account: r.account,
        date: r.nextDate, note: r.name, currency: State.user().currency, fromRecurring: r.id
      });
      r.nextDate = nextDateForFreq(r.nextDate, r.frequency);
      r.lastTriggered = Date.now();
      added++; guard++;
    }
  });
  if (added){
    State.save();
    Toast.show(`🔁 ${added} ${State.lang()==='en'?'recurring added':State.lang()==='ru'?'регулярных добавлено':'ta takroriy qo\'shildi'}`);
  }
}

/* ---------- Boot ---------- */
function buildSideRail(){
  const links = [
    ['/',           t('dashboard'), '🏠'],
    ['/transactions', t('transactions'), '📋'],
    ['/budget',      t('budget'), '🎯'],
    ['/goals',       t('goals'), '💎'],
    ['/accounts',    t('accounts'), '💳'],
    ['/reports',     t('reports'), '📊'],
    ['/categories',  t('categories'), '🏷️'],
    ['/recurring',   t('recurring'), '🔁'],
    ['/networth',    t('networth'), '📈'],
    ['/insights',    t('insights'), '✨'],
    ['/mini',        t('mini'), '🛠️'],
    ['/settings',    t('settings'), '⚙️'],
  ];
  const rail = el('aside', { class: 'side-rail', 'aria-label':'Side navigation' }, [
    el('div', { class:'brand' }, [
      el('div', { class:'brand-q' }, ['Q']),
      el('div', { class:'brand-t' }, [t('app_title')]),
    ]),
    ...links.map(([path, label, emo]) =>
      el('a', { href:'#'+path, class:'side-link', dataset:{ route: path } }, [
        el('span', { style:'width:18px;display:inline-grid;place-items:center;font-size:14px' }, [emo]),
        el('span', {}, [label]),
      ])
    )
  ]);
  document.body.append(rail);
}

function bindGlobalEvents(){
  // FAB
  $('#fab').addEventListener('click', () => openAddTransaction());
  // Bottom-nav "add" — overlay over the current page instead of navigating away
  const navAdd = $('.nav-item-add');
  if (navAdd) navAdd.addEventListener('click', (e) => { e.preventDefault(); openAddTransaction(); });
  // Topbar back
  $('#navBack').addEventListener('click', () => history.back());
  // Privacy toggle
  $('#btnPrivacy').addEventListener('click', () => {
    State.set(d => { d.settings.privacyMode = !d.settings.privacyMode; });
    Theme.apply(); Haptic.light();
    Toast.show(State.settings().privacyMode ? '👁️ Maxfiylik yoqildi' : '👁️ Maxfiylik o\'chirildi');
  });
  // Search
  $('#btnSearch').addEventListener('click', () => Router.navigate('/transactions'));

  // System theme change
  if (window.matchMedia){
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', () => { if (State.settings().theme === 'auto') Theme.apply(); });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (Modal.isOpen() || !$('#onboarding').hidden) return; // don't trigger behind modal / onboarding
    const k = e.key.toLowerCase();
    if (k === 'n')  { e.preventDefault(); openAddTransaction(); }
    if (k === 't')  { Theme.setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
    if (k === '?')  { Router.navigate('/settings'); }
    // g + key sequences
    if (k === 'g'){
      const onSecond = (ev) => {
        const sk = ev.key.toLowerCase();
        const map = { d:'/', t:'/transactions', b:'/budget', s:'/goals', a:'/accounts', r:'/reports', m:'/mini', c:'/categories', i:'/insights' };
        if (map[sk]) { ev.preventDefault(); Router.navigate(map[sk]); }
        document.removeEventListener('keydown', onSecond, true);
      };
      document.addEventListener('keydown', onSecond, true);
      setTimeout(()=> document.removeEventListener('keydown', onSecond, true), 900);
    }
  });
}

function registerSW(){
  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    });
  }
}

function init(){
  Theme.apply();
  buildSideRail();
  bindGlobalEvents();
  registerSW();

  // Show app shell
  $('#splash').setAttribute('hidden','');
  $('#app').hidden = false;

  if (!State.user().onboarded){
    Onboarding.start();
  } else {
    processRecurring();
    checkAchievements();
    Router.render();
  }
}

document.addEventListener('DOMContentLoaded', init);
window.Qiymat = { State, Router, Theme, Toast, Haptic, Audio_, Modal, Q, Fmt, t, I18N };



/* =========================================================
   BUDGET
   ========================================================= */
Router.register('/budget', (view) => {
  const monthR = Q.monthRange();
  const monthName = Fmt.monthLabel(new Date());
  const incM = Q.sum(Q.txInRange(monthR.start, monthR.end), 'income');
  const expM = Q.sum(Q.txInRange(monthR.start, monthR.end), 'expense');
  const monthBuds = State.budgets().filter(b => b.month === new Date().getMonth() && b.year === new Date().getFullYear());
  const totalBudget = monthBuds.reduce((s,b) => s+Number(b.limit||0), 0);
  const spentInBudget = monthBuds.reduce((s,b) => {
    const v = Q.txInRange(monthR.start, monthR.end).filter(t=>t.type==='expense' && t.category===b.category).reduce((x,t)=>x+Number(t.amount||0),0);
    return s + v;
  }, 0);
  const allowance = totalBudget > 0 ? Math.max(0, (totalBudget - spentInBudget) / Math.max(1, daysLeftInMonth())) : 0;

  // Header card
  const head = el('section', { class:'hero', style:'margin-bottom:14px' });
  const usedPct = totalBudget > 0 ? Math.min(100, Math.round((spentInBudget/totalBudget)*100)) : 0;
  head.innerHTML = `
    <div class="hero-row">
      <div>
        <div class="hero-label">${escapeHtml(monthName)} · ${escapeHtml(t('monthly_budget'))}</div>
        <div class="hero-balance balance">${moneyHTML(spentInBudget)} <span class="cur" style="opacity:.6">/ ${moneyHTML(totalBudget)}</span></div>
      </div>
    </div>
    <div class="progress ${usedPct>=100?'danger':usedPct>=80?'warning':'success'}" style="margin-top:14px"><div class="progress-fill" style="width:${usedPct}%"></div></div>
    <div class="hero-meta">
      <span class="pill"><span class="dot dot-info"></span>${escapeHtml(t('daily_allowance'))}: <strong>${moneyHTML(allowance)}</strong></span>
      ${incM > 0 ? `<span class="pill"><span class="dot dot-success"></span>50/30/20 · 50%: <strong>${moneyHTML(incM*0.5)}</strong></span>` : ''}
    </div>`;
  view.append(head);

  // Add budget button row
  const actions = el('div', { class:'row', style:'margin-bottom:12px;gap:8px' });
  const btnAdd = el('button', { class:'btn btn-primary' }, ['＋ ' + t('set_budget')]);
  btnAdd.onclick = () => openBudgetEditor();
  const btn503020 = el('button', { class:'btn' }, ['50/30/20']);
  btn503020.onclick = () => apply503020(incM);
  actions.append(btnAdd, btn503020);
  view.append(actions);

  // Per-category budget cards
  if (monthBuds.length === 0){
    const btn = el('button', { class:'btn btn-primary' }, [t('add_first')]);
    btn.onclick = () => openBudgetEditor();
    renderEmpty(view, '🎯', t('no_budget'), t('no_budget_desc'), btn);
    return;
  }

  const grid = el('div', { class:'grid grid-2' });
  monthBuds.forEach(b => {
    const c = Q.cat(b.category);
    const spent = Q.txInRange(monthR.start, monthR.end).filter(t=>t.type==='expense' && t.category===b.category).reduce((s,t)=>s+Number(t.amount||0),0);
    const pct = Math.min(100, Math.round((spent / Math.max(1, b.limit)) * 100));
    const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
    const r = 30, C = 2*Math.PI*r;
    const off = C - (pct/100)*C;
    const card = el('div', { class:'card', style:'cursor:pointer' });
    card.innerHTML = `
      <div class="row">
        <svg class="ring" width="76" height="76" viewBox="0 0 76 76">
          <circle class="ring-bg" cx="38" cy="38" r="${r}" fill="none" stroke-width="8"/>
          <circle class="ring-fg ${cls}" cx="38" cy="38" r="${r}" fill="none" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 38 38)"/>
          <text x="38" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${pct}%</text>
        </svg>
        <div style="min-width:0;flex:1">
          <div style="font-weight:700;font-size:15px">${c.emoji} ${escapeHtml(c.name)}</div>
          <div class="muted small">${moneyHTML(spent)} ${escapeHtml(t('of'))} ${moneyHTML(b.limit)}</div>
          <div class="small" style="margin-top:4px;color:${pct>=100?'var(--danger)':pct>=80?'var(--warning)':'var(--success)'};font-weight:600">${pct >= 100 ? t('over_budget') : Fmt.moneyShort(b.limit-spent) + ' qoldi'}</div>
        </div>
      </div>`;
    card.onclick = () => openBudgetEditor(b);
    grid.append(card);
  });
  view.append(grid);
});

function daysLeftInMonth(){
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate() - d.getDate() + 1;
}

function openBudgetEditor(existing){
  const expCats = State.categories('expense');
  const card = Modal.open(`
    <div class="modal-h">
      <div class="title">${escapeHtml(existing ? t('edit') : t('set_budget'))}</div>
      <button class="icon-btn" id="mb_close">✕</button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label class="field-label">${escapeHtml(t('category'))}</label>
        <select class="select" id="mb_cat" ${existing?'disabled':''}>
          ${expCats.map(c => `<option value="${c.id}" ${existing && existing.category === c.id ? 'selected' : ''}>${c.emoji} ${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">${escapeHtml(t('limit'))} (${escapeHtml(State.user().currency)})</label>
        <input class="input" type="number" inputmode="decimal" id="mb_limit" value="${existing?existing.limit:''}" step="0.01"/>
      </div>
    </div>
    <div class="modal-foot">
      ${existing ? `<button class="btn btn-danger" id="mb_del">${escapeHtml(t('delete'))}</button>` : ''}
      <span class="spacer"></span>
      <button class="btn" id="mb_cancel">${escapeHtml(t('cancel'))}</button>
      <button class="btn btn-primary" id="mb_save">${escapeHtml(t('save'))}</button>
    </div>
  `);
  card.querySelector('#mb_cancel').onclick = card.querySelector('#mb_close').onclick = () => Modal.close();
  if (existing){
    card.querySelector('#mb_del').onclick = () => { State.removeBudget(existing.id); Modal.close(); Router.render(); Toast.show(t('deleted')); };
  }
  card.querySelector('#mb_save').onclick = () => {
    const cat = card.querySelector('#mb_cat').value;
    const lim = parseFloat(card.querySelector('#mb_limit').value);
    if (!cat || !(lim > 0)){ Toast.show(t('enter_amount'), 'danger'); return; }
    State.setBudget(cat, lim);
    Toast.show(t('saved'), 'success'); Audio_.success(); Haptic.success();
    checkAchievements();
    Modal.close();
    Router.render();
  };
  setTimeout(()=> card.querySelector('#mb_limit').focus(), 100);
}

function apply503020(income){
  if (!(income > 0)){ Toast.show(t('no_data'), 'danger'); return; }
  const needs = ['c_food','c_home','c_util','c_transport','c_health','c_phone'];
  const wants = ['c_fun','c_cafe','c_shop','c_clothes','c_beauty'];
  const totalNeeds = income * 0.5; const totalWants = income * 0.3;
  needs.forEach(c => State.setBudget(c, Math.round(totalNeeds / needs.length / 1000) * 1000));
  wants.forEach(c => State.setBudget(c, Math.round(totalWants / wants.length / 1000) * 1000));
  Toast.show('50/30/20 ' + t('saved'), 'success'); Audio_.success(); Confetti?.fire?.({ count: 40 });
  Router.render();
}

/* =========================================================
   GOALS
   ========================================================= */
Router.register('/goals', (view) => {
  const goals = State.goals();
  const head = el('div', { class:'row row-between', style:'margin-bottom:12px' });
  head.innerHTML = `<h2 class="h-display" style="font-size:24px">${escapeHtml(t('goals'))}</h2>`;
  const btn = el('button', { class:'btn btn-primary' }, ['＋ ' + t('add_goal')]);
  btn.onclick = () => openGoalEditor();
  head.append(btn);
  view.append(head);

  if (goals.length === 0){
    const b = el('button', { class:'btn btn-primary' }, [t('add_first')]);
    b.onclick = () => openGoalEditor();
    renderEmpty(view, '💎', t('no_goals'), t('no_goals_desc'), b);
    return;
  }

  const grid = el('div', { class:'grid grid-2' });
  goals.forEach(g => {
    const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
    const left = Math.max(0, g.target - g.current);
    const daysLeft = g.deadline ? Math.max(0, Math.round((new Date(g.deadline) - new Date()) / 86400000)) : null;
    const perDay = (daysLeft && daysLeft > 0) ? left / daysLeft : null;
    const card = el('div', { class:'goal', style:`--g1:${g.color || 'var(--accent)'}` });
    card.innerHTML = `
      <div class="row">
        <span class="goal-emoji">${g.icon || '🎯'}</span>
        <div style="min-width:0;flex:1">
          <div class="goal-title">${escapeHtml(g.name)}</div>
          <div class="goal-meta">${g.deadline ? Fmt.date(g.deadline) : ''}${daysLeft != null ? ' · ' + daysLeft + ' ' + t('days') : ''}</div>
        </div>
      </div>
      <div class="goal-amt amount" style="margin:10px 0 4px">${moneyHTML(g.current)} <span style="opacity:.5;font-family:var(--font-ui);font-size:14px">/ ${moneyHTML(g.target)}</span></div>
      <div class="progress ${pct>=100?'success':''}"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">
        <span class="chip ${pct>=100?'chip-success':''}">${pct}%</span>
        ${perDay != null ? `<span class="chip">${Fmt.moneyShort(perDay)}/${escapeHtml(t('today_').toLowerCase())}</span>` : ''}
        <span class="spacer"></span>
        <button class="btn btn-sm" data-add>＋ ${escapeHtml(t('add_money'))}</button>
        <button class="btn btn-sm btn-ghost" data-edit>${escapeHtml(t('edit'))}</button>
      </div>`;
    card.querySelector('[data-add]').onclick = (e) => { e.stopPropagation(); openGoalAddMoney(g); };
    card.querySelector('[data-edit]').onclick = (e) => { e.stopPropagation(); openGoalEditor(g); };
    grid.append(card);
  });
  view.append(grid);
});

function openGoalEditor(existing){
  const card = Modal.open(`
    <div class="modal-h">
      <div class="title">${escapeHtml(existing ? t('edit') : t('new_goal'))}</div>
      <button class="icon-btn" id="g_close">✕</button>
    </div>
    <div class="modal-body">
      <div class="field"><label class="field-label">${escapeHtml(t('select_emoji'))}</label>
        <div class="cat-grid" id="g_emos">
          ${GOAL_ICONS.map(em => `<button class="cat-tile ${(existing?.icon||'🎯')===em?'is-active':''}" data-em="${em}"><span class="e">${em}</span></button>`).join('')}
        </div>
      </div>
      <div class="field"><label class="field-label">${escapeHtml(t('goal_name'))}</label><input class="input" id="g_name" value="${escapeHtml(existing?.name||'')}"/></div>
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(t('target'))}</label><input class="input" type="number" inputmode="decimal" id="g_target" value="${existing?.target||''}"/></div>
        <div class="field"><label class="field-label">${escapeHtml(t('current'))}</label><input class="input" type="number" inputmode="decimal" id="g_current" value="${existing?.current||0}"/></div>
      </div>
      <div class="field"><label class="field-label">${escapeHtml(t('deadline'))}</label><input class="input" type="date" id="g_deadline" value="${existing?.deadline||''}"/></div>
    </div>
    <div class="modal-foot">
      ${existing ? `<button class="btn btn-danger" id="g_del">${escapeHtml(t('delete'))}</button>` : ''}
      <span class="spacer"></span>
      <button class="btn" id="g_cancel">${escapeHtml(t('cancel'))}</button>
      <button class="btn btn-primary" id="g_save">${escapeHtml(t('save'))}</button>
    </div>
  `);
  let emo = existing?.icon || '🎯';
  card.querySelectorAll('#g_emos .cat-tile').forEach(b => b.onclick = () => {
    emo = b.dataset.em;
    card.querySelectorAll('#g_emos .cat-tile').forEach(x => x.classList.toggle('is-active', x === b));
  });
  card.querySelector('#g_cancel').onclick = card.querySelector('#g_close').onclick = () => Modal.close();
  if (existing) card.querySelector('#g_del').onclick = () => { State.removeGoal(existing.id); Toast.show(t('deleted')); Modal.close(); Router.render(); };
  card.querySelector('#g_save').onclick = () => {
    const data = {
      name: card.querySelector('#g_name').value || 'Goal',
      target: parseFloat(card.querySelector('#g_target').value) || 0,
      current: parseFloat(card.querySelector('#g_current').value) || 0,
      deadline: card.querySelector('#g_deadline').value || null,
      icon: emo, color: '#7c3aed',
    };
    if (data.target <= 0){ Toast.show(t('enter_amount'),'danger'); return; }
    if (existing) State.updateGoal(existing.id, data);
    else State.addGoal(data);
    Toast.show(t('saved'),'success'); Audio_.success();
    checkAchievements();
    Modal.close(); Router.render();
  };
}

function openGoalAddMoney(goal){
  const card = Modal.open(`
    <div class="modal-h"><div class="title">${escapeHtml(t('add_money'))} · ${escapeHtml(goal.name)}</div><button class="icon-btn" id="ga_close">✕</button></div>
    <div class="modal-body">
      <div class="field"><label class="field-label">${escapeHtml(t('amount'))}</label><input class="input" type="number" inputmode="decimal" id="ga_amt" autofocus/></div>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" id="ga_cancel">${escapeHtml(t('cancel'))}</button><button class="btn btn-primary" id="ga_save">${escapeHtml(t('save'))}</button></div>
  `);
  card.querySelector('#ga_cancel').onclick = card.querySelector('#ga_close').onclick = () => Modal.close();
  card.querySelector('#ga_save').onclick = () => {
    const amt = parseFloat(card.querySelector('#ga_amt').value) || 0;
    if (amt <= 0){ Toast.show(t('enter_amount'),'danger'); return; }
    const newCur = goal.current + amt;
    const reached = newCur >= goal.target;
    State.updateGoal(goal.id, { current: newCur, achieved: reached || goal.achieved });
    Modal.close();
    if (reached){
      Confetti?.fire?.({ count: 140 }); Audio_.success(); Haptic.success();
      Toast.show('🎉 ' + t('confetti_msg'), 'success');
    } else {
      Toast.show(t('saved'),'success'); Audio_.success();
    }
    checkAchievements();
    Router.render();
  };
  setTimeout(()=> card.querySelector('#ga_amt').focus(), 100);
}

/* =========================================================
   ACCOUNTS — Apple Wallet style
   ========================================================= */
Router.register('/accounts', (view) => {
  const accs = State.accounts(true);
  const total = Q.totalBalance();

  const head = el('section', { class:'hero', style:'margin-bottom:14px' });
  head.innerHTML = `
    <div class="hero-row">
      <div>
        <div class="hero-label">${escapeHtml(t('total_balance'))}</div>
        <div class="hero-balance balance">${moneyHTML(total)}</div>
      </div>
    </div>`;
  view.append(head);

  const actions = el('div', { class:'row', style:'margin-bottom:12px;gap:8px' });
  const btn = el('button', { class:'btn btn-primary' }, ['＋ ' + t('add_account')]);
  btn.onclick = () => openAccountEditor();
  const xfer = el('button', { class:'btn' }, ['↔ ' + t('transfer')]);
  xfer.onclick = () => openTransferModal();
  actions.append(btn, xfer);
  view.append(actions);

  if (accs.length === 0){
    const b = el('button', { class:'btn btn-primary' }, [t('add_first')]);
    b.onclick = () => openAccountEditor();
    renderEmpty(view, '💳', t('no_acc'), '...', b);
    return;
  }

  const stack = el('div', { class:'wallet' });
  accs.forEach(a => {
    const tinfo = ACCOUNT_TYPES.find(x => x.id === a.type) || ACCOUNT_TYPES[0];
    const card = el('div', { class: `wallet-card ${a.cls || tinfo.cls}` + (a.archived ? ' is-archived' : '') });
    card.innerHTML = `
      <div class="row">
        <div style="font-size:22px">${tinfo.emoji}</div>
        <div style="flex:1">
          <div class="wallet-name">${escapeHtml(a.name)}</div>
          <div class="wallet-type">${escapeHtml(tinfo.name)} · ${escapeHtml(a.currency || State.user().currency)}</div>
        </div>
      </div>
      <div class="wallet-bal balance">${moneyHTML(a.balance, a.currency)}</div>
      <div class="wallet-foot">
        <span>${a.archived ? '📦 ' + escapeHtml(t('archived')) : '●●●● ' + (a.id || '').slice(-4)}</span>
      </div>`;
    card.onclick = () => openAccountEditor(a);
    stack.append(card);
  });
  view.append(stack);
});

function openAccountEditor(existing){
  const card = Modal.open(`
    <div class="modal-h"><div class="title">${escapeHtml(existing ? t('edit') : t('new_account'))}</div><button class="icon-btn" id="ae_close">✕</button></div>
    <div class="modal-body">
      <div class="field"><label class="field-label">${escapeHtml(t('type'))}</label>
        <div class="cat-grid" id="ae_types">
          ${ACCOUNT_TYPES.map(at => `<button class="cat-tile ${(existing?.type||'cash')===at.id?'is-active':''}" data-id="${at.id}" data-cls="${at.cls}"><span class="e">${at.emoji}</span><span class="n">${escapeHtml(at.name)}</span></button>`).join('')}
        </div>
      </div>
      <div class="field"><label class="field-label">${escapeHtml(t('acc_name'))}</label><input class="input" id="ae_name" value="${escapeHtml(existing?.name||'')}"/></div>
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(existing ? t('current') : t('start_balance'))}</label><input class="input" type="number" inputmode="decimal" id="ae_bal" value="${existing?.balance ?? 0}" step="0.01"/></div>
        <div class="field"><label class="field-label">${escapeHtml(t('select_currency'))}</label><select class="select" id="ae_cur">${SUPPORTED_CURRENCIES.map(c => `<option value="${c}" ${(existing?.currency||State.user().currency)===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      ${existing ? `<button class="btn ${existing.archived?'btn-success':''}" id="ae_arc">${escapeHtml(existing.archived ? 'Unarchive' : t('archive'))}</button>` : ''}
    </div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" id="ae_cancel">${escapeHtml(t('cancel'))}</button><button class="btn btn-primary" id="ae_save">${escapeHtml(t('save'))}</button></div>
  `);
  let typeId = existing?.type || 'cash';
  let typeCls = existing?.cls || 'c-cash';
  card.querySelectorAll('#ae_types .cat-tile').forEach(b => b.onclick = () => {
    typeId = b.dataset.id; typeCls = b.dataset.cls;
    card.querySelectorAll('#ae_types .cat-tile').forEach(x => x.classList.toggle('is-active', x === b));
  });
  card.querySelector('#ae_cancel').onclick = card.querySelector('#ae_close').onclick = () => Modal.close();
  if (existing) card.querySelector('#ae_arc').onclick = () => { State.updateAccount(existing.id, { archived: !existing.archived }); Modal.close(); Router.render(); };
  card.querySelector('#ae_save').onclick = () => {
    const name = card.querySelector('#ae_name').value;
    const bal  = parseFloat(card.querySelector('#ae_bal').value) || 0;
    const cur  = card.querySelector('#ae_cur').value;
    if (!name){ Toast.show('Name?', 'danger'); return; }
    if (existing) State.updateAccount(existing.id, { name, balance: bal, currency: cur, type: typeId, cls: typeCls });
    else State.addAccount({ name, balance: bal, currency: cur, type: typeId, cls: typeCls });
    Toast.show(t('saved'),'success'); Audio_.success(); checkAchievements(); Modal.close(); Router.render();
  };
}

function openTransferModal(){
  const accs = State.accounts();
  if (accs.length < 2){ Toast.show('Need 2 accounts','danger'); return; }
  const card = Modal.open(`
    <div class="modal-h"><div class="title">${escapeHtml(t('transfer'))}</div><button class="icon-btn" id="tr_close">✕</button></div>
    <div class="modal-body">
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(t('transfer_from'))}</label><select class="select" id="tr_from">${accs.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">${escapeHtml(t('transfer_to'))}</label><select class="select" id="tr_to">${accs.map((a,i)=>`<option value="${a.id}" ${i===1?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label class="field-label">${escapeHtml(t('amount'))}</label><input class="input" type="number" inputmode="decimal" id="tr_amt" autofocus/></div>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" id="tr_cancel">${escapeHtml(t('cancel'))}</button><button class="btn btn-primary" id="tr_save">${escapeHtml(t('save'))}</button></div>
  `);
  card.querySelector('#tr_cancel').onclick = card.querySelector('#tr_close').onclick = () => Modal.close();
  card.querySelector('#tr_save').onclick = () => {
    const from = card.querySelector('#tr_from').value;
    const to   = card.querySelector('#tr_to').value;
    const amt  = parseFloat(card.querySelector('#tr_amt').value) || 0;
    if (amt <= 0){ Toast.show(t('enter_amount'),'danger'); return; }
    if (from === to){ Toast.show('From ≠ To','danger'); return; }
    State.addTx({ type:'transfer', amount: amt, account: from, toAccount: to, date: Fmt.iso(new Date()), category:null, currency: State.user().currency });
    Toast.show(t('transfer_done'),'success'); Audio_.success(); Haptic.success();
    Modal.close(); Router.render();
  };
}

/* =========================================================
   REPORTS / ANALYTICS
   ========================================================= */
Router.register('/reports', (view) => {
  // Period selector
  let period = 30;
  const seg = el('div', { class:'seg', style:'max-width:360px;margin-bottom:14px' });
  seg.innerHTML = `<button data-p="7">${escapeHtml(t('last_7'))}</button><button data-p="30" class="is-active">${escapeHtml(t('last_30'))}</button><button data-p="90">${escapeHtml(t('last_90'))}</button>`;
  view.append(seg);

  const summary = el('div', { class:'tiles', style:'margin-bottom:14px' });
  view.append(summary);

  // Charts
  const c1 = el('div', { class:'card', style:'margin-bottom:14px' });
  c1.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('income_vs_expense'))}</h3></div><canvas id="ch_ie" height="120"></canvas>`;
  view.append(c1);

  const c2 = el('div', { class:'card', style:'margin-bottom:14px' });
  c2.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('by_category'))}</h3></div><canvas id="ch_cat" height="160"></canvas>`;
  view.append(c2);

  const c3 = el('div', { class:'card', style:'margin-bottom:14px' });
  c3.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('monthly_trend'))}</h3></div><canvas id="ch_mt" height="120"></canvas>`;
  view.append(c3);

  const tcard = el('div', { class:'card' });
  tcard.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('top_categories'))}</h3></div><div id="rep_top" class="stack"></div>`;
  view.append(tcard);

  function render(){
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', Number(b.dataset.p) === period));

    const today = new Date(); today.setHours(0,0,0,0);
    const startDate = new Date(today); startDate.setDate(today.getDate() - (period-1));
    const txs = Q.txInRange(startDate, new Date(today.getTime() + 86399999));

    const inc = Q.sum(txs, 'income');
    const exp = Q.sum(txs, 'expense');
    const net = inc - exp;
    const rate = inc > 0 ? Math.round(((inc - exp)/inc)*100) : 0;
    const avgDaily = exp / period;

    summary.innerHTML = `
      <div class="tile"><span class="tile-label">${escapeHtml(t('income'))}</span><span class="tile-value amount" style="color:var(--success)">${moneyHTML(inc)}</span></div>
      <div class="tile"><span class="tile-label">${escapeHtml(t('expense'))}</span><span class="tile-value amount" style="color:var(--danger)">${moneyHTML(exp)}</span></div>
      <div class="tile"><span class="tile-label">${escapeHtml(t('avg_daily'))}</span><span class="tile-value amount">${moneyHTML(avgDaily)}</span></div>
      <div class="tile"><span class="tile-label">${escapeHtml(t('savings_rate'))}</span><span class="tile-value">${rate}%</span></div>`;

    if (typeof Chart === 'undefined'){ return; }

    // Per-day income vs expense
    const labels = []; const incArr = []; const expArr = [];
    for (let i = period - 1; i >= 0; i--){
      const d = new Date(today); d.setDate(today.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate()+1);
      const list = Q.txInRange(d, new Date(next.getTime()-1));
      labels.push(d.toLocaleDateString(undefined, { month:'short', day:'2-digit' }));
      incArr.push(Q.sum(list,'income'));
      expArr.push(Q.sum(list,'expense'));
    }
    const ieCtx = view.querySelector('#ch_ie');
    if (ieCtx._chart) ieCtx._chart.destroy();
    ieCtx._chart = new Chart(ieCtx, {
      type:'line',
      data:{ labels, datasets:[
        { label:t('income'),  data: incArr, borderColor:'#10a35b', backgroundColor:'rgba(16,163,91,0.08)', tension:0.35, fill:true, pointRadius:0, borderWidth:2 },
        { label:t('expense'), data: expArr, borderColor:'#e11d48', backgroundColor:'rgba(225,29,72,0.08)', tension:0.35, fill:true, pointRadius:0, borderWidth:2 },
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:8, color:getCss('--text-2') } } }, scales:{ x:{ ticks:{ color:getCss('--text-2'), maxTicksLimit:7 }, grid:{ display:false } }, y:{ ticks:{ color:getCss('--text-2'), callback:(v)=>Fmt.moneyShort(v) }, grid:{ color:getCss('--hairline') } } } }
    });

    // Donut by category (expenses only)
    const map = new Map();
    for (const t of txs){ if (t.type !== 'expense') continue; map.set(t.category, (map.get(t.category)||0) + Number(t.amount||0)); }
    const top = [...map.entries()].sort((a,b)=>b[1]-a[1]);
    const catCtx = view.querySelector('#ch_cat');
    if (catCtx._chart) catCtx._chart.destroy();
    catCtx._chart = new Chart(catCtx, {
      type:'doughnut',
      data:{ labels: top.map(([id])=>Q.cat(id).name), datasets:[{ data: top.map(([,v])=>v), backgroundColor: top.map(([id])=>Q.cat(id).color), borderWidth:0 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:8, color:getCss('--text-2') } } } }
    });

    // Monthly trend (12 months)
    const mLabels = []; const mInc = []; const mExp = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--){
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const r = Q.monthRange(d);
      const list = Q.txInRange(r.start, r.end);
      mLabels.push(d.toLocaleDateString(undefined, { month:'short' }));
      mInc.push(Q.sum(list,'income'));
      mExp.push(Q.sum(list,'expense'));
    }
    const mtCtx = view.querySelector('#ch_mt');
    if (mtCtx._chart) mtCtx._chart.destroy();
    mtCtx._chart = new Chart(mtCtx, {
      type:'bar',
      data:{ labels: mLabels, datasets:[
        { label:t('income'),  data:mInc, backgroundColor:'#10a35b', borderRadius:6 },
        { label:t('expense'), data:mExp, backgroundColor:'#e11d48', borderRadius:6 },
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:8, color:getCss('--text-2') } } }, scales:{ x:{ ticks:{ color:getCss('--text-2') }, grid:{ display:false } }, y:{ ticks:{ color:getCss('--text-2'), callback:(v)=>Fmt.moneyShort(v) }, grid:{ color:getCss('--hairline') } } } }
    });

    // Top categories list
    const totalExp = top.reduce((s, [,v]) => s + v, 0);
    const tBox = view.querySelector('#rep_top');
    tBox.innerHTML = top.length === 0 ? '' : top.slice(0, 8).map(([id, v]) => {
      const c = Q.cat(id); const pct = Math.round((v/Math.max(1,totalExp))*100);
      return `<div>
        <div class="row" style="margin-bottom:6px">
          <span style="font-size:18px">${c.emoji}</span>
          <span style="flex:1;font-weight:600">${escapeHtml(c.name)}</span>
          <span class="muted small">${pct}%</span>
          <span class="amount" style="font-weight:700">${moneyHTML(v)}</span>
        </div>
        <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${c.color}"></div></div>
      </div>`;
    }).join('');
    if (top.length === 0) renderEmpty(tBox, '🥧', t('no_data'), t('add_some_tx'));
  }

  seg.querySelectorAll('button').forEach(b => b.onclick = () => { period = Number(b.dataset.p); render(); });

  // Wait for Chart.js if needed
  if (typeof Chart === 'undefined'){
    const interval = setInterval(() => { if (typeof Chart !== 'undefined'){ clearInterval(interval); render(); } }, 50);
    setTimeout(()=>clearInterval(interval), 5000);
  }
  render();
});

function getCss(varName){
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/* =========================================================
   CATEGORIES
   ========================================================= */
Router.register('/categories', (view) => {
  const all = State.categories();
  const groups = { expense: all.filter(c=>c.type==='expense'), income: all.filter(c=>c.type==='income') };

  const head = el('div', { class:'row row-between', style:'margin-bottom:12px' });
  head.innerHTML = `<h2 class="h-display" style="font-size:24px">${escapeHtml(t('categories'))}</h2>`;
  const btn = el('button', { class:'btn btn-primary' }, ['＋ ' + t('add_category')]);
  btn.onclick = () => openCategoryEditor();
  head.append(btn);
  view.append(head);

  ['expense','income'].forEach(kind => {
    const card = el('div', { class:'card', style:'margin-bottom:14px' });
    card.innerHTML = `<div class="card-h"><h3>${escapeHtml(kind === 'expense' ? t('expense') : t('income'))}</h3></div><div class="cat-grid" id="cs_${kind}"></div>`;
    view.append(card);
    const box = card.querySelector(`#cs_${kind}`);
    groups[kind].forEach(c => {
      const tile = el('button', { class:'cat-tile' });
      tile.innerHTML = `<span class="e" style="background:${c.color}1a;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;font-size:22px">${c.emoji}</span><span class="n">${escapeHtml(c.name)}</span>`;
      tile.onclick = () => openCategoryEditor(c);
      box.append(tile);
    });
  });
});

function openCategoryEditor(existing){
  const card = Modal.open(`
    <div class="modal-h"><div class="title">${escapeHtml(existing ? t('edit') : t('new_category'))}</div><button class="icon-btn" id="cc_close">✕</button></div>
    <div class="modal-body">
      <div class="field"><label class="field-label">${escapeHtml(t('select_emoji'))}</label><input class="input" id="cc_em" maxlength="3" value="${escapeHtml(existing?.emoji||'🏷️')}"/></div>
      <div class="field"><label class="field-label">${escapeHtml(t('name'))}</label><input class="input" id="cc_name" value="${escapeHtml(existing?.name||'')}"/></div>
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(t('color'))}</label><input class="input" type="color" id="cc_color" value="${escapeHtml(existing?.color || '#7c3aed')}"/></div>
        <div class="field"><label class="field-label">${escapeHtml(t('type'))}</label><select class="select" id="cc_type"><option value="expense" ${existing?.type==='expense'?'selected':''}>${escapeHtml(t('expense'))}</option><option value="income" ${existing?.type==='income'?'selected':''}>${escapeHtml(t('income'))}</option></select></div>
      </div>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" id="cc_cancel">${escapeHtml(t('cancel'))}</button><button class="btn btn-primary" id="cc_save">${escapeHtml(t('save'))}</button></div>
  `);
  card.querySelector('#cc_cancel').onclick = card.querySelector('#cc_close').onclick = () => Modal.close();
  card.querySelector('#cc_save').onclick = () => {
    const data = {
      emoji: card.querySelector('#cc_em').value || '🏷️',
      name:  card.querySelector('#cc_name').value || '...',
      color: card.querySelector('#cc_color').value,
      type:  card.querySelector('#cc_type').value,
    };
    if (existing){
      const c = State.raw().categories.find(x => x.id === existing.id);
      if (c) Object.assign(c, data);
      State.save();
    } else {
      State.addCategory(data);
    }
    Toast.show(t('saved'),'success'); Audio_.success();
    Modal.close(); Router.render();
  };
}

/* =========================================================
   RECURRING
   ========================================================= */
Router.register('/recurring', (view) => {
  const list = State.recurring();
  const head = el('div', { class:'row row-between', style:'margin-bottom:12px' });
  head.innerHTML = `<h2 class="h-display" style="font-size:24px">${escapeHtml(t('recurring'))}</h2>`;
  const btn = el('button', { class:'btn btn-primary' }, ['＋ ' + t('add_recurring')]);
  btn.onclick = () => openRecurringEditor();
  head.append(btn);
  view.append(head);

  if (list.length === 0){
    const b = el('button', { class:'btn btn-primary' }, [t('add_first')]);
    b.onclick = () => openRecurringEditor();
    renderEmpty(view, '🔁', t('no_recurring'), t('no_recurring_desc'), b);
    return;
  }
  const monthlyTotal = list.filter(r => r.enabled).reduce((s, r) => {
    const factor = ({ daily:30, weekly:4.33, biweekly:2.17, monthly:1, yearly:1/12 })[r.frequency] || 0;
    return s + Number(r.amount||0) * factor;
  }, 0);
  const summary = el('div', { class:'card', style:'margin-bottom:12px' });
  summary.innerHTML = `<div class="row"><div class="label">${escapeHtml(t('monthly_budget'))} (${escapeHtml(t('total'))})</div><span class="spacer"></span><strong class="amount" style="font-size:18px">${moneyHTML(monthlyTotal)}</strong></div>`;
  view.append(summary);

  const stack = el('div', { class:'stack' });
  list.forEach(r => {
    const c = Q.cat(r.category);
    const days = r.nextDate ? Math.max(0, Math.ceil((new Date(r.nextDate) - new Date())/86400000)) : 0;
    const item = el('div', { class:'card' });
    item.innerHTML = `
      <div class="row">
        <div class="tx-icon" style="--cat-soft:${c.color}22">${c.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700">${escapeHtml(r.name)}</div>
          <div class="muted small">${escapeHtml(({daily:t('daily'),weekly:t('weekly'),biweekly:t('biweekly'),monthly:t('monthly'),yearly:t('yearly')})[r.frequency])} · ${escapeHtml(t('next_payment'))}: ${days} ${escapeHtml(t('days'))}</div>
        </div>
        <div style="text-align:right">
          <div class="amount expense" style="font-weight:700">${moneyHTML(r.amount)}</div>
          <div class="muted small">${moneyHTML(r.amount * 12)}/${escapeHtml(t('this_year').toLowerCase())}</div>
        </div>
      </div>
      <div class="row" style="gap:8px;margin-top:8px">
        <button class="chip ${r.enabled?'chip-success':''}" data-toggle>${r.enabled ? t('enabled') : t('disabled')}</button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-edit>${escapeHtml(t('edit'))}</button>
        <button class="btn btn-sm btn-danger" data-del>${escapeHtml(t('delete'))}</button>
      </div>`;
    item.querySelector('[data-toggle]').onclick = () => { State.updateRecurring(r.id, { enabled: !r.enabled }); Router.render(); };
    item.querySelector('[data-edit]').onclick   = () => openRecurringEditor(r);
    item.querySelector('[data-del]').onclick    = () => { State.removeRecurring(r.id); Toast.show(t('deleted')); Router.render(); };
    stack.append(item);
  });
  view.append(stack);
});

function openRecurringEditor(existing){
  const accs = State.accounts();
  const cats = State.categories('expense');
  const card = Modal.open(`
    <div class="modal-h"><div class="title">${escapeHtml(existing ? t('edit') : t('new_recurring'))}</div><button class="icon-btn" id="r_close">✕</button></div>
    <div class="modal-body">
      <div class="field"><label class="field-label">${escapeHtml(t('name'))}</label><input class="input" id="r_name" value="${escapeHtml(existing?.name||'')}"/></div>
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(t('amount'))}</label><input class="input" type="number" inputmode="decimal" id="r_amt" value="${existing?.amount||''}"/></div>
        <div class="field"><label class="field-label">${escapeHtml(t('frequency'))}</label><select class="select" id="r_freq">
          ${['daily','weekly','biweekly','monthly','yearly'].map(f => `<option value="${f}" ${existing?.frequency===f?'selected':''}>${escapeHtml(t(f))}</option>`).join('')}
        </select></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label class="field-label">${escapeHtml(t('category'))}</label><select class="select" id="r_cat">${cats.map(c=>`<option value="${c.id}" ${existing?.category===c.id?'selected':''}>${c.emoji} ${escapeHtml(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">${escapeHtml(t('account'))}</label><select class="select" id="r_acc">${accs.map(a=>`<option value="${a.id}" ${existing?.account===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label class="field-label">${escapeHtml(t('next_payment'))}</label><input class="input" type="date" id="r_next" value="${existing?.nextDate || Fmt.iso(new Date())}"/></div>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" id="r_cancel">${escapeHtml(t('cancel'))}</button><button class="btn btn-primary" id="r_save">${escapeHtml(t('save'))}</button></div>
  `);
  card.querySelector('#r_cancel').onclick = card.querySelector('#r_close').onclick = () => Modal.close();
  card.querySelector('#r_save').onclick = () => {
    const data = {
      name: card.querySelector('#r_name').value || 'Subscription',
      amount: parseFloat(card.querySelector('#r_amt').value) || 0,
      frequency: card.querySelector('#r_freq').value,
      category: card.querySelector('#r_cat').value,
      account: card.querySelector('#r_acc').value,
      nextDate: card.querySelector('#r_next').value,
    };
    if (data.amount <= 0){ Toast.show(t('enter_amount'),'danger'); return; }
    if (existing) State.updateRecurring(existing.id, data);
    else State.addRecurring(data);
    Toast.show(t('saved'),'success'); Audio_.success(); checkAchievements(); Modal.close(); Router.render();
  };
}

/* =========================================================
   NET WORTH
   ========================================================= */
Router.register('/networth', (view) => {
  const accs = State.accounts();
  const assets = accs.filter(a => Number(a.balance) >= 0).reduce((s,a)=>s+Number(a.balance||0),0);
  const debts  = accs.filter(a => Number(a.balance) < 0).reduce((s,a)=>s+Math.abs(Number(a.balance||0)),0);
  const net = assets - debts;

  const head = el('section', { class:'hero', style:'margin-bottom:14px' });
  head.innerHTML = `
    <div class="hero-row"><div>
      <div class="hero-label">${escapeHtml(t('net_worth'))}</div>
      <div class="hero-balance balance net">${moneyHTML(net)}</div>
    </div></div>
    <div class="hero-meta">
      <span class="pill"><span class="dot dot-success"></span>Aktivlar: <strong>${moneyHTML(assets)}</strong></span>
      <span class="pill"><span class="dot dot-danger"></span>Qarzlar: <strong>${moneyHTML(debts)}</strong></span>
    </div>`;
  view.append(head);

  // Per account breakdown
  const card = el('div', { class:'card', style:'margin-bottom:14px' });
  card.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('overview'))}</h3></div>`;
  accs.forEach(a => {
    const at = ACCOUNT_TYPES.find(x=>x.id===a.type) || ACCOUNT_TYPES[0];
    const pct = assets > 0 ? Math.round((Number(a.balance)/assets)*100) : 0;
    const row = el('div', { style:'padding:10px 0;border-bottom:1px solid var(--hairline)' });
    row.innerHTML = `
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:18px">${at.emoji}</span>
        <span style="font-weight:600;flex:1">${escapeHtml(a.name)}</span>
        <span class="amount" style="font-weight:700">${moneyHTML(a.balance, a.currency)}</span>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${Math.max(0,pct)}%"></div></div>`;
    card.append(row);
  });
  view.append(card);

  // 12-month chart
  const ch = el('div', { class:'card' });
  ch.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('monthly_trend'))}</h3></div><canvas id="ch_nw" height="120"></canvas>`;
  view.append(ch);
  if (typeof Chart !== 'undefined'){
    const labels = []; const data = [];
    const now = new Date();
    let running = net;
    // compute approximate monthly net by reversing flows from now
    for (let i = 0; i < 12; i++){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      labels.unshift(d.toLocaleDateString(undefined,{month:'short'}));
      data.unshift(running);
      const r = Q.monthRange(d);
      const list = Q.txInRange(r.start, r.end);
      const flow = Q.sum(list,'income') - Q.sum(list,'expense');
      running -= flow;
    }
    new Chart(view.querySelector('#ch_nw'), {
      type:'line',
      data:{ labels, datasets:[{ label:t('net_worth'), data, borderColor:getCss('--accent') || '#0a0a0a', backgroundColor:'rgba(124,58,237,0.08)', fill:true, tension:0.35, pointRadius:0, borderWidth:2 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:getCss('--text-2') }, grid:{ display:false } }, y:{ ticks:{ color:getCss('--text-2'), callback:(v)=>Fmt.moneyShort(v) }, grid:{ color:getCss('--hairline') } } } }
    });
  }
});

/* =========================================================
   INSIGHTS
   ========================================================= */
Router.register('/insights', (view) => {
  const insights = computeInsights();

  // Insights section
  if (insights.length === 0){
    renderEmpty(view, '✨', t('no_insights'), t('no_insights_desc'));
  } else {
    const stack = el('div', { class:'stack', style:'margin-bottom:18px' });
    insights.forEach(ins => {
      const c = el('div', { class:'insight' });
      c.innerHTML = `<span class="insight-emoji">${ins.emoji}</span><div><div class="label" style="margin-bottom:2px">${escapeHtml(ins.title || t('insight_of_day'))}</div><div style="font-size:14px;font-weight:600">${escapeHtml(ins.text)}</div></div>`;
      stack.append(c);
    });
    view.append(stack);
  }

  // Achievements section
  const unlocked = new Set((State.achievements() || []).map(a => a.id));
  const card = el('div', { class:'card' });
  card.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('achievements'))}</h3><span class="muted small">${unlocked.size}/${ACHIEVEMENTS.length}</span></div><div class="cat-grid" id="ins_ach"></div>`;
  view.append(card);
  const box = card.querySelector('#ins_ach');
  ACHIEVEMENTS.forEach(a => {
    const has = unlocked.has(a.id);
    const tile = el('div', { class:'cat-tile', style: has ? '' : 'opacity:.4;filter:grayscale(1)' , title: achName(a) });
    tile.innerHTML = `<span class="e" style="font-size:24px">${has ? a.emoji : '🔒'}</span><span class="n">${escapeHtml(achName(a))}</span>`;
    box.append(tile);
  });
});

function computeInsights(){
  const out = [];
  const txs = State.transactions();
  if (txs.length === 0) return out;
  const lang = State.lang();

  // Week vs last week
  const tw = Q.weekRange(); const lw = { start: new Date(tw.start), end: new Date(tw.end) };
  lw.start.setDate(lw.start.getDate()-7); lw.end.setDate(lw.end.getDate()-7);
  const twe = Q.sum(Q.txInRange(tw.start, tw.end),'expense');
  const lwe = Q.sum(Q.txInRange(lw.start, lw.end),'expense');
  if (lwe > 0){
    const d = Math.round(((twe - lwe)/lwe)*100);
    out.push({ emoji: d > 0 ? '⚠️' : '🌱', title: t('this_week'), text: lang === 'en' ? `${Math.abs(d)}% ${d>0?'more':'less'} than last week.` : (lang === 'ru' ? `На ${Math.abs(d)}% ${d>0?'больше':'меньше'}, чем неделей ранее.` : `O'tgan haftaga nisbatan ${Math.abs(d)}% ${d>0?'ko\'p':'kam'}.`) });
  }
  // Top category > 30%
  const m = Q.monthRange();
  const expL = Q.txInRange(m.start, m.end).filter(t=>t.type==='expense');
  const totE = expL.reduce((s,t)=>s+Number(t.amount||0),0);
  if (totE > 0){
    const map = new Map(); for (const t of expL) map.set(t.category, (map.get(t.category)||0)+Number(t.amount||0));
    const top = [...map.entries()].sort((a,b)=>b[1]-a[1])[0];
    if (top){
      const pct = Math.round((top[1]/totE)*100);
      if (pct >= 30){
        const c = Q.cat(top[0]);
        out.push({ emoji: c.emoji, title: t('top_categories'), text: `${c.name} — ${pct}% ${lang==='en'?'of expenses':lang==='ru'?'расходов':'xarajatlar'}.` });
      }
    }
  }
  // Savings rate
  const inc = Q.sum(Q.txInRange(m.start, m.end),'income');
  const exp = Q.sum(Q.txInRange(m.start, m.end),'expense');
  if (inc > 0){
    const r = Math.round(((inc-exp)/inc)*100);
    out.push({ emoji: r >= 20 ? '💎' : '💸', title: t('savings_rate'), text: r >= 0 ? `${r}%` : `${r}% (${lang==='en'?'overspending':'превышение'})` });
  }
  // Subscription cost
  const recList = State.recurring().filter(r=>r.enabled);
  if (recList.length){
    const monthly = recList.reduce((s,r)=>s+Number(r.amount||0)*({ daily:30, weekly:4.33, biweekly:2.17, monthly:1, yearly:1/12 })[r.frequency], 0);
    out.push({ emoji:'🔁', title: t('recurring'), text: `${Fmt.moneyShort(monthly)} / ${lang==='en'?'month':'oy'} · ${Fmt.moneyShort(monthly*12)} / ${lang==='en'?'year':'yil'}` });
  }
  // Goals forecast
  State.goals().slice(0, 2).forEach(g => {
    if (g.deadline && g.target > g.current){
      const days = Math.max(1, Math.round((new Date(g.deadline)-new Date())/86400000));
      const perDay = (g.target - g.current)/days;
      out.push({ emoji: g.icon || '🎯', title: g.name, text: `${Fmt.moneyShort(perDay)}/${lang==='en'?'day':'kun'} ${lang==='en'?'to reach by':'·'} ${Fmt.date(g.deadline)}` });
    }
  });
  return out;
}

/* =========================================================
   MINI APPS
   ========================================================= */
Router.register('/mini', (view) => {
  const items = [
    ['loan',     '🧮', t('loan_calc')],
    ['interest', '💰', t('interest_calc')],
    ['fx',       '💱', t('fx_calc')],
    ['mortgage', '🏠', t('mortgage_calc')],
    ['tip',      '💵', t('tip_calc')],
    ['roi',      '📈', t('roi_calc')],
    ['split',    '🤝', t('bill_split')],
    ['inflation','📊', t('inflation_calc')],
    ['planner',  '🎯', t('goal_planner')],
  ];
  const grid = el('div', { class:'grid grid-2' });
  items.forEach(([id, em, label]) => {
    const c = el('button', { class:'card', style:'text-align:left;display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:18px' });
    c.innerHTML = `<span style="font-size:28px">${em}</span><span style="font-weight:700;font-size:14px">${escapeHtml(label)}</span>`;
    c.onclick = () => openMini(id);
    grid.append(c);
  });
  view.append(grid);
});

function openMini(kind){
  const u = State.user();
  let body = '', title = '';
  if (kind === 'loan'){
    title = t('loan_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Summa</label><input class="input" type="number" id="lc_p" value="100000000"/></div>
        <div class="field"><label class="field-label">Yillik %</label><input class="input" type="number" id="lc_r" value="24" step="0.1"/></div>
        <div class="field"><label class="field-label">Muddat (oy)</label><input class="input" type="number" id="lc_n" value="36"/></div>
      </div>
      <div class="card card-pad-lg" id="lc_out">—</div>`;
  } else if (kind === 'interest'){
    title = t('interest_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Boshlang'ich</label><input class="input" type="number" id="ic_p" value="1000000"/></div>
        <div class="field"><label class="field-label">Oylik qo'shish</label><input class="input" type="number" id="ic_pmt" value="500000"/></div>
        <div class="field"><label class="field-label">Yillik %</label><input class="input" type="number" id="ic_r" value="12" step="0.1"/></div>
        <div class="field"><label class="field-label">Yillar</label><input class="input" type="number" id="ic_y" value="5"/></div>
      </div>
      <div class="card card-pad-lg" id="ic_out">—</div>`;
  } else if (kind === 'fx'){
    title = t('fx_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">From</label><select class="select" id="fx_a">${SUPPORTED_CURRENCIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">To</label><select class="select" id="fx_b">${SUPPORTED_CURRENCIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Summa</label><input class="input" type="number" id="fx_v" value="100"/></div>
        <div class="field"><label class="field-label">Kurs</label><input class="input" type="number" id="fx_r" value="12500" step="0.01"/></div>
      </div>
      <div class="card card-pad-lg" id="fx_out">—</div>
      <p class="muted small">Kursni o'zingiz kiritasiz. Bu mini-ilova Internet talab qilmaydi.</p>`;
  } else if (kind === 'mortgage'){
    title = t('mortgage_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Uy narxi</label><input class="input" type="number" id="m_h" value="800000000"/></div>
        <div class="field"><label class="field-label">Boshlang'ich (%)</label><input class="input" type="number" id="m_d" value="20"/></div>
        <div class="field"><label class="field-label">Yillik %</label><input class="input" type="number" id="m_r" value="18" step="0.1"/></div>
        <div class="field"><label class="field-label">Muddat (yil)</label><input class="input" type="number" id="m_n" value="15"/></div>
      </div>
      <div class="card card-pad-lg" id="m_out">—</div>`;
  } else if (kind === 'tip'){
    title = t('tip_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Hisob summasi</label><input class="input" type="number" id="tp_b" value="200000"/></div>
        <div class="field"><label class="field-label">Choychaqa %</label><input class="input" type="number" id="tp_p" value="10"/></div>
        <div class="field"><label class="field-label">Kishilar</label><input class="input" type="number" id="tp_n" value="2"/></div>
      </div>
      <div class="card card-pad-lg" id="tp_out">—</div>`;
  } else if (kind === 'roi'){
    title = t('roi_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Investitsiya</label><input class="input" type="number" id="r_i" value="1000000"/></div>
        <div class="field"><label class="field-label">Foyda</label><input class="input" type="number" id="r_g" value="1300000"/></div>
      </div>
      <div class="card card-pad-lg" id="r_out">—</div>`;
  } else if (kind === 'split'){
    title = t('bill_split');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Jami</label><input class="input" type="number" id="bs_t" value="500000"/></div>
        <div class="field"><label class="field-label">Kishilar</label><input class="input" type="number" id="bs_n" value="4"/></div>
        <div class="field"><label class="field-label">Choychaqa %</label><input class="input" type="number" id="bs_p" value="10"/></div>
      </div>
      <div class="card card-pad-lg" id="bs_out">—</div>`;
  } else if (kind === 'inflation'){
    title = t('inflation_calc');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Bugungi summa</label><input class="input" type="number" id="if_v" value="10000000"/></div>
        <div class="field"><label class="field-label">Yillik inflyatsiya %</label><input class="input" type="number" id="if_r" value="10"/></div>
        <div class="field"><label class="field-label">Yillar</label><input class="input" type="number" id="if_y" value="10"/></div>
      </div>
      <div class="card card-pad-lg" id="if_out">—</div>`;
  } else if (kind === 'planner'){
    title = t('goal_planner');
    body = `
      <div class="grid grid-2">
        <div class="field"><label class="field-label">Maqsad summasi</label><input class="input" type="number" id="gp_t" value="50000000"/></div>
        <div class="field"><label class="field-label">Jamg'arish (oylik)</label><input class="input" type="number" id="gp_m" value="2000000"/></div>
        <div class="field"><label class="field-label">Yillik %</label><input class="input" type="number" id="gp_r" value="8"/></div>
      </div>
      <div class="card card-pad-lg" id="gp_out">—</div>`;
  }
  const card = Modal.open(`<div class="modal-h"><div class="title">${escapeHtml(title)}</div><button class="icon-btn" id="mn_close">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot"><span class="spacer"></span><button class="btn btn-primary" id="mn_ok">${escapeHtml(t('close'))}</button></div>`);
  card.querySelector('#mn_close').onclick = card.querySelector('#mn_ok').onclick = () => Modal.close();

  const num = (id) => parseFloat(card.querySelector('#'+id).value) || 0;
  const rec = () => {
    if (kind === 'loan'){
      const P = num('lc_p'), r = num('lc_r')/100/12, n = num('lc_n');
      const m = r === 0 ? P/n : P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      card.querySelector('#lc_out').innerHTML = `Oylik to'lov<br><strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(m)}</strong><br><span class="muted">Jami: ${moneyHTML(m*n)} · Foiz: ${moneyHTML(m*n - P)}</span>`;
    } else if (kind === 'interest'){
      const P = num('ic_p'), pmt = num('ic_pmt'), r = num('ic_r')/100/12, n = num('ic_y')*12;
      let v = P; for (let i = 0; i < n; i++){ v = v*(1+r) + pmt; }
      card.querySelector('#ic_out').innerHTML = `${num('ic_y')} yildan keyin<br><strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(v)}</strong><br><span class="muted">Foyda: ${moneyHTML(v - P - pmt*n)}</span>`;
    } else if (kind === 'fx'){
      const r = num('fx_r'); const v = num('fx_v');
      card.querySelector('#fx_out').innerHTML = `<strong style="font-family:var(--font-display);font-size:28px">${Fmt.number(v*r, { maximumFractionDigits:2 })} ${escapeHtml(card.querySelector('#fx_b').value)}</strong>`;
    } else if (kind === 'mortgage'){
      const H = num('m_h'); const d = num('m_d')/100; const P = H*(1-d);
      const r = num('m_r')/100/12; const n = num('m_n')*12;
      const m = r === 0 ? P/n : P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      card.querySelector('#m_out').innerHTML = `Oylik to'lov<br><strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(m)}</strong><br><span class="muted">Boshlang'ich: ${moneyHTML(H*d)} · Jami foiz: ${moneyHTML(m*n - P)}</span>`;
    } else if (kind === 'tip'){
      const b = num('tp_b'); const p = num('tp_p')/100; const n = num('tp_n')||1;
      const total = b*(1+p);
      card.querySelector('#tp_out').innerHTML = `Jami: <strong>${moneyHTML(total)}</strong><br>Har kishi uchun: <strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(total/n)}</strong>`;
    } else if (kind === 'roi'){
      const i = num('r_i'); const g = num('r_g');
      const pct = i > 0 ? ((g-i)/i)*100 : 0;
      card.querySelector('#r_out').innerHTML = `ROI<br><strong style="font-family:var(--font-display);font-size:28px;color:${pct>=0?'var(--success)':'var(--danger)'}">${pct.toFixed(1)}%</strong><br><span class="muted">Sof foyda: ${moneyHTML(g-i)}</span>`;
    } else if (kind === 'split'){
      const tot = num('bs_t'); const n = num('bs_n')||1; const p = num('bs_p')/100;
      const each = tot*(1+p)/n;
      card.querySelector('#bs_out').innerHTML = `Har kishi<br><strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(each)}</strong><br><span class="muted">Jami: ${moneyHTML(tot*(1+p))}</span>`;
    } else if (kind === 'inflation'){
      const v = num('if_v'); const r = num('if_r')/100; const y = num('if_y');
      const fut = v / Math.pow(1+r, y);
      card.querySelector('#if_out').innerHTML = `${y} yildan keyin sotib olish kuchi<br><strong style="font-family:var(--font-display);font-size:28px">${moneyHTML(fut)}</strong><br><span class="muted">${Math.round((1 - fut/v)*100)}% qiymat yo'qotadi</span>`;
    } else if (kind === 'planner'){
      const t_ = num('gp_t'); const pmt = num('gp_m'); const r = num('gp_r')/100/12;
      let v = 0, months = 0;
      while (v < t_ && months < 600){ v = v*(1+r) + pmt; months++; }
      card.querySelector('#gp_out').innerHTML = `Erishish vaqti<br><strong style="font-family:var(--font-display);font-size:28px">${Math.floor(months/12)} yil ${months%12} oy</strong>`;
    }
  };
  card.querySelectorAll('input,select').forEach(i => i.oninput = i.onchange = rec);
  rec();
}

/* =========================================================
   SETTINGS
   ========================================================= */
Router.register('/settings', (view) => {
  const s = State.settings();
  const u = State.user();

  // Profile card
  const pc = el('div', { class:'card', style:'margin-bottom:14px' });
  pc.innerHTML = `
    <div class="row">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--accent);color:var(--accent-on);display:grid;place-items:center;font-family:var(--font-display);font-size:22px">${escapeHtml((u.name||'?').slice(0,1).toUpperCase())}</div>
      <div style="flex:1"><input class="input" id="st_name" value="${escapeHtml(u.name||'')}" placeholder="${escapeHtml(t('your_name'))}"/></div>
    </div>`;
  view.append(pc);
  pc.querySelector('#st_name').onchange = e => State.set(d => { d.user.name = e.target.value; });

  // Theme & accent
  const tc = el('div', { class:'card', style:'margin-bottom:14px' });
  tc.innerHTML = `
    <div class="card-h"><h3>${escapeHtml(t('theme'))}</h3></div>
    <div class="seg" id="st_theme"><button data-v="light">${escapeHtml(t('light'))}</button><button data-v="dark">${escapeHtml(t('dark'))}</button><button data-v="auto">${escapeHtml(t('auto'))}</button></div>
    <div class="card-h" style="margin-top:14px"><h3>${escapeHtml(t('accent'))}</h3></div>
    <div class="row" style="gap:10px;flex-wrap:wrap" id="st_acc">
      ${[['default','#0a0a0a'],['green','#10a35b'],['blue','#2563eb'],['purple','#7c3aed'],['orange','#ea580c'],['rose','#e11d48']].map(([k,c]) =>
        `<button data-v="${k}" aria-label="${k}" style="width:32px;height:32px;border-radius:50%;background:${c};box-shadow:inset 0 0 0 2px var(--bg), 0 0 0 ${s.accent===k?'2px':'0'} var(--accent);transition:box-shadow var(--t-fast)"></button>`
      ).join('')}
    </div>`;
  view.append(tc);
  tc.querySelectorAll('#st_theme button').forEach(b => {
    b.classList.toggle('is-active', s.theme === b.dataset.v);
    b.onclick = () => { Theme.setTheme(b.dataset.v); Router.render(); };
  });
  tc.querySelectorAll('#st_acc button').forEach(b => b.onclick = () => { Theme.setAccent(b.dataset.v); Router.render(); });

  // Language
  const lc = el('div', { class:'card', style:'margin-bottom:14px' });
  lc.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('language'))}</h3></div><div class="seg" id="st_lang"><button data-v="uz">O'zbek</button><button data-v="en">English</button><button data-v="ru">Русский</button></div>`;
  view.append(lc);
  lc.querySelectorAll('#st_lang button').forEach(b => {
    b.classList.toggle('is-active', State.lang() === b.dataset.v);
    b.onclick = () => { State.set(d => { d.user.language = b.dataset.v; d.settings.language = b.dataset.v; }); Router.render(); };
  });

  // Currency
  const cc = el('div', { class:'card', style:'margin-bottom:14px' });
  cc.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('select_currency'))}</h3></div>
    <select class="select" id="st_cur">${SUPPORTED_CURRENCIES.map(c => `<option value="${c}" ${u.currency===c?'selected':''}>${c} — ${Fmt.currencySymbol(c)}</option>`).join('')}</select>`;
  view.append(cc);
  cc.querySelector('#st_cur').onchange = e => State.set(d => { d.user.currency = e.target.value; });

  // Toggles
  const togs = [
    ['sounds', t('sounds')],
    ['haptics', t('haptics')],
    ['privacyMode', t('privacy_mode')],
    ['autoBackup', 'Avto-zaxira (7 kun)'],
  ];
  const tg = el('div', { class:'card', style:'margin-bottom:14px' });
  tg.innerHTML = `<div class="card-h"><h3>${escapeHtml(t('overview'))}</h3></div>` + togs.map(([k,label]) => `
    <div class="row" style="padding:10px 0;border-bottom:1px solid var(--hairline)">
      <span style="flex:1;font-weight:600">${escapeHtml(label)}</span>
      <button class="toggle ${s[k] ? 'is-on' : ''}" data-tg="${k}"></button>
    </div>`).join('');
  view.append(tg);
  tg.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => {
    State.set(d => { d.settings[b.dataset.tg] = !d.settings[b.dataset.tg]; });
    Theme.apply(); Router.render(); Haptic.light();
  });

  // Data
  const dc = el('div', { class:'card', style:'margin-bottom:14px' });
  dc.innerHTML = `
    <div class="card-h"><h3>${escapeHtml(t('backup'))}</h3></div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button class="btn" id="st_export">${escapeHtml(t('export'))} JSON</button>
      <button class="btn" id="st_csv">${escapeHtml(t('export'))} CSV</button>
      <button class="btn" id="st_import">${escapeHtml(t('import'))} JSON</button>
      <input type="file" accept="application/json" id="st_file" hidden/>
    </div>`;
  view.append(dc);
  dc.querySelector('#st_export').onclick = () => {
    const blob = new Blob([JSON.stringify(State.raw(), null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `qiymat-backup-${Fmt.iso(new Date())}.json`;
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    Toast.show(t('saved'),'success');
  };
  dc.querySelector('#st_csv').onclick = exportCSV;
  dc.querySelector('#st_import').onclick = () => dc.querySelector('#st_file').click();
  dc.querySelector('#st_file').onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j || !j.user) throw 0;
        State.set(d => { Object.keys(d).forEach(k => delete d[k]); Object.assign(d, j); });
        Toast.show(t('saved'),'success'); Router.render();
      } catch { Toast.show('Import failed','danger'); }
    };
    r.readAsText(f);
  };

  // Shortcuts
  const sc = el('div', { class:'card', style:'margin-bottom:14px' });
  sc.innerHTML = `
    <div class="card-h"><h3>${escapeHtml(t('keyboard_shortcuts'))}</h3></div>
    <div style="font-family:var(--font-mono);font-size:13px;line-height:1.9">
      <div><kbd>N</kbd> — ${escapeHtml(t('new_tx'))}</div>
      <div><kbd>T</kbd> — ${escapeHtml(t('theme'))}</div>
      <div><kbd>G</kbd>+<kbd>D</kbd> — ${escapeHtml(t('dashboard'))}</div>
      <div><kbd>G</kbd>+<kbd>T</kbd> — ${escapeHtml(t('transactions'))}</div>
      <div><kbd>G</kbd>+<kbd>B</kbd> — ${escapeHtml(t('budget'))}</div>
      <div><kbd>G</kbd>+<kbd>S</kbd> — ${escapeHtml(t('goals'))}</div>
      <div><kbd>G</kbd>+<kbd>A</kbd> — ${escapeHtml(t('accounts'))}</div>
      <div><kbd>G</kbd>+<kbd>R</kbd> — ${escapeHtml(t('reports'))}</div>
      <div><kbd>Esc</kbd> — ${escapeHtml(t('close'))}</div>
    </div>`;
  view.append(sc);

  // Privacy footer
  const fr = el('div', { class:'card insight', style:'margin-bottom:14px' });
  fr.innerHTML = `<span class="insight-emoji">🔒</span><div><div class="label" style="margin-bottom:2px">${escapeHtml(t('privacy_first'))}</div><div class="small">${escapeHtml(t('privacy_first_desc'))}</div></div>`;
  view.append(fr);

  // Danger zone
  const danger = el('div', { class:'card', style:'border-color:var(--danger);background:var(--danger-soft)' });
  danger.innerHTML = `<div class="card-h"><h3 style="color:var(--danger)">${escapeHtml(t('danger_zone'))}</h3></div>`;
  const btn = el('button', { class:'btn btn-danger btn-block' }, [t('reset_all')]);
  btn.onclick = () => {
    if (confirm(t('confirm_reset'))){
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };
  danger.append(btn);
  view.append(danger);
});
