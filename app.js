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
    const lang = State.lang();
    const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...opts }).format(Number(n) || 0);
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
  let stack = 0;
  const openHTML = (markup, opts={}) => {
    const portal = $('#portal');
    const scrim = el('div', { class:'scrim', onclick: opts.dismissOnScrim===false ? null : close });
    const wrap = el('div', { class:'modal' });
    const card = el('div', { class:'modal-card', html: markup });
    wrap.append(card);
    portal.append(scrim, wrap);
    stack++;
    document.body.style.overflow = 'hidden';
    // Escape to close
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    card._onKey = onKey;
    return card;
  };
  const close = () => {
    const portal = $('#portal');
    const card = portal.querySelector('.modal-card');
    if (card?._onKey) document.removeEventListener('keydown', card._onKey);
    portal.innerHTML = '';
    stack = 0;
    document.body.style.overflow = '';
  };
  return { open: openHTML, close };
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

// Temporary placeholder views — replaced in subsequent commits.
function placeholder(view, title, desc){
  view.append(el('div', { class:'card card-pad-lg' }, [
    el('h2', { class:'h-display', style:'font-size:24px;margin-bottom:6px' }, [title]),
    el('p', { class:'muted' }, [desc])
  ]));
}
Router.register('/',             v => placeholder(v, t('dashboard'), t('add_some_tx')));
Router.register('/transactions', v => placeholder(v, t('transactions'), '...'));
Router.register('/add',          v => placeholder(v, t('new_tx'), '...'));
Router.register('/budget',       v => placeholder(v, t('budget'), '...'));
Router.register('/goals',        v => placeholder(v, t('goals'), '...'));
Router.register('/accounts',     v => placeholder(v, t('accounts'), '...'));
Router.register('/reports',      v => placeholder(v, t('reports'), '...'));
Router.register('/categories',   v => placeholder(v, t('categories'), '...'));
Router.register('/recurring',    v => placeholder(v, t('recurring'), '...'));
Router.register('/networth',     v => placeholder(v, t('networth'), '...'));
Router.register('/insights',     v => placeholder(v, t('insights'), '...'));
Router.register('/mini',         v => placeholder(v, t('mini'), '...'));
Router.register('/settings',     v => placeholder(v, t('settings'), '...'));
Router.register('/more',         v => placeholder(v, t('nav_more'), '...'));

/* Empty state helper */
function renderEmpty(parent, glyph, title, desc, action){
  const tpl = $('#tpl-empty').content.cloneNode(true);
  tpl.querySelector('.empty-glyph').textContent = glyph;
  tpl.querySelector('.empty-title').textContent = title;
  tpl.querySelector('.empty-desc').textContent  = desc;
  if (action) tpl.querySelector('.empty-action').append(action);
  parent.append(tpl);
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
  $('#fab').addEventListener('click', () => Router.navigate('/add'));
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
    if (e.metaKey || e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n')  { e.preventDefault(); Router.navigate('/add'); }
    if (k === 't')  { Theme.setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
    if (k === '?')  { Router.navigate('/settings'); }
    if (k === 'escape') { /* handled by modal */ }
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
    Router.render();
  }
}

document.addEventListener('DOMContentLoaded', init);
window.Qiymat = { State, Router, Theme, Toast, Haptic, Audio_, Modal, Q, Fmt, t, I18N };
