/* Benjakitti Active. Configure Supabase for shared, cross-device data. */
const STORAGE_KEY = 'benjakitti-active-prototype-v1';
const PREFERENCES_KEY = 'benjakitti-active-preferences-v1';
const backendConfig = window.PARK_BACKEND_CONFIG || {};
const backendConfigured = Boolean(backendConfig.supabaseUrl && backendConfig.supabasePublishableKey);
const backendClient = backendConfigured && window.supabase?.createClient
  ? window.supabase.createClient(backendConfig.supabaseUrl, backendConfig.supabasePublishableKey)
  : null;
let backendReady = false;
let backendSaveQueue = Promise.resolve();
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const languageLocales = { en: 'en-US', th: 'th-TH', zh: 'zh-CN', ja: 'ja-JP' };
const uiTranslations = {
  'Benjakitti Active — Park sports, made easier': ['เบญจกิติ แอคทีฟ — กีฬาในสวนที่ง่ายขึ้น', 'Benjakitti Active — 轻松畅享公园运动', 'ベンジャキティ・アクティブ — 公園スポーツをもっと気軽に'],
  'Park operations': ['การดำเนินงานของสวน', '公园运营', '公園の運営'], 'Staff workspace': ['พื้นที่ทำงานเจ้าหน้าที่', '工作人员工作区', 'スタッフ用ワークスペース'], 'Account settings': ['ตั้งค่าบัญชี', '账户设置', 'アカウント設定'],
  'Park sports, made easier': ['กีฬาในสวนที่ง่ายขึ้น', '轻松畅享公园运动', '公園スポーツをもっと気軽に'],
  'A better way to get moving': ['เริ่มออกกำลังกายได้ง่ายขึ้น', '让运动更轻松', 'もっと気軽に体を動かそう'],
  'Your next game starts with knowing when.': ['เกมถัดไปเริ่มต้นจากการรู้ช่วงเวลาที่เหมาะ', '掌握合适时间，开启下一场运动。', '空き時間を知って、次のゲームを始めよう。'],
  'Check live court schedules and equipment availability before you head to the park. Less guesswork, more play.': ['ตรวจสอบตารางสนามและอุปกรณ์ก่อนเดินทางมาสวน วางแผนน้อยลง สนุกกับกีฬาได้มากขึ้น', '前往公园前查看球场和器材的实时情况，少些等待，多些运动。', '公園に来る前にコートと用具の空き状況を確認。迷わず、もっとプレーを楽しめます。'],
  'Choose your sport to see every court’s live queue.': ['เลือกกีฬาเพื่อดูคิวของทุกสนามแบบเรียลไทม์', '选择运动项目，查看各球场的实时队列。', 'スポーツを選ぶと、各コートの待ち状況を確認できます。'],
  'Check the schedule before you set out. Each court’s timeline shows booked time in red and your own bookings in green. Choose a time from 7:00 AM to 9:00 PM.': ['ตรวจสอบตารางก่อนออกเดินทาง ช่วงเวลาที่จองแล้วแสดงเป็นสีแดง และคิวของคุณแสดงเป็นสีเขียว เลือกเวลาได้ตั้งแต่ 7:00 ถึง 21:00 น.', '出发前请查看时间表。红色表示已被他人预约，绿色表示您的预约。可预约时间为 7:00 至 21:00。', '出発前にスケジュールをご確認ください。赤は他の人の予約、緑はあなたの予約です。利用時間は7:00〜21:00です。'],
  'See what’s ready to use before you arrive.': ['ตรวจสอบอุปกรณ์ที่พร้อมใช้งานก่อนมาถึง', '到达前查看可用器材。', '到着前に利用できる用具を確認できます。'],
  'Update park availability and handle on-the-day changes.': ['อัปเดตสถานะสวนและจัดการการเปลี่ยนแปลงในแต่ละวัน', '更新公园可用状态并处理当天的变更。', '公園の利用状況を更新し、当日の変更に対応します。'],
  'Search accounts and manage park access.': ['ค้นหาบัญชีและจัดการสิทธิ์เข้าใช้งาน', '搜索账户并管理公园访问权限。', 'アカウントを検索して利用権限を管理します。'],
  'Choose a color theme or match your device’s appearance.': ['เลือกธีมสีหรือใช้การตั้งค่าตามอุปกรณ์', '选择配色主题，或跟随设备外观设置。', 'テーマを選ぶか、デバイスの外観設定に合わせます。'],
  'Choose the language used across this website.': ['เลือกภาษาที่ใช้บนเว็บไซต์นี้', '选择此网站使用的语言。', 'このウェブサイトで使用する言語を選択します。'],
  'Your bookings will stay linked to your account.': ['การจองของคุณจะยังเชื่อมโยงกับบัญชีเดิม', '您的预约仍会关联到您的账户。', '予約は引き続きアカウントに紐づきます。'],
  'Court use and equipment bookings · estimated from park schedules': ['การใช้สนามและการจองอุปกรณ์ · ประมาณจากตารางของสวน', '球场使用和器材预约 · 根据公园时间表估算', 'コート利用・用具予約 · 公園のスケジュールから推定'],
  'Line chart of court and equipment activity': ['กราฟเส้นแสดงการใช้สนามและอุปกรณ์', '球场和器材活动折线图', 'コートと用具の利用状況を示す折れ線グラフ'], 'sport illustration': ['ภาพประกอบกีฬา', '运动插图', 'スポーツのイラスト'], 'court illustration': ['ภาพประกอบสนาม', '球场插图', 'コートのイラスト'],
  'Our simple forecast expects fewer visitors around this time, so you can spend less time waiting and more time playing.': ['จากการคาดการณ์ ช่วงเวลานี้น่าจะมีผู้ใช้บริการน้อยลง ช่วยให้รอน้อยลงและเล่นกีฬาได้มากขึ้น', '根据简单预测，这个时段游客较少，您可以少等待、多运动。', 'この時間帯は利用者が少ないと予測されるため、待ち時間を減らしてプレーを楽しめます。'],
  'Availability changes as park users book or release a time slot.': ['สถานะจะเปลี่ยนเมื่อผู้ใช้จองหรือยกเลิกช่วงเวลา', '公园用户预约或取消时段后，可用情况会随之更新。', '利用者の予約やキャンセルに応じて空き状況が変わります。'],
  'Demo schedules help illustrate availability. In a live park service, staff or booking integrations would keep this schedule current.': ['ตารางตัวอย่างนี้ใช้แสดงสถานะความพร้อมใช้งาน หากเปิดให้บริการจริง เจ้าหน้าที่หรือระบบจองจะอัปเดตตารางนี้', '示例时间表用于展示可用情况。正式服务中，工作人员或预约系统会及时更新。', 'このデモ用スケジュールは空き状況の説明用です。実際のサービスでは、スタッフや予約システムが更新します。'],
  'Select an idle item to reserve it. Equipment status is sample data for this prototype.': ['เลือกอุปกรณ์ที่ว่างเพื่อจอง สถานะอุปกรณ์ในต้นแบบนี้เป็นข้อมูลตัวอย่าง', '选择空闲器材进行预约。本原型中的器材状态为示例数据。', '空いている用具を選択して予約します。用具の状態はこのプロトタイプ用のサンプルです。'],
  'Changes update availability across this prototype.': ['การเปลี่ยนแปลงจะอัปเดตสถานะในต้นแบบนี้', '更改会更新此原型中的可用状态。', '変更はこのプロトタイプ内の空き状況に反映されます。'],
  'Admin actions are saved in this browser’s prototype data. In a live service, staff changes would sync to every device.': ['การจัดการของผู้ดูแลจะบันทึกไว้ในข้อมูลต้นแบบของเบราว์เซอร์นี้ หากเปิดให้บริการจริง การเปลี่ยนแปลงจะซิงก์ไปยังทุกอุปกรณ์', '管理员操作保存在此浏览器的原型数据中。正式服务中，工作人员的更改会同步到所有设备。', '管理者の操作はこのブラウザーのプロトタイプデータに保存されます。実際のサービスでは全デバイスに同期されます。'],
  'Prototype account data is stored locally in this browser. Password reveal lasts 10 seconds and then hides automatically.': ['ข้อมูลบัญชีตัวอย่างจะจัดเก็บในเบราว์เซอร์นี้ การแสดงรหัสผ่านจะซ่อนกลับโดยอัตโนมัติหลัง 10 วินาที', '原型账户数据仅保存在此浏览器中。密码显示 10 秒后会自动隐藏。', 'プロトタイプのアカウント情報はこのブラウザーに保存されます。パスワードは10秒後に自動で非表示になります。'],
  'Court schedules and queues are loaded from the shared database.': ['ตารางสนามและคิวโหลดจากฐานข้อมูลส่วนกลาง', '球场时间表和队列已从共享数据库加载。', 'コートのスケジュールと予約状況は共有データベースから読み込まれます。'],
  'Select an idle item to reserve it. Equipment status is loaded from the shared database.': ['เลือกอุปกรณ์ที่ว่างเพื่อจอง สถานะอุปกรณ์โหลดจากฐานข้อมูลส่วนกลาง', '选择空闲器材进行预约。器材状态已从共享数据库加载。', '空いている用具を選択して予約します。用具の状態は共有データベースから読み込まれます。'],
  'Changes are saved to the shared database.': ['การเปลี่ยนแปลงบันทึกลงฐานข้อมูลส่วนกลางแล้ว', '更改已保存到共享数据库。', '変更は共有データベースに保存されます。'],
  'Staff changes are shared across devices.': ['การเปลี่ยนแปลงของเจ้าหน้าที่จะแสดงบนทุกอุปกรณ์', '工作人员的更改会同步到所有设备。', 'スタッフの変更はすべてのデバイスに反映されます。'],
  'Passwords are managed by secure authentication and can never be viewed. Enter a new password in Manage to reset one.': ['รหัสผ่านจัดการด้วยระบบยืนยันตัวตนที่ปลอดภัยและไม่สามารถดูได้ หากต้องการเปลี่ยน ให้กรอกรหัสผ่านใหม่ในเมนูจัดการ', '密码由安全身份验证系统管理，无法查看。如需重置，请在“管理”中输入新密码。', 'パスワードは安全な認証システムで管理され、表示できません。変更するには「管理」で新しいパスワードを入力してください。'],
  'Bookings and park equipment are loaded from the shared database. Theme and language preferences stay on this device.': ['รายการจองและอุปกรณ์สวนโหลดจากฐานข้อมูลส่วนกลาง ส่วนธีมและภาษาจะบันทึกไว้ในอุปกรณ์นี้', '预约和公园器材已从共享数据库加载。主题和语言偏好保存在此设备上。', '予約と公園用具の情報は共有データベースから読み込まれます。テーマと言語設定はこのデバイスに保存されます。'],
  'Reservations are saved to the shared database. Staff changes are visible on other devices.': ['รายการจองบันทึกลงฐานข้อมูลส่วนกลาง การเปลี่ยนแปลงของเจ้าหน้าที่จะแสดงบนอุปกรณ์อื่นด้วย', '预约已保存到共享数据库。工作人员的更改会显示在其他设备上。', '予約は共有データベースに保存されます。スタッフの変更は他のデバイスにも反映されます。'],
  'Their account and associated reservations will be removed from the shared database.': ['บัญชีและรายการจองที่เกี่ยวข้องจะถูกลบออกจากฐานข้อมูลส่วนกลาง', '该账户及其相关预约将从共享数据库中删除。', 'このアカウントと関連する予約は共有データベースから削除されます。'],
  'For an operational service, the park would connect this interface to a shared booking and maintenance system.': ['หากนำไปใช้งานจริง สวนจะเชื่อมต่อหน้านี้กับระบบจองและบำรุงรักษาส่วนกลาง', '正式运营时，公园会将此界面连接到共享预约和维护系统。', '実際に運用する場合は、共通の予約・メンテナンスシステムに接続します。'],
  'This demo uses sample court schedules and equipment status. Changes are saved in this browser only. It does not send reservations to park staff.': ['เดโมนี้ใช้ตารางสนามและสถานะอุปกรณ์ตัวอย่าง การเปลี่ยนแปลงจะบันทึกในเบราว์เซอร์นี้เท่านั้น และจะไม่ส่งการจองไปยังเจ้าหน้าที่สวน', '此演示使用球场时间表和器材状态示例。更改仅保存在此浏览器中，不会将预约发送给公园工作人员。', 'このデモではコートのスケジュールと用具の状態にサンプルを使用します。変更はこのブラウザーにのみ保存され、スタッフには送信されません。'],
  'Park open · 5:00 AM–9:00 PM': ['สวนเปิด · 5:00–21:00 น.', '公园开放 · 5:00–21:00', '公園開園 · 5:00〜21:00'],
  'Benchakitti Park · Open 5:00 AM–9:00 PM': ['สวนเบญจกิติ · เปิด 5:00–21:00 น.', 'Benchakitti 公园 · 开放时间 5:00–21:00', 'ベンジャキティ公園 · 開園時間 5:00〜21:00'],
  'Court queues and service status': ['คิวสนามและสถานะการให้บริการ', '球场队列和服务状态', 'コートの待ち状況とサービス状態'],
  'Equipment status, reservations, and pickup records': ['สถานะอุปกรณ์ การจอง และบันทึกการรับอุปกรณ์', '器材状态、预约和领取记录', '用具の状態、予約、受け取り記録'],
  'Search by username…': ['ค้นหาด้วยชื่อผู้ใช้…', '按用户名搜索…', 'ユーザー名で検索…'],
  'Search serial…': ['ค้นหาหมายเลขอุปกรณ์…', '搜索器材编号…', '用具番号を検索…'],
  'Search serial': ['ค้นหาหมายเลขอุปกรณ์', '搜索器材编号', '用具番号を検索'],
  'Search equipment serial': ['ค้นหาหมายเลขอุปกรณ์', '搜索器材编号', '用具番号を検索'],
  'Search usernames': ['ค้นหาชื่อผู้ใช้', '搜索用户名', 'ユーザー名を検索'],
  'Select month': ['เลือกเดือน', '选择月份', '月を選択'], 'Select year': ['เลือกปี', '选择年份', '年を選択'], 'Select day': ['เลือกวัน', '选择日期', '日を選択'], 'Select week': ['เลือกสัปดาห์', '选择周', '週を選択'],
  'Select equipment date': ['เลือกวันที่ใช้อุปกรณ์', '选择器材日期', '用具の日付を選択'], 'Filter by equipment status': ['กรองตามสถานะอุปกรณ์', '按器材状态筛选', '用具の状態で絞り込む'],
  'Equipment sport': ['กีฬาและอุปกรณ์', '器材运动项目', '用具のスポーツ'], 'Management area': ['ส่วนการจัดการ', '管理区域', '管理エリア'],
  'English': ['English', 'English', 'English'],
  'Language': ['ภาษา', '语言', '言語'],
  'Overview': ['ภาพรวม', '概览', '概要'], 'Home': ['หน้าหลัก', '首页', 'ホーム'], 'Courts': ['สนาม', '球场', 'コート'],
  'Book a court': ['จองสนาม', '预约球场', 'コートを予約'], 'Court schedule': ['ตารางสนาม', '球场时间表', 'コートのスケジュール'],
  'Equipment': ['อุปกรณ์', '器材', '用具'], 'Equipment availability': ['สถานะอุปกรณ์', '器材可用情况', '用具の空き状況'],
  'Settings': ['ตั้งค่า', '设置', '設定'], 'Court & equipment admin': ['จัดการสนามและอุปกรณ์', '球场和器材管理', 'コート・用具の管理'],
  'User administration': ['จัดการผู้ใช้', '用户管理', 'ユーザー管理'], 'Log in': ['เข้าสู่ระบบ', '登录', 'ログイン'],
  'Create account': ['สร้างบัญชี', '创建账户', 'アカウントを作成'], 'Park management': ['จัดการสวน', '公园管理', '公園管理'],
  'Park menu': ['เมนูสวน', '公园菜单', '公園メニュー'], 'A little more active': ['ขยับร่างกายอีกนิด', '让运动更轻松', 'もっとアクティブに'],
  'Find your time': ['หาเวลาที่ใช่', '找到合适时间', 'ちょうどいい時間を'], 'to play.': ['เพื่อเล่นกีฬา', '开始运动', '見つけよう'],
  'Live park availability · Bangkok': ['สถานะสวนแบบเรียลไทม์ · กรุงเทพฯ', '曼谷 · 公园实时状态', 'バンコク · 公園のリアルタイム状況'],
  'Guest visitor': ['ผู้เยี่ยมชม', '访客', 'ゲスト'], 'Browse as a guest': ['ใช้งานในฐานะผู้เยี่ยมชม', '以访客身份浏览', 'ゲストとして利用'],
  'Your next game starts': ['เกมถัดไปของคุณเริ่มต้น', '下一场运动即将开始', '次のゲームは'],
  'with knowing when.': ['ด้วยการรู้เวลาที่เหมาะ', '从了解合适时间开始。', '時間を知ることから。'],
  'Book a court': ['จองสนาม', '预约球场', 'コートを予約'], 'Find equipment': ['หาอุปกรณ์', '查找器材', '用具を探す'],
  'Court activity': ['การใช้งานสนาม', '球场使用情况', 'コート利用状況'], 'in use right now': ['กำลังใช้งานอยู่', '当前使用中', '現在利用中'],
  'Busy right now': ['ค่อนข้างหนาแน่น', '目前较忙', '現在混雑しています'], 'Steady right now': ['มีผู้ใช้ปานกลาง', '目前较平稳', '現在は通常の混雑度です'],
  'Plenty of room': ['ยังมีพื้นที่ว่างมาก', '空位充足', '空きに余裕があります'], 'courts across 4 sports': ['สนาม จาก 4 ประเภทกีฬา', '个球场，涵盖 4 种运动', '面のコート、4種類のスポーツ'],
  'Equipment ready': ['อุปกรณ์พร้อมใช้', '可用器材', '利用可能な用具'], 'pieces': ['ชิ้น', '件', '点'], 'booked': ['จองแล้ว', '已预约', '予約済み'],
  'for today': ['วันนี้', '今日', '本日'], 'Needs attention': ['ต้องตรวจสอบ', '需要处理', '要確認'], 'items reported broken': ['ชิ้นแจ้งว่าชำรุด', '件器材报告损坏', '点の用具が故障中'],
  'Across all 4 equipment types': ['จากอุปกรณ์ทั้ง 4 ประเภท', '涵盖全部 4 类器材', '4種類すべての用具'],
  'Your upcoming queue': ['คิวที่กำลังจะมาถึง', '即将到来的预约', '今後の予約'], 'upcoming bookings': ['รายการจองที่กำลังจะมาถึง', '个即将到来的预约', '件の今後の予約'],
  'sign in to view': ['เข้าสู่ระบบเพื่อดู', '登录后查看', 'ログインして確認'], 'Your park plans, all in one place': ['แผนการใช้สวนของคุณในที่เดียว', '集中查看您的公园计划', '公園の予定をまとめて確認'],
  'One account': ['บัญชีเดียว', '一个账户', '1つのアカウント'], 'for all your bookings': ['สำหรับการจองทั้งหมดของคุณ', '管理您的所有预约', 'すべての予約を管理'],
  'Park activity': ['กิจกรรมในสวน', '公园活动', '公園の利用状況'], 'Day': ['วัน', '日', '日'], 'Week': ['สัปดาห์', '周', '週'], 'Month': ['เดือน', '月', '月'],
  'Hourly activity for the selected day': ['กิจกรรมรายชั่วโมงของวันที่เลือก', '所选日期的每小时活动', '選択した日の時間別利用状況'],
  'Daily activity across the selected week': ['กิจกรรมรายวันของสัปดาห์ที่เลือก', '所选周的每日活动', '選択した週の日別利用状況'],
  'Daily activity across the selected month': ['กิจกรรมรายวันของเดือนที่เลือก', '所选月份的每日活动', '選択した月の日別利用状況'],
  'Court occupancy': ['การใช้สนาม', '球场占用率', 'コート稼働率'], 'Equipment booked': ['การจองอุปกรณ์', '器材预约', '用具の予約'],
  'A quieter time to play': ['ช่วงเวลาที่คนน้อยกว่า', '人少一些的运动时段', '比較的空いている時間'], 'Recommended slot': ['ช่วงเวลาที่แนะนำ', '推荐时段', 'おすすめの時間'],
  'Estimated park activity': ['ประมาณการการใช้งานสวน', '公园活动估算', '公園の利用予測'], 'Check this time': ['ตรวจสอบเวลานี้', '查看此时段', 'この時間を確認'],
  'low': ['ต่ำ', '较低', '低'], 'Your queue': ['คิวของคุณ', '您的预约', 'あなたの予約'],
  'Your upcoming court and equipment bookings': ['รายการจองสนามและอุปกรณ์ที่กำลังจะมาถึง', '您即将到来的球场和器材预约', '今後のコート・用具の予約'],
  'Sign in to see your upcoming park plans': ['เข้าสู่ระบบเพื่อดูแผนการใช้สวน', '登录以查看即将到来的公园计划', 'ログインして公園の予定を確認'],
  'Make a booking': ['จองเวลา', '进行预约', '予約する'], 'Your queue is clear': ['ตอนนี้ยังไม่มีคิว', '目前没有预约', '現在予約はありません'],
  'Your queue will appear here': ['คิวของคุณจะแสดงที่นี่', '您的预约会显示在这里', '予約はここに表示されます'],
  'Book a court or borrow equipment to see your upcoming plans here.': ['จองสนามหรือยืมอุปกรณ์เพื่อดูแผนที่กำลังจะมาถึงที่นี่', '预约球场或借用器材后，即可在此查看计划。', 'コートを予約するか用具を借りると、今後の予定がここに表示されます。'],
  'Sign in to make a booking and see your upcoming park plans.': ['เข้าสู่ระบบเพื่อจองและดูแผนการใช้สวน', '登录以进行预约并查看公园计划。', 'ログインして予約し、公園の予定を確認してください。'],
  'Explore courts': ['ดูสนาม', '浏览球场', 'コートを見る'], 'Log in to book': ['เข้าสู่ระบบเพื่อจอง', '登录后预约', 'ログインして予約'],
  'Courts by sport': ['สนามตามประเภทกีฬา', '按运动项目查看球场', 'スポーツ別のコート'], 'Today’s schedule at a glance': ['ตารางวันนี้โดยสรุป', '今日时间表一览', '今日のスケジュール概要'],
  'View schedules': ['ดูตาราง', '查看时间表', 'スケジュールを見る'], 'Court': ['สนาม', '球场', 'コート'], 'Gear': ['อุปกรณ์', '器材', '用具'],
  'Make a plan': ['วางแผน', '制定计划', '計画する'], 'See schedule': ['ดูตาราง', '查看时间表', 'スケジュールを見る'],
  'Daily hours': ['เวลาเปิดให้บริการ', '每日开放时间', '利用時間'], 'Daily hours ·': ['เวลาเปิดให้บริการ ·', '每日开放时间 ·', '利用時間 ·'], ' · Each block is 30 minutes': [' · แต่ละช่วงยาว 30 นาที', ' · 每个时段为 30 分钟', ' · 1枠は30分です'], 'Each block is 30 minutes': ['แต่ละช่วงยาว 30 นาที', '每个时段为 30 分钟', '1枠は30分です'],
  'Show date': ['แสดงวันที่', '显示日期', '日付を表示'], 'All sports': ['กีฬาทั้งหมด', '所有运动', 'すべてのスポーツ'],
  'Tap a timeline booking for details or choose an open time below.': ['แตะรายการจองบนไทม์ไลน์เพื่อดูรายละเอียด หรือเลือกเวลาว่างด้านล่าง', '点击时间轴上的预约查看详情，或在下方选择空闲时段。', 'タイムラインの予約をタップして詳細を確認するか、下から空き時間を選択してください。'],
  'Open schedule': ['ดูตาราง', '查看时间表', 'スケジュールを見る'], 'Out of service': ['งดให้บริการ', '暂停服务', '利用停止'],
  'In use now': ['กำลังใช้งาน', '正在使用', '利用中'], 'Unavailable': ['ไม่พร้อมใช้งาน', '不可用', '利用できません'],
  'Booked': ['จองแล้ว', '已预约', '予約済み'], 'Your queue': ['คิวของคุณ', '您的预约', 'あなたの予約'],
  'Make a queue': ['จองคิว', '预约时段', '予約する'], 'Open': ['เปิดให้บริการ', '开放', '利用可能'],
  'Reopen court': ['เปิดสนามอีกครั้ง', '重新开放球场', 'コートを再開'], 'Mark out of service': ['ตั้งเป็นงดให้บริการ', '设为暂停服务', '利用停止にする'],
  'Equipment desk': ['จุดบริการอุปกรณ์', '器材服务台', '用具受付'], 'Borrow equipment': ['ยืมอุปกรณ์', '借用器材', '用具を借りる'],
  '30 pieces': ['30 ชิ้น', '30 件', '30点'], 'Viewing': ['กำลังดู', '正在查看', '表示中'], 'See items': ['ดูอุปกรณ์', '查看器材', '用具を見る'],
  'Availability for': ['สถานะของวันที่', '可用情况：', '利用状況：'], 'items': ['ชิ้น', '件', '点'], 'All status': ['ทุกสถานะ', '所有状态', 'すべての状態'],
  'Idle': ['ว่าง', '空闲', '空き'], 'Booked by others': ['ผู้อื่นจองแล้ว', '已被他人预约', '他の人が予約済み'], 'Booked · others': ['จองโดยผู้อื่น', '他人已预约', '他の人が予約済み'], 'Booked · you': ['คุณจองแล้ว', '您已预约', 'あなたが予約済み'],
  'Broken': ['ชำรุด', '损坏', '故障'], 'Booked by you': ['คุณจองแล้ว', '您已预约', 'あなたが予約済み'],
  'idle': ['ว่าง', '空闲', '空き'], 'yours': ['ของคุณ', '您的', 'あなた'], 'broken': ['ชำรุด', '损坏', '故障'],
  'No equipment matches this search.': ['ไม่พบอุปกรณ์ที่ตรงกับการค้นหา', '没有符合搜索条件的器材。', '検索条件に一致する用具はありません。'],
  'Serial ·': ['หมายเลข ·', '编号 ·', '番号 ·'], 'Manage status': ['จัดการสถานะ', '管理状态', '状態を管理'],
  'Date': ['วันที่', '日期', '日付'], 'Release': ['ปล่อยคิว', '释放预约', '予約を解除'], 'No queues on this date.': ['ไม่มีคิวในวันนี้', '此日期没有预约。', 'この日の予約はありません。'],
  'sample queue': ['คิวตัวอย่าง', '示例预约', 'サンプル予約'], 'Picked up': ['รับอุปกรณ์แล้ว', '已领取', '受け取り済み'], 'Awaiting pickup': ['รอรับอุปกรณ์', '等待领取', '受け取り待ち'],
  'Your preferences': ['การตั้งค่าของคุณ', '您的偏好设置', 'ユーザー設定'], 'Appearance': ['รูปลักษณ์', '外观', '外観'], 'Theme': ['ธีม', '主题', 'テーマ'],
  'Make Benjakitti Active feel right for you.': ['ปรับ Benjakitti Active ให้เหมาะกับคุณ', '让 Benjakitti Active 更符合您的喜好。', 'Benjakitti Activeを自分に合った設定にしましょう。'],
  'Update your username.': ['อัปเดตชื่อผู้ใช้ของคุณ', '更新您的用户名。', 'ユーザー名を更新します。'],
  'Applies on this browser and device.': ['ใช้กับเบราว์เซอร์และอุปกรณ์นี้', '应用于此浏览器和设备。', 'このブラウザーとデバイスに適用されます。'],
  'Use device setting': ['ใช้การตั้งค่าของอุปกรณ์', '跟随设备设置', 'デバイスの設定を使用'], 'Light': ['สว่าง', '浅色', 'ライト'], 'Dark': ['มืด', '深色', 'ダーク'],
  'Account': ['บัญชี', '账户', 'アカウント'], 'Username': ['ชื่อผู้ใช้', '用户名', 'ユーザー名'], 'Password': ['รหัสผ่าน', '密码', 'パスワード'],
  'At least 8 characters and one English letter.': ['อย่างน้อย 8 ตัวอักษร และมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว', '至少 8 个字符，并包含至少 1 个英文字母。', '8文字以上で、英字を1文字以上含めてください。'],
  'Save username': ['บันทึกชื่อผู้ใช้', '保存用户名', 'ユーザー名を保存'], 'Log out': ['ออกจากระบบ', '退出登录', 'ログアウト'],
  'You’re browsing as a guest': ['คุณกำลังใช้งานในฐานะผู้เยี่ยมชม', '您正在以访客身份浏览', 'ゲストとして閲覧中'],
  'Log in to manage your account and bookings.': ['เข้าสู่ระบบเพื่อจัดการบัญชีและการจอง', '登录以管理账户和预约。', 'ログインしてアカウントと予約を管理してください。'],
  'About this prototype': ['เกี่ยวกับต้นแบบนี้', '关于此原型', 'このプロトタイプについて'],
  'Welcome back': ['ยินดีต้อนรับกลับ', '欢迎回来', 'おかえりなさい'], 'Log in to your account': ['เข้าสู่ระบบบัญชีของคุณ', '登录您的账户', 'アカウントにログイン'],
  'Sign in to make a court queue or reserve equipment at the park.': ['เข้าสู่ระบบเพื่อจองคิวสนามหรืออุปกรณ์ในสวน', '登录后即可预约球场或公园器材。', 'ログインしてコートや公園の用具を予約できます。'],
  'New to the park?': ['เพิ่งมาใช้บริการ?', '第一次使用？', '初めてご利用ですか？'], 'Create an account': ['สร้างบัญชี', '创建账户', 'アカウントを作成'],
  'Prototype admin accounts': ['บัญชีผู้ดูแลสำหรับต้นแบบ', '原型管理员账户', 'プロトタイプ管理者アカウント'], 'Admin: admin001 · 12345678': ['ผู้ดูแล: admin001 · 12345678', '管理员：admin001 · 12345678', '管理者：admin001 · 12345678'],
  'Head account: headaccount001 · RVKs2551': ['บัญชีหัวหน้าผู้ดูแล: headaccount001 · RVKs2551', '主管账户：headaccount001 · RVKs2551', 'ヘッドアカウント：headaccount001 · RVKs2551'],
  'Join the park': ['เข้าร่วมใช้งานสวน', '加入公园', '公園サービスに登録'], 'Create your account': ['สร้างบัญชีของคุณ', '创建您的账户', 'アカウントを作成'],
  'One account to check court queues and borrow park equipment.': ['บัญชีเดียวสำหรับตรวจสอบคิวสนามและยืมอุปกรณ์ในสวน', '一个账户即可查看球场队列并借用公园器材。', '1つのアカウントでコートの待ち状況を確認し、公園の用具を借りられます。'],
  'At least 8 characters, including one English letter.': ['อย่างน้อย 8 ตัวอักษร โดยมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว', '至少 8 个字符，并包含至少 1 个英文字母。', '8文字以上で、英字を1文字以上含めてください。'],
  'At least 8 characters, with uppercase, lowercase, and a number.': ['อย่างน้อย 8 ตัวอักษร โดยมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข', '至少 8 个字符，并包含大写字母、小写字母和数字。', '8文字以上で、大文字・小文字・数字を含めてください。'],
  'Telephone number': ['หมายเลขโทรศัพท์', '电话号码', '電話番号'], '(optional)': ['(ไม่บังคับ)', '（可选）', '（任意）'], 'Already registered?': ['มีบัญชีแล้ว?', '已有账户？', 'すでに登録済みですか？'], 'For staff to contact you': ['สำหรับให้เจ้าหน้าที่ติดต่อคุณ', '供工作人员联系您', 'スタッフから連絡するため'],
  'Administrator access': ['สิทธิ์ผู้ดูแลระบบ', '管理员权限', '管理者アクセス'], 'Add user': ['เพิ่มผู้ใช้', '添加用户', 'ユーザーを追加'],
  'Access': ['สิทธิ์', '权限', '権限'], 'Manage': ['จัดการ', '管理', '管理'], 'No matching users.': ['ไม่พบผู้ใช้ที่ตรงกัน', '没有匹配的用户。', '一致するユーザーはいません。'],
  'Usernames are sorted alphabetically. Head account permissions cannot be changed by an administrator.': ['ชื่อผู้ใช้เรียงตามตัวอักษร ผู้ดูแลระบบไม่สามารถเปลี่ยนสิทธิ์บัญชีหัวหน้าผู้ดูแลได้', '用户名按字母排序。管理员不能更改主管账户的权限。', 'ユーザー名はアルファベット順です。管理者はヘッドアカウントの権限を変更できません。'],
  'Friends': ['เพื่อน', '好友', '友達'], 'Add friend': ['เพิ่มเพื่อน', '添加好友', '友達を追加'], 'Find friends by username and invite them to play.': ['ค้นหาเพื่อนด้วยชื่อผู้ใช้และชวนมาเล่นกีฬา', '通过用户名查找好友并邀请他们一起运动。', 'ユーザー名で友達を探して、一緒にプレーするよう招待できます。'],
  'Friend username': ['ชื่อผู้ใช้ของเพื่อน', '好友用户名', '友達のユーザー名'], 'Send request': ['ส่งคำขอ', '发送请求', 'リクエストを送信'], 'Your friends': ['เพื่อนของคุณ', '您的好友', '友達'], 'No friends yet. Send a request to get started.': ['ยังไม่มีเพื่อน ส่งคำขอเพื่อเริ่มต้น', '还没有好友。发送好友请求以开始。', 'まだ友達がいません。リクエストを送って始めましょう。'],
  'Friend requests': ['คำขอเป็นเพื่อน', '好友请求', '友達リクエスト'], 'Incoming': ['ขาเข้า', '收到的', '受信'], 'Outgoing': ['ขาออก', '已发送', '送信済み'], 'Accept': ['ยอมรับ', '接受', '承認'], 'Decline': ['ปฏิเสธ', '拒绝', '拒否'], 'Remove friend': ['ลบเพื่อน', '删除好友', '友達を削除'], 'No pending friend requests.': ['ไม่มีคำขอเป็นเพื่อนที่รอดำเนินการ', '没有待处理的好友请求。', '保留中の友達リクエストはありません。'],
  'Play invitations': ['คำเชิญเล่นกีฬา', '运动邀请', 'プレーへの招待'], 'No play invitations yet.': ['ยังไม่มีคำเชิญเล่นกีฬา', '还没有运动邀请。', 'プレーへの招待はまだありません。'], 'Invite to play': ['ชวนเล่นกีฬา', '邀请一起运动', '一緒にプレーに誘う'], 'Invite a friend to this court queue.': ['ชวนเพื่อนมาที่คิวสนามนี้', '邀请好友参加此球场预约。', 'このコート予約に友達を招待します。'], 'Choose a friend': ['เลือกเพื่อน', '选择好友', '友達を選択'], 'Send invite': ['ส่งคำเชิญ', '发送邀请', '招待を送る'], 'Court queue invitation': ['คำเชิญเข้าคิวสนาม', '球场预约邀请', 'コート予約への招待'], 'Friend booked (เพื่อนจอง)': ['เพื่อนจอง', '好友已预约', '友達が予約済み'], 'Friend queue': ['คิวของเพื่อน', '好友预约', '友達の予約'], 'Friend bookings appear in blue.': ['การจองของเพื่อนแสดงเป็นสีน้ำเงิน', '好友的预约会显示为蓝色。', '友達の予約は青色で表示されます。'], 'Friend request sent.': ['ส่งคำขอเป็นเพื่อนแล้ว', '好友请求已发送。', '友達リクエストを送信しました。'], 'You are now friends.': ['ตอนนี้คุณเป็นเพื่อนกันแล้ว', '你们现在是好友了。', '友達になりました。'], 'Friend removed.': ['ลบเพื่อนแล้ว', '已删除好友。', '友達を削除しました。'], 'Invitation sent.': ['ส่งคำเชิญแล้ว', '邀请已发送。', '招待を送信しました。'], 'Invitation accepted.': ['ตอบรับคำเชิญแล้ว', '已接受邀请。', '招待を承認しました。'], 'Invitation declined.': ['ปฏิเสธคำเชิญแล้ว', '已拒绝邀请。', '招待を断りました。'], 'That username was not found.': ['ไม่พบชื่อผู้ใช้นี้', '未找到该用户名。', 'そのユーザー名は見つかりません。'],
  'Friend request declined.': ['ปฏิเสธคำขอเป็นเพื่อนแล้ว', '已拒绝好友请求。', '友達リクエストを拒否しました。'], 'You cannot add yourself as a friend.': ['ไม่สามารถเพิ่มตัวเองเป็นเพื่อนได้', '不能添加自己为好友。', '自分を友達に追加することはできません。'], 'You are already friends with this user.': ['คุณเป็นเพื่อนกับผู้ใช้นี้แล้ว', '您已经是此用户的好友。', 'このユーザーとはすでに友達です。'], 'A friend request is already pending.': ['มีคำขอเป็นเพื่อนที่รอดำเนินการอยู่แล้ว', '好友请求已在等待处理中。', '友達リクエストはすでに保留中です。'], 'Add a friend before sending a play invitation.': ['เพิ่มเพื่อนก่อนส่งคำเชิญเล่นกีฬา', '请先添加好友，再发送运动邀请。', 'プレーに招待する前に友達を追加してください。'], 'You can only invite an accepted friend to your own court queue.': ['เชิญได้เฉพาะเพื่อนที่ตอบรับแล้วให้เข้าร่วมคิวสนามของคุณ', '只能邀请已接受好友请求的好友参加您自己的球场预约。', '承認済みの友達だけを自分のコート予約に招待できます。'], 'This friend has already been invited.': ['คุณส่งคำเชิญให้เพื่อนคนนี้แล้ว', '已邀请过这位好友。', 'この友達はすでに招待済みです。'], 'Friend request declined.': ['ปฏิเสธคำขอเป็นเพื่อนแล้ว', '已拒绝好友请求。', '友達リクエストを拒否しました。'], 'Pending': ['รอดำเนินการ', '待处理', '保留中'], 'Accepted': ['ตอบรับแล้ว', '已接受', '承認済み'], 'Declined': ['ปฏิเสธแล้ว', '已拒绝', '拒否済み'], 'Sent': ['ส่งแล้ว', '已发送', '送信済み'], 'Friend booked': ['เพื่อนจอง', '好友已预约', '友達が予約済み'], 'Social play': ['เล่นกีฬากับเพื่อน', '好友一起运动', '友達とプレー'], 'Court bookings your friends have invited you to join': ['คิวสนามที่เพื่อนชวนคุณเข้าร่วม', '好友邀请您参加的球场预约', '友達から参加に誘われたコート予約'], 'Friend request is no longer pending.': ['คำขอเป็นเพื่อนไม่อยู่ในสถานะรอดำเนินการแล้ว', '好友请求已不再等待处理。', '友達リクエストは保留中ではありません。'],
  'Court queue': ['คิวสนาม', '球场预约', 'コート予約'], 'Pick a start and end time. Each booking is at least 30 minutes.': ['เลือกเวลาเริ่มต้นและสิ้นสุด การจองแต่ละครั้งต้องมีอย่างน้อย 30 นาที', '选择开始和结束时间。每次预约至少 30 分钟。', '開始時刻と終了時刻を選択してください。予約は30分以上必要です。'],
  'Start time': ['เวลาเริ่มต้น', '开始时间', '開始時刻'], 'End time': ['เวลาสิ้นสุด', '结束时间', '終了時刻'],
  'Court hours are 7:00 AM–9:00 PM. A time cannot overlap another queue on this court.': ['สนามเปิด 7:00–21:00 น. เวลาไม่สามารถทับซ้อนกับคิวอื่นในสนามนี้ได้', '球场开放时间为 7:00–21:00。所选时间不能与此球场的其他预约重叠。', 'コート利用時間は7:00〜21:00です。同じコートの他の予約と重複できません。'],
  'Cancel': ['ยกเลิก', '取消', 'キャンセル'], 'Book this time': ['จองเวลานี้', '预约此时段', 'この時間を予約'], 'Keep booking': ['เก็บการจองไว้', '保留预约', '予約を維持'],
  'Cancel reservation': ['ยกเลิกการจอง', '取消预约', '予約をキャンセル'], 'Receive date': ['วันที่รับอุปกรณ์', '领取日期', '受け取り日'], 'Receive time': ['เวลารับอุปกรณ์', '领取时间', '受け取り時刻'],
  'Reserve equipment': ['จองอุปกรณ์', '预约器材', '用具を予約'], 'Close': ['ปิด', '关闭', '閉じる'], 'Reservation status for': ['สถานะการจองวันที่', '预约状态：', '予約状況：'],
  'Queue details': ['รายละเอียดคิว', '预约详情', '予約の詳細'], 'Keep queue': ['เก็บคิวไว้', '保留预约', '予約を維持'], 'Delete queue': ['ลบคิว', '删除预约', '予約を削除'],
  'Staff equipment control': ['จัดการอุปกรณ์โดยเจ้าหน้าที่', '工作人员器材管理', 'スタッフ用具管理'],
  'Update its status or record when a reservation was actually collected.': ['อัปเดตสถานะหรือบันทึกเวลาที่มารับอุปกรณ์จริง', '更新状态或记录实际领取预约的时间。', '状態を更新するか、実際に受け取った時刻を記録します。'],
  'Current status ·': ['สถานะปัจจุบัน ·', '当前状态 ·', '現在の状態 ·'], 'Set status': ['ตั้งสถานะ', '设置状态', '状態を設定'],
  'Idle · available / returned': ['ว่าง · พร้อมใช้ / ส่งคืนแล้ว', '空闲 · 可用 / 已归还', '空き · 利用可能 / 返却済み'],
  'Booked · assign a user': ['จองแล้ว · เลือกผู้ใช้', '已预约 · 指定用户', '予約済み · ユーザーを指定'],
  'Broken · unavailable': ['ชำรุด · ไม่พร้อมใช้', '损坏 · 不可用', '故障 · 利用不可'], 'Reserved for': ['จองให้', '预约用户', '予約者'],
  'Park member': ['สมาชิกสวน', '公园用户', '公園メンバー'], 'Scheduled pickup date': ['วันที่นัดรับ', '计划领取日期', '受け取り予定日'],
  'Scheduled pickup time': ['เวลานัดรับ', '计划领取时间', '受け取り予定時刻'], 'Actual pickup time': ['เวลารับจริง', '实际领取时间', '実際の受け取り時刻'],
  'Enter the time they arrived, whether early or late. Leave blank while awaiting pickup.': ['ระบุเวลาที่มาถึงจริง ไม่ว่าจะก่อนหรือหลังเวลานัด เว้นว่างไว้หากยังไม่มารับ', '填写实际到达时间，无论提前还是延后。尚未领取时请留空。', '予定より早い・遅いにかかわらず、実際に到着した時刻を入力してください。受け取り待ちの場合は空欄にします。'],
  'Save status': ['บันทึกสถานะ', '保存状态', '状態を保存'], 'Setting Idle releases today’s booking. Setting Broken removes reservations for this item.': ['ตั้งเป็นว่างจะยกเลิกการจองของวันนี้ การตั้งเป็นชำรุดจะลบการจองอุปกรณ์ชิ้นนี้', '设为空闲会释放今日预约。设为损坏会移除此器材的预约。', '空きにすると本日の予約が解除され、故障にするとこの用具の予約が削除されます。'],
  'Staff action': ['การดำเนินการของเจ้าหน้าที่', '工作人员操作', 'スタッフ操作'], 'Release this court queue?': ['ปล่อยคิวสนามนี้หรือไม่?', '确定释放此球场预约？', 'このコートの予約を解除しますか？'],
  'Release queue': ['ปล่อยคิว', '释放预约', '予約を解除'], 'Confirm deletion': ['ยืนยันการลบ', '确认删除', '削除の確認'], 'Go back': ['ย้อนกลับ', '返回', '戻る'],
  'Manage account': ['จัดการบัญชี', '管理账户', 'アカウントを管理'], 'New park user': ['ผู้ใช้สวนรายใหม่', '新增公园用户', '新しい公園ユーザー'],
  'User details': ['รายละเอียดผู้ใช้', '用户详情', 'ユーザー詳細'], 'Add a user': ['เพิ่มผู้ใช้', '添加用户', 'ユーザーを追加'],
  'Update account details or access.': ['อัปเดตรายละเอียดบัญชีหรือสิทธิ์', '更新账户信息或权限。', 'アカウント情報や権限を更新します。'],
  'Create username and password credentials.': ['สร้างชื่อผู้ใช้และรหัสผ่าน', '创建用户名和密码。', 'ユーザー名とパスワードを作成します。'],
  'The head account is protected from administrator changes.': ['บัญชีหัวหน้าผู้ดูแลได้รับการป้องกันจากการเปลี่ยนแปลงโดยผู้ดูแลระบบ', '主管账户受到保护，管理员无法更改。', 'ヘッドアカウントは管理者による変更から保護されています。'],
  'New password (leave blank to keep current)': ['รหัสผ่านใหม่ (เว้นว่างเพื่อใช้รหัสผ่านเดิม)', '新密码（留空则保留当前密码）', '新しいパスワード（現在のものを使う場合は空欄）'],
  'Access level': ['ระดับสิทธิ์', '访问级别', 'アクセスレベル'], 'Delete user': ['ลบผู้ใช้', '删除用户', 'ユーザーを削除'], 'Save changes': ['บันทึกการเปลี่ยนแปลง', '保存更改', '変更を保存'], 'Their account and demo bookings will be removed from this browser.': ['บัญชีและรายการจองตัวอย่างของผู้ใช้จะถูกลบออกจากเบราว์เซอร์นี้', '此用户的账户和演示预约将从此浏览器中删除。', 'このユーザーのアカウントとデモ予約は、このブラウザーから削除されます。'],
  'Username: at least 8 characters and one English letter. Password: at least 8 characters with uppercase, lowercase, and a number.': ['ชื่อผู้ใช้: อย่างน้อย 8 ตัวอักษรและมีตัวอักษรภาษาอังกฤษ รหัสผ่าน: อย่างน้อย 8 ตัวอักษรและมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข', '用户名：至少 8 个字符并包含英文字母。密码：至少 8 个字符，并包含大写字母、小写字母和数字。', 'ユーザー名：8文字以上で英字を含めてください。パスワード：8文字以上で大文字・小文字・数字を含めてください。'],
  'Hide': ['ซ่อน', '隐藏', '非表示'], 'Show': ['แสดง', '显示', '表示'], 'Notifications': ['การแจ้งเตือน', '通知', '通知'], 'Main navigation': ['เมนูหลัก', '主导航', 'メインナビゲーション'], 'Admin': ['ผู้ดูแล', '管理员', '管理者'], 'Telephone': ['โทรศัพท์', '电话', '電話'],
  'That username and password combination could not be found.': ['ไม่พบชื่อผู้ใช้และรหัสผ่านคู่นี้', '找不到此用户名和密码组合。', 'ユーザー名とパスワードの組み合わせが見つかりません。'],
  'Use at least 8 characters and include an English letter.': ['ใช้ตัวอักษรอย่างน้อย 8 ตัว และมีตัวอักษรภาษาอังกฤษ', '至少使用 8 个字符，并包含英文字母。', '8文字以上で、英字を含めてください。'],
  'That username is already registered. Choose another.': ['ชื่อผู้ใช้นี้มีผู้ใช้แล้ว โปรดเลือกชื่ออื่น', '此用户名已注册，请选择其他用户名。', 'このユーザー名はすでに登録されています。別の名前を選んでください。'],
  'Use at least 8 characters, including uppercase, lowercase, and a number.': ['ใช้ตัวอักษรอย่างน้อย 8 ตัว โดยมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข', '至少使用 8 个字符，并包含大写字母、小写字母和数字。', '8文字以上で、大文字・小文字・数字を含めてください。'],
  'Enter a valid telephone number or leave this field blank.': ['กรอกหมายเลขโทรศัพท์ที่ถูกต้องหรือเว้นช่องนี้ว่างไว้', '请输入有效的电话号码，或将此字段留空。', '有効な電話番号を入力するか、この欄を空欄にしてください。'],
  'Log in before making a queue.': ['เข้าสู่ระบบก่อนจองคิว', '请先登录再预约。', '予約する前にログインしてください。'],
  'Log in before reserving equipment.': ['เข้าสู่ระบบก่อนจองอุปกรณ์', '请先登录再预约器材。', '用具を予約する前にログインしてください。'],
  'Choose today or a future date.': ['เลือกวันนี้หรือวันในอนาคต', '请选择今天或之后的日期。', '今日以降の日付を選択してください。'],
  'This court is out of service. Choose another court.': ['สนามนี้งดให้บริการ โปรดเลือกสนามอื่น', '此球场暂停服务，请选择其他球场。', 'このコートは利用停止中です。別のコートを選択してください。'],
  'Choose a valid time between 7:00 AM and 9:00 PM.': ['เลือกเวลาที่ถูกต้องระหว่าง 7:00–21:00 น.', '请选择 7:00 至 21:00 之间的有效时间。', '7:00〜21:00の有効な時刻を選択してください。'],
  'That start time has already passed. Choose a future time.': ['เวลาเริ่มต้นนี้ผ่านไปแล้ว โปรดเลือกเวลาในอนาคต', '此开始时间已过，请选择之后的时间。', '開始時刻を過ぎています。これからの時刻を選択してください。'],
  'That time overlaps another queue. Please choose a different time.': ['เวลานี้ทับซ้อนกับคิวอื่น โปรดเลือกเวลาอื่น', '此时段与其他预约重叠，请选择其他时间。', 'この時間は他の予約と重複しています。別の時間を選択してください。'],
  'This item is available. Choose when you would like to pick it up.': ['อุปกรณ์ชิ้นนี้พร้อมใช้งาน เลือกเวลาที่ต้องการรับได้', '此器材可用，请选择领取时间。', 'この用具は利用可能です。受け取りたい時間を選択してください。'],
  'This item is currently booked by another park user.': ['อุปกรณ์ชิ้นนี้ถูกจองโดยผู้ใช้อื่นแล้ว', '此器材目前已被其他公园用户预约。', 'この用具は他の利用者が予約しています。'],
  'This item has been reported broken and cannot be reserved.': ['มีการแจ้งว่าอุปกรณ์ชิ้นนี้ชำรุดและไม่สามารถจองได้', '此器材已报告损坏，无法预约。', 'この用具は故障が報告されており、予約できません。'],
  'That pickup time has passed. Choose a future time.': ['เวลารับนี้ผ่านไปแล้ว โปรดเลือกเวลาในอนาคต', '此领取时间已过，请选择之后的时间。', '受け取り時刻を過ぎています。これからの時間を選択してください。'],
  'That equipment is already reserved for this date.': ['อุปกรณ์นี้ถูกจองในวันที่เลือกแล้ว', '此器材在所选日期已被预约。', '選択した日付はこの用具がすでに予約されています。'],
  'Equipment item could not be found.': ['ไม่พบอุปกรณ์ชิ้นนี้', '找不到此器材。', 'この用具が見つかりません。'],
  'Choose a valid account for this reservation.': ['เลือกบัญชีที่ถูกต้องสำหรับการจองนี้', '请选择此预约的有效账户。', 'この予約に有効なアカウントを選択してください。'],
  'Choose a valid pickup date and time during park hours.': ['เลือกวันที่และเวลารับที่ถูกต้องในช่วงเวลาเปิดสวน', '请选择公园开放时间内有效的领取日期和时间。', '公園の開園時間内で有効な受け取り日時を選択してください。'],
  'Actual pickup time must be between 5:00 AM and 9:00 PM.': ['เวลารับจริงต้องอยู่ระหว่าง 5:00–21:00 น.', '实际领取时间必须在 5:00 至 21:00 之间。', '実際の受け取り時刻は5:00〜21:00の間で指定してください。'],
  'This account cannot be deleted.': ['ไม่สามารถลบบัญชีนี้ได้', '无法删除此账户。', 'このアカウントは削除できません。'],
  'Only the head account can change this account.': ['เฉพาะบัญชีหัวหน้าผู้ดูแลเท่านั้นที่เปลี่ยนบัญชีนี้ได้', '只有主管账户可以更改此账户。', 'このアカウントを変更できるのはヘッドアカウントのみです。'],
  'Password needs 8+ characters, uppercase, lowercase, and a number.': ['รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร โดยมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข', '密码至少需要 8 个字符，并包含大写字母、小写字母和数字。', 'パスワードは8文字以上で、大文字・小文字・数字を含めてください。'],
  'That username is already in use.': ['ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', '此用户名已被使用。', 'このユーザー名はすでに使用されています。'],
  'This page is only available to park administrators.': ['หน้านี้สำหรับผู้ดูแลสวนเท่านั้น', '此页面仅供公园管理员使用。', 'このページは公園管理者のみ利用できます。'],
  'All courts are currently out of service.': ['ขณะนี้สนามทั้งหมดงดให้บริการ', '目前所有球场均暂停服务。', '現在、すべてのコートが利用停止中です。'],
  'You’re all caught up.': ['ไม่มีการแจ้งเตือนใหม่', '目前没有新通知。', '新しい通知はありません。'], 'You have logged out.': ['คุณออกจากระบบแล้ว', '您已退出登录。', 'ログアウトしました。'],
  'Your court queue was deleted.': ['ลบคิวสนามของคุณแล้ว', '您的球场预约已删除。', 'コートの予約を削除しました。'], 'Your equipment reservation was cancelled.': ['ยกเลิกการจองอุปกรณ์ของคุณแล้ว', '您的器材预约已取消。', '用具の予約をキャンセルしました。'],
  'Court marked out of service.': ['ตั้งสนามเป็นงดให้บริการแล้ว', '球场已设为暂停服务。', 'コートを利用停止にしました。'], 'Court reopened.': ['เปิดสนามให้บริการอีกครั้งแล้ว', '球场已重新开放。', 'コートを再開しました。'],
  'Court queue released.': ['ปล่อยคิวสนามแล้ว', '球场预约已释放。', 'コートの予約を解除しました。'], 'Court queue confirmed.': ['ยืนยันคิวสนามแล้ว', '球场预约已确认。', 'コートの予約が確定しました。'],
  'Equipment reserved.': ['จองอุปกรณ์แล้ว', '器材预约成功。', '用具を予約しました。'], 'Reservation and pickup details saved.': ['บันทึกรายละเอียดการจองและรับอุปกรณ์แล้ว', '预约和领取信息已保存。', '予約と受け取りの詳細を保存しました。'],
  'Equipment marked broken; reservations released.': ['ตั้งอุปกรณ์เป็นชำรุดและยกเลิกการจองแล้ว', '器材已标记为损坏，相关预约已释放。', '用具を故障に設定し、予約を解除しました。'],
  'Equipment marked available; today’s reservation released.': ['ตั้งอุปกรณ์เป็นพร้อมใช้และยกเลิกการจองวันนี้แล้ว', '器材已设为可用，今日预约已释放。', '用具を利用可能にし、本日の予約を解除しました。'],
  'Your account is ready.': ['บัญชีของคุณพร้อมใช้งานแล้ว', '您的账户已创建。', 'アカウントの準備ができました。'], 'Username updated.': ['อัปเดตชื่อผู้ใช้แล้ว', '用户名已更新。', 'ユーザー名を更新しました。'],
  'User updated.': ['อัปเดตผู้ใช้แล้ว', '用户已更新。', 'ユーザーを更新しました。'], 'User added.': ['เพิ่มผู้ใช้แล้ว', '用户已添加。', 'ユーザーを追加しました。'], 'User deleted.': ['ลบผู้ใช้แล้ว', '用户已删除。', 'ユーザーを削除しました。'],
  'Head account': ['บัญชีหัวหน้าผู้ดูแล', '主管账户', 'ヘッドアカウント'], 'Administrator': ['ผู้ดูแลระบบ', '管理员', '管理者'],
  'Basketball': ['บาสเกตบอล', '篮球', 'バスケットボール'], 'Table tennis': ['ปิงปอง', '乒乓球', '卓球'], 'Football': ['ฟุตบอล', '足球', 'サッカー'], 'Badminton': ['แบดมินตัน', '羽毛球', 'バドミントン'], 'Table tennis racket': ['ไม้ปิงปอง', '乒乓球拍', '卓球ラケット'], 'Badminton racket': ['ไม้แบดมินตัน', '羽毛球拍', 'バドミントンラケット'],
  'Outdoor courts · 4 half-courts': ['สนามกลางแจ้ง · 4 สนามครึ่ง', '室外球场 · 4 个半场', '屋外コート · ハーフコート4面'],
  'Five-a-side courts · 4 pitches': ['สนามฟุตบอล 5 คน · 4 สนาม', '五人制球场 · 4 个场地', '5人制コート · 4面'],
  'Table tennis tables · 3 tables': ['โต๊ะปิงปอง · 3 โต๊ะ', '乒乓球台 · 3 张', '卓球台 · 3台'],
  'Outdoor courts · 4 courts': ['สนามกลางแจ้ง · 4 สนาม', '室外球场 · 4 个球场', '屋外コート · 4面'],
  'A friend has booked this item.': ['เพื่อนจองอุปกรณ์ชิ้นนี้แล้ว', '好友已预约此器材。', '友達がこの用具を予約しました。'],
  'No account was found with that username.': ['ไม่พบบัญชีที่ใช้ชื่อผู้ใช้นี้', '找不到此用户名对应的账户。', 'そのユーザー名のアカウントが見つかりません。'],
  'Friend not found.': ['ไม่พบเพื่อน', '未找到好友。', '友達が見つかりません。'],
  'Friend relationship not found.': ['ไม่พบความสัมพันธ์ของเพื่อน', '未找到好友关系。', '友達関係が見つかりません。'],
  'You can only invite friends to your own court queue.': ['เชิญเพื่อนได้เฉพาะคิวสนามของคุณเอง', '只能邀请好友参加您自己的球场预约。', '自分のコート予約にのみ友達を招待できます。'],
  'You can only invite an accepted friend.': ['เชิญได้เฉพาะเพื่อนที่ตอบรับแล้ว', '只能邀请已接受好友请求的用户。', '承認済みの友達だけを招待できます。'],
};
const sortedTranslationKeys = Object.keys(uiTranslations).sort((a, b) => b.length - a.length);
function translateText(value) {
  const locale = state?.locale || data?.locale || 'en';
  if (locale === 'en' || !value) return value;
  const index = locale === 'th' ? 0 : locale === 'zh' ? 1 : 2;
  let result = String(value);
  const equipmentOrCourt = result.match(/^(Basketball|Football|Table tennis|Badminton) (equipment|court)$/);
  if (equipmentOrCourt) {
    const sportLabel = translateText(equipmentOrCourt[1]);
    const suffix = equipmentOrCourt[2] === 'court' ? (locale === 'th' ? 'สนาม' : locale === 'zh' ? '球场' : 'コート') : (locale === 'th' ? 'อุปกรณ์' : locale === 'zh' ? '器材' : '用具');
    return locale === 'zh' && equipmentOrCourt[2] === 'equipment' ? `${sportLabel}${suffix}` : equipmentOrCourt[2] === 'court' ? `${sportLabel} ${suffix}` : `${suffix}${sportLabel}`;
  }
  const welcomeMatch = result.match(/^Welcome, (.+)\.$/);
  if (welcomeMatch) return locale === 'th' ? `ยินดีต้อนรับ ${welcomeMatch[1]}` : locale === 'zh' ? `欢迎，${welcomeMatch[1]}。` : `ようこそ、${welcomeMatch[1]}。`;
  const passwordAction = result.match(/^(Hide|Show) password for (.+)$/);
  if (passwordAction) return locale === 'th' ? `${passwordAction[1] === 'Hide' ? 'ซ่อน' : 'แสดง'}รหัสผ่านของ ${passwordAction[2]}` : locale === 'zh' ? `${passwordAction[1] === 'Hide' ? '隐藏' : '显示'}密码：${passwordAction[2]}` : `${passwordAction[1] === 'Hide' ? '非表示' : '表示'}パスワード：${passwordAction[2]}`;
  const deleteMatch = result.match(/^Delete (.+)\?$/);
  if (deleteMatch) return locale === 'th' ? `ลบ ${deleteMatch[1]} หรือไม่?` : locale === 'zh' ? `确定删除 ${deleteMatch[1]}？` : `${deleteMatch[1]}を削除しますか？`;
  const dynamicRules = locale === 'th' ? [
    [/^(\d+) courts?$/, '$1 สนาม'], [/^(\d+) booked time(?:s)? on (.+)$/, '$1 ช่วงเวลาที่จองในวันที่ $2'], [/^(\d+) queues? · (.+)$/, '$1 คิว · $2'],
    [/^(\d+) pieces$/, '$1 ชิ้น'], [/^(\d+) items$/, '$1 ชิ้น'], [/^(\d+)% open$/, 'ว่าง $1%'], [/^(\d+) booked$/, 'จองแล้ว $1'],
    [/^of (\d+) pieces$/, 'จากทั้งหมด $1 ชิ้น'], [/^(\d+) booked for today$/, 'วันนี้จองแล้ว $1 ชิ้น'],
  ] : locale === 'zh' ? [
    [/^(\d+) courts?$/, '$1 个球场'], [/^(\d+) booked time(?:s)? on (.+)$/, '$2 已预约 $1 个时段'], [/^(\d+) queues? · (.+)$/, '$1 个预约 · $2'],
    [/^(\d+) pieces$/, '$1 件'], [/^(\d+) items$/, '$1 件'], [/^(\d+)% open$/, '空闲 $1%'], [/^(\d+) booked$/, '已预约 $1'],
    [/^of (\d+) pieces$/, '共 $1 件'], [/^(\d+) booked for today$/, '今日已预约 $1 件'],
  ] : [
    [/^(\d+) courts?$/, '$1面'], [/^(\d+) booked time(?:s)? on (.+)$/, '$2に$1件予約'], [/^(\d+) queues? · (.+)$/, '$1件の予約 · $2'],
    [/^(\d+) pieces$/, '$1点'], [/^(\d+) items$/, '$1点'], [/^(\d+)% open$/, '空き $1%'], [/^(\d+) booked$/, '$1件予約'],
    [/^of (\d+) pieces$/, '全$1点'], [/^(\d+) booked for today$/, '本日$1点予約済み'],
  ];
  for (const [pattern, replacement] of dynamicRules) if (pattern.test(result)) return result.replace(pattern, replacement);
  const dynamicText = locale === 'th' ? [
    [/^You have reserved this item for (.+) on (.+)\.$/, 'คุณจองอุปกรณ์ชิ้นนี้ไว้เวลา $1 วันที่ $2'], [/^This item is (.+) and cannot be reserved\.$/, 'อุปกรณ์ชิ้นนี้$1 และไม่สามารถจองได้'],
    [/^(\d+) queued$/, 'มีคิว $1'], [/^Current status · (.+)$/, 'สถานะปัจจุบัน · $1'], [/^Reservation status for (.+)\.$/, 'สถานะการจองวันที่ $1'], [/^(Hide|Show) password for (.+)$/, '$1รหัสผ่านของ $2'], [/^Delete (.+)\?$/, 'ลบ $1 หรือไม่?'],
  ] : locale === 'zh' ? [
    [/^You have reserved this item for (.+) on (.+)\.$/, '您已预约此器材，领取时间为 $1，日期为 $2。'], [/^This item is (.+) and cannot be reserved\.$/, '此器材$1，无法预约。'],
    [/^(\d+) queued$/, '$1 个预约'], [/^Current status · (.+)$/, '当前状态 · $1'], [/^Reservation status for (.+)\.$/, '预约日期：$1'], [/^(Hide|Show) password for (.+)$/, '$1密码：$2'], [/^Delete (.+)\?$/, '确定删除 $1？'],
  ] : [
    [/^You have reserved this item for (.+) on (.+)\.$/, 'この用具は$2の$1に予約済みです。'], [/^This item is (.+) and cannot be reserved\.$/, 'この用具は$1のため予約できません。'],
    [/^(\d+) queued$/, '$1件予約'], [/^Current status · (.+)$/, '現在の状態 · $1'], [/^Reservation status for (.+)\.$/, '予約日：$1'], [/^(Hide|Show) password for (.+)$/, '$1パスワード：$2'], [/^Delete (.+)\?$/, '$1を削除しますか？'],
  ];
  for (const [pattern, replacement] of dynamicText) if (pattern.test(result)) return translateText(result.replace(pattern, replacement));
  for (const source of sortedTranslationKeys) result = result.replaceAll(source, uiTranslations[source][index]);
  const re = (pattern, replacement) => { result = result.replace(pattern, replacement); };
  if (locale === 'th') {
    re(/^(\d+) courts?$/, '$1 สนาม'); re(/^(\d+) booked time(?:s)? on (.+)$/, '$1 ช่วงเวลาที่จองในวันที่ $2'); re(/^(\d+) queues? · (.+)$/, '$1 คิว · $2');
    re(/^(\d+) pieces$/, '$1 ชิ้น'); re(/^(\d+) items$/, '$1 ชิ้น'); re(/^(\d+)% open$/, 'ว่าง $1%'); re(/^(\d+) booked$/, 'จองแล้ว $1');
    re(/^Serial · (.+)$/, 'หมายเลข · $1'); re(/^Pickup at (.+)$/, 'รับอุปกรณ์เวลา $1'); re(/^Picked up (.+)$/, 'รับแล้วเวลา $1'); re(/^Awaiting pickup · (.+)$/, 'รอรับอุปกรณ์ · $1');
    re(/^(.+) equipment · (.+)$/, 'อุปกรณ์$1 · $2'); re(/^(.+) · Court (\d+)$/, '$1 · สนาม $2'); re(/^Welcome, (.+)\.$/, 'ยินดีต้อนรับ $1');
  } else if (locale === 'zh') {
    re(/^(\d+) courts?$/, '$1 个球场'); re(/^(\d+) booked time(?:s)? on (.+)$/, '$2 已预约 $1 个时段'); re(/^(\d+) queues? · (.+)$/, '$1 个预约 · $2');
    re(/^(\d+) pieces$/, '$1 件'); re(/^(\d+) items$/, '$1 件'); re(/^(\d+)% open$/, '空闲 $1%'); re(/^(\d+) booked$/, '已预约 $1');
    re(/^Serial · (.+)$/, '编号 · $1'); re(/^Pickup at (.+)$/, '领取时间 $1'); re(/^Picked up (.+)$/, '已领取 $1'); re(/^Awaiting pickup · (.+)$/, '等待领取 · $1');
    re(/^(.+) equipment · (.+)$/, '$1 器材 · $2'); re(/^(.+) · Court (\d+)$/, '$1 · 球场 $2'); re(/^Welcome, (.+)\.$/, '欢迎，$1。');
  } else {
    re(/^(\d+) courts?$/, '$1面'); re(/^(\d+) booked time(?:s)? on (.+)$/, '$2に$1件予約'); re(/^(\d+) queues? · (.+)$/, '$1件の予約 · $2');
    re(/^(\d+) pieces$/, '$1点'); re(/^(\d+) items$/, '$1点'); re(/^(\d+)% open$/, '空き $1%'); re(/^(\d+) booked$/, '$1件予約');
    re(/^Serial · (.+)$/, '番号 · $1'); re(/^Pickup at (.+)$/, '受け取り $1'); re(/^Picked up (.+)$/, '$1に受け取り済み'); re(/^Awaiting pickup · (.+)$/, '受け取り待ち · $1');
    re(/^(.+) equipment · (.+)$/, '$1の用具 · $2'); re(/^(.+) · Court (\d+)$/, '$1 · コート $2'); re(/^Welcome, (.+)\.$/, 'ようこそ、$1。');
  }
  return result;
}
function translateUI(root = document.body) {
  if (!root || typeof state === 'undefined') return;
  const locale = state.locale || 'en';
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('[data-no-translate],.password-cell,.profile-name')) continue;
    node.nodeValue = translateText(node.nodeValue);
  }
  const elements = root.matches?.('[placeholder],[aria-label],[title],[alt]') ? [root, ...$$('[placeholder],[aria-label],[title],[alt]', root)] : $$('[placeholder],[aria-label],[title],[alt]', root);
  for (const element of elements) {
    if (element.hasAttribute('data-no-translate')) continue;
    for (const attr of ['placeholder','aria-label','title','alt']) if (element.hasAttribute(attr) && !element.hasAttribute(`data-no-translate-${attr}`)) element.setAttribute(attr, translateText(element.getAttribute(attr)));
  }
}

const sports = [
  { id: 'basketball', label: 'Basketball', prefix: 'BAS', icon: '🏀', courts: 4, equipment: 'Basketball', descriptor: 'Outdoor courts · 4 half-courts' },
  { id: 'football', label: 'Football', prefix: 'FOO', icon: '⚽', courts: 4, equipment: 'Football', descriptor: 'Five-a-side courts · 4 pitches' },
  { id: 'table-tennis', label: 'Table tennis', prefix: 'TAB', icon: '🏓', courts: 3, equipment: 'Table tennis racket', descriptor: 'Table tennis tables · 3 tables' },
  { id: 'badminton', label: 'Badminton', prefix: 'BAD', icon: '🏸', courts: 4, equipment: 'Badminton racket', descriptor: 'Outdoor courts · 4 courts' },
];

const routeNames = {
  home: 'Home', courts: 'Book a court', courtDetail: 'Court schedule', equipment: 'Equipment', equipmentDetail: 'Equipment availability',
  friends: 'Friends', settings: 'Settings', parkAdmin: 'Court & equipment admin', adminUsers: 'User administration', login: 'Log in', register: 'Create account',
};

const iconPaths = {
  leaf: '<path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 11-6 9-16Z"/><path d="M4 21c3-5 7-8 12-11"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  court: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h4a4 4 0 0 0 0-8m10 16a4 4 0 0 1 0-8h4"/>',
  equipment: '<path d="M6 3v7m0 4v7M18 3v7m0 4v7M3 10h6v4H3zm12 0h6v4h-6z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.8Z" transform="translate(-2 -2) scale(1.16)"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.8M6.2 6.2C3.4 8 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/>',
  logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const localDate = (iso) => { const [y,m,d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const dateLabel = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => localDate(iso).toLocaleDateString(languageLocales[typeof data === 'undefined' ? 'en' : data.locale || 'en'], opts);
const timeText = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return new Date(2000, 0, 1, h, m).toLocaleTimeString(languageLocales[typeof data === 'undefined' ? 'en' : data.locale || 'en'], { hour: 'numeric', minute: '2-digit' }); };
const timeOptions = (from = 7 * 60, to = 21 * 60) => Array.from({ length: (to - from) / 30 + 1 }, (_, i) => from + i * 30);
const roleName = role => role === 'head' ? 'Head account' : role === 'admin' ? 'Administrator' : 'Park member';
const initials = name => (name || 'G').slice(0, 2).toUpperCase();
const sportById = id => sports.find(s => s.id === id) || sports[0];
const protectedRoutes = new Set(['courts','courtDetail','equipment','equipmentDetail','friends']);

function initialData() {
  const seededUsers = [
    { username: 'admin001', password: '12345678', phone: '', role: 'admin' },
    { username: 'headaccount001', password: 'RVKs2551', phone: '', role: 'head' },
  ];
  const existing = (() => {
    try {
      if (backendConfigured) return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || 'null');
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch { return null; }
  })();
  if (backendConfigured) {
    return { users: [], currentUser: null, theme: existing?.theme || 'system', locale: ['en','th','zh','ja'].includes(existing?.locale) ? existing.locale : 'en', courtBookings: [], equipmentBookings: [], equipmentOverrides: {}, courtMaintenance: {}, friends: [], friendRequests: [], playInvites: [], friendships: [] };
  }
  if (existing && Array.isArray(existing.users) && existing.users.some(u => u.role === 'head')) {
    const users = existing.users;
    if (!users.some(u => u.role === 'admin')) users.unshift(seededUsers[0]);
    return { users, currentUser: existing.currentUser || null, theme: existing.theme || 'system', locale: ['en','th','zh','ja'].includes(existing.locale) ? existing.locale : 'en', courtBookings: existing.courtBookings || [], equipmentBookings: existing.equipmentBookings || [], equipmentOverrides: existing.equipmentOverrides || {}, courtMaintenance: existing.courtMaintenance || {}, friends: [], friendRequests: [], playInvites: existing.playInvites || [], friendships: existing.friendships || [] };
  }
  return {
    users: seededUsers, currentUser: null, theme: 'system', locale: 'en', courtBookings: makeSeedCourts(), equipmentBookings: [], equipmentOverrides: {}, courtMaintenance: {}, friends: [], friendRequests: [], playInvites: [], friendships: [],
  };
}

function makeSeedCourts() {
  const schedules = {
    basketball: [ [[450,540,'somsak'],[660,750,'pimchan']], [[540,630,'niran'],[780,870,'suda']], [[420,480,'ananda'],[900,1020,'kanya']], [[600,690,'wirot'],[810,900,'malee']] ],
    football: [ [[480,600,'prasit'],[780,900,'arun']], [[420,510,'dao'],[660,780,'natt']], [[570,690,'kiet'],[870,990,'suda']], [[690,780,'pimchan'],[900,1020,'niran']] ],
    'table-tennis': [ [[450,510,'ananda'],[660,720,'dao'],[840,900,'kanya']], [[510,570,'somsak'],[750,810,'malee']], [[600,660,'wirot'],[900,960,'arun']] ],
    badminton: [ [[420,510,'suda'],[660,750,'prasit']], [[510,600,'kanya'],[780,900,'dao']], [[600,690,'arun'],[840,930,'malee']], [[450,540,'niran'],[720,810,'pimchan']] ],
  };
  return Object.entries(schedules).flatMap(([sportId, courts]) => courts.flatMap((slots, courtIndex) => slots.map(([start,end,user], i) => ({
    id: `demo-${sportId}-${courtIndex + 1}-${i}`, sportId, court: courtIndex + 1, start, end, user, date: todayISO(), seeded: true,
  }))));
}

const data = initialData();
const state = {
  route: 'home', locale: data.locale || 'en', sportId: 'basketball', equipmentSportId: 'basketball', selectedDate: todayISO(), equipmentDate: todayISO(),
  intendedRoute: 'courts', toastTimer: null, graphPeriod: 'day', graphDate: todayISO(), graphMonth: todayISO().slice(0,7), graphYear: new Date().getFullYear(),
  equipmentFilter: 'all', equipmentSearch: '', userSearch: '', revealedPasswords: new Set(),
  adminTab: 'courts', adminDate: todayISO(), adminSportId: 'basketball', adminEquipmentFilter: 'all', adminEquipmentSearch: '',
};
if (location.hash.startsWith('#')) {
  const candidate = location.hash.slice(1).split('/')[0];
  if (routeNames[candidate] && !['login','register','adminUsers'].includes(candidate)) state.route = candidate;
}

function saveData() {
  if (backendConfigured) {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: data.theme, locale: data.locale }));
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: data.users, currentUser: data.currentUser, theme: data.theme, locale: data.locale, courtBookings: data.courtBookings, equipmentBookings: data.equipmentBookings, equipmentOverrides: data.equipmentOverrides, courtMaintenance: data.courtMaintenance, friendships: data.friendships, playInvites: data.playInvites }));
}
function currentUser() { return data.users.find(u => u.username === data.currentUser) || null; }
function isAdmin() { return ['admin','head'].includes(currentUser()?.role); }
function isHead() { return currentUser()?.role === 'head'; }
function currentFriends() {
  if (backendConfigured) return data.friends || [];
  return (data.friendships || []).filter(row => row.status === 'accepted' && [row.requester,row.target].includes(data.currentUser))
    .map(row => ({ username: row.requester === data.currentUser ? row.target : row.requester }));
}
function currentFriendRequests() {
  if (backendConfigured) return data.friendRequests || [];
  return (data.friendships || []).filter(row => row.status === 'pending' && [row.requester,row.target].includes(data.currentUser))
    .map(row => ({ id: row.id, username: row.requester === data.currentUser ? row.target : row.requester, direction: row.target === data.currentUser ? 'incoming' : 'outgoing' }));
}
function currentPlayInvites() {
  if (backendConfigured) return data.playInvites || [];
  return (data.playInvites || []).filter(row => [row.sender,row.receiver].includes(data.currentUser))
    .map(row => ({ ...row, direction: row.receiver === data.currentUser ? 'incoming' : 'outgoing' }));
}
function isFriendUsername(username) {
  return currentFriends().some(friend => friend.username?.toLowerCase() === String(username || '').toLowerCase());
}
function isFriendBooking(booking) { return Boolean(booking?.isFriend || isFriendUsername(booking?.user)); }
function renameLocalUserReferences(oldName,newName) {
  data.courtBookings.forEach(booking=>{if(booking.user===oldName)booking.user=newName;});
  data.equipmentBookings.forEach(booking=>{if(booking.user===oldName)booking.user=newName;});
  (data.friendships||[]).forEach(row=>{
    if(row.requester===oldName)row.requester=newName;
    if(row.target===oldName)row.target=newName;
    row.id=[row.requester,row.target].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})).join(':');
  });
  (data.playInvites||[]).forEach(invite=>{
    if(invite.sender===oldName)invite.sender=newName;
    if(invite.receiver===oldName)invite.receiver=newName;
  });
}
function removeLocalUserReferences(username) {
  const deletedBookings=new Set(data.courtBookings.filter(booking=>booking.user===username).map(booking=>booking.id));
  data.users=data.users.filter(user=>user.username!==username);
  data.courtBookings=data.courtBookings.filter(booking=>booking.user!==username);
  data.equipmentBookings=data.equipmentBookings.filter(booking=>booking.user!==username);
  data.friendships=(data.friendships||[]).filter(row=>row.requester!==username&&row.target!==username);
  data.playInvites=(data.playInvites||[]).filter(invite=>invite.sender!==username&&invite.receiver!==username&&!deletedBookings.has(invite.bookingId));
}
function usernameLoginEmail(username) {
  const bytes = new TextEncoder().encode(String(username || '').trim().toLowerCase());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const safeName = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `user-${safeName}@park-login.invalid`;
}
function applyRemoteSnapshot(snapshot) {
  data.users = (snapshot.users || []).map(user => ({ ...user, password: '' }));
  data.currentUser = snapshot.currentUser || null;
  data.courtBookings = snapshot.courtBookings || [];
  data.equipmentBookings = snapshot.equipmentBookings || [];
  data.equipmentOverrides = snapshot.equipmentOverrides || {};
  data.courtMaintenance = snapshot.courtMaintenance || {};
  data.friends = snapshot.friends || [];
  data.friendRequests = snapshot.friendRequests || [];
  data.playInvites = snapshot.playInvites || [];
}
async function refreshRemoteState() {
  const { data: snapshot, error } = await backendClient.rpc('park_state_read');
  if (error) throw error;
  applyRemoteSnapshot(snapshot || {});
  backendReady = true;
}
function showBackendError(error) {
  const message = escapeHTML(error?.message || 'The shared database could not be reached.');
  $('#sidebar').innerHTML = '<div class="brand"><div class="brand-mark">' + icon('leaf') + '</div><div><div class="brand-name">Benjakitti Active</div><div class="brand-sub">Park sports, made easier</div></div></div>';
  $('#topbar').innerHTML = '';
  $('#mobileNav').innerHTML = '';
  $('#main').innerHTML = `<section class="auth-card"><div class="eyebrow">Database connection</div><h1 class="auth-title">Could not load park data</h1><p class="auth-copy">${message}</p><p class="form-hint">Check the Supabase URL, publishable key, database SQL setup, and deployed accounts function.</p></section>`;
}
async function initializeApp() {
  if (!backendConfigured) { render(); return; }
  if (!backendClient) { showBackendError(new Error('Supabase JavaScript client did not load. Check your internet connection and reload.')); return; }
  try {
    const { error: sessionError } = await backendClient.auth.getSession();
    if (sessionError) throw sessionError;
    await refreshRemoteState();
    const preferences = (() => {
      try { return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}'); }
      catch { return {}; }
    })();
    data.theme = preferences.theme || data.theme;
    data.locale = ['en','th','zh','ja'].includes(preferences.locale) ? preferences.locale : data.locale;
    state.locale = data.locale;
    render();
    startRemoteRefresh();
  } catch (error) {
    console.error('Shared database initialization failed', error);
    showBackendError(error);
  }
}
async function invokeAccountAction(payload) {
  const { data: result, error } = await backendClient.functions.invoke('accounts', { body: payload });
  if (error) {
    let detail = error.message;
    try { const body = await error.context?.json?.(); if (body?.error) detail = body.error; } catch { /* Use the SDK error text. */ }
    throw new Error(detail);
  }
  if (result?.error) throw new Error(result.error);
  return result;
}
async function remoteRpc(name, args) {
  const { data: result, error } = await backendClient.rpc(name, args);
  if (error) throw error;
  await refreshRemoteState();
  return result;
}
function startRemoteRefresh() {
  setInterval(async () => {
    if (!backendReady || document.hidden || $('#modalRoot').innerHTML.trim()) return;
    if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const before=JSON.stringify([data.currentUser,data.users,data.courtBookings,data.equipmentBookings,data.equipmentOverrides,data.courtMaintenance,data.friends,data.friendRequests,data.playInvites]);
    try {
      await refreshRemoteState();
      const after=JSON.stringify([data.currentUser,data.users,data.courtBookings,data.equipmentBookings,data.equipmentOverrides,data.courtMaintenance,data.friends,data.friendRequests,data.playInvites]);
      if(before!==after) render();
    } catch(error) { console.warn('Could not refresh shared park data',error); }
  },15000);
}
function applyTheme() {
  const dark = data.theme === 'dark' || (data.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark-theme', dark);
}
function navigate(route, options = {}) {
  if (protectedRoutes.has(route) && !currentUser()) {
    state.intendedRoute = route;
    route = 'login';
  }
  if (['adminUsers','parkAdmin'].includes(route) && !isAdmin()) { toast('This page is only available to park administrators.', true); route = currentUser() ? 'home' : 'login'; }
  state.route = route;
  if (options.sportId) state.sportId = options.sportId;
  if (options.equipmentSportId) state.equipmentSportId = options.equipmentSportId;
  if (options.date) state.selectedDate = options.date;
  if (options.equipmentDate) state.equipmentDate = options.equipmentDate;
  if (!['login','register'].includes(route)) { state.loginNotice = ''; state.loginSuccess = ''; }
  render();
  if (options.history !== false) history.pushState({ route, sportId: state.sportId, equipmentSportId: state.equipmentSportId }, '', `#${route}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.addEventListener('popstate', (event) => {
  const route = event.state?.route || location.hash.slice(1) || 'home';
  if (routeNames[route]) { state.route = route; state.sportId = event.state?.sportId || state.sportId; state.equipmentSportId = event.state?.equipmentSportId || state.equipmentSportId; render(); }
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (data.theme === 'system') applyTheme(); });

function toast(message, error = false) {
  const root = $('#toastRoot');
  const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = translateText(message);
  root.append(el); setTimeout(() => el.remove(), 3500);
}
function openModal(markup) { $('#modalRoot').innerHTML = `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true">${markup}</section></div>`; translateUI($('#modalRoot')); }
function closeModal() { $('#modalRoot').innerHTML = ''; }

function navButton(route, label, iconName, active, extra = '') {
  return `<button type="button" class="nav-item ${active ? 'active' : ''} ${extra}" data-nav="${route}">${icon(iconName)}<span>${label}</span>${route === 'adminUsers' && isAdmin() ? '<span class="nav-badge">Admin</span>' : ''}</button>`;
}
function renderNavigation() {
  const active = state.route === 'courtDetail' ? 'courts' : state.route === 'equipmentDetail' ? 'equipment' : state.route;
  const items = [navButton('home','Overview','home',active === 'home'),navButton('courts','Book a court','court',active === 'courts'),navButton('equipment','Equipment','equipment',active === 'equipment'),...(currentUser()?[navButton('friends','Friends','users',active === 'friends')]:[]),navButton('settings','Settings','settings',active === 'settings')];
  const admin = isAdmin() ? `${navButton('parkAdmin','Park management','equipment',active === 'parkAdmin')}${navButton('adminUsers','User administration','users',active === 'adminUsers')}` : '';
  const user = currentUser();
  $('#sidebar').innerHTML = `<div class="brand"><div class="brand-mark">${icon('leaf')}</div><div><div class="brand-name">Benjakitti Active</div><div class="brand-sub">Park sports, made easier</div></div></div>
    <div class="nav-caption">Park menu</div><nav class="nav-list">${items.join('')}${admin}</nav>
    <div class="sidebar-bottom"><div class="park-card"><div class="park-card-label">A little more active</div><div class="park-card-title">Find your time<br>to play.</div><div class="park-card-meta">Live park availability · Bangkok</div></div>
      <div class="profile-row"><div class="avatar">${escapeHTML(initials(user?.username || 'Guest'))}</div><div class="profile-info"><div class="profile-name" data-no-translate>${escapeHTML(user?.username || 'Guest visitor')}</div><div class="profile-role">${escapeHTML(user ? roleName(user.role) : 'Browse as a guest')}</div></div><button class="profile-menu" type="button" aria-label="${user ? 'Log out' : 'Log in'}" data-action="${user ? 'logout' : 'login'}">${icon(user ? 'logout' : 'arrow')}</button></div>
    </div>`;
  $('#mobileNav').innerHTML = `${navButton('home','Home','home',active === 'home')}${navButton('courts','Courts','court',active === 'courts')}${navButton('equipment','Equipment','equipment',active === 'equipment')}${currentUser()?navButton('friends','Friends','users',active === 'friends'):''}${navButton('settings','Settings','settings',active === 'settings')}${isAdmin() ? navButton('parkAdmin','Manage','equipment',active === 'parkAdmin','admin-mobile') : ''}${isAdmin() ? navButton('adminUsers','Users','users',active === 'adminUsers','admin-mobile') : ''}`;
}
function renderTopbar() {
  const user = currentUser();
  $('#topbar').innerHTML = `<div class="breadcrumb">Benjakitti Park <span aria-hidden="true">/</span> <strong>${escapeHTML(routeNames[state.route] || 'Home')}</strong></div><div class="top-actions"><span class="park-status"><i class="status-dot"></i> Park open · 5:00 AM–9:00 PM</span><label class="language-control"><span class="sr-only">Language</span><select class="select-control language-select" id="languageSelect" aria-label="Language"><option value="en" ${state.locale==='en'?'selected':''}>English</option><option value="th" ${state.locale==='th'?'selected':''}>ไทย</option><option value="zh" ${state.locale==='zh'?'selected':''}>中文</option><option value="ja" ${state.locale==='ja'?'selected':''}>日本語</option></select></label><button class="icon-button" type="button" aria-label="Notifications" data-action="notifications">${icon('spark')}</button>${user ? `<button class="icon-button" type="button" aria-label="Account settings" data-nav="settings"><span class="avatar" style="width:25px;height:25px;font-size:9px">${escapeHTML(initials(user.username))}</span></button>` : ''}</div>`;
}

function courtCount() { return sports.reduce((n,s) => n + s.courts, 0); }
function equipmentRecords(sportId) {
  const sport = sportById(sportId);
  return Array.from({ length: 30 }, (_, i) => {
    let initialStatus = 'idle';
    if ([5, 13, 26].includes(i)) initialStatus = 'broken';
    else if ([2, 3, 8, 9, 15, 19, 23].includes(i)) initialStatus = 'others';
    const number = String(i + 1).padStart(3, '0');
    return { id: `${sport.prefix}${number}`, sportId, name: sport.equipment, initialStatus };
  });
}
function equipmentStatus(item, date = state.equipmentDate) {
  const booking = data.equipmentBookings.find(b => b.equipmentId === item.id && b.date === date);
  if (booking) return booking.user === data.currentUser ? 'own' : isFriendBooking(booking) ? 'friend' : 'others';
  const override = data.equipmentOverrides[item.id];
  if (override?.status) return override.status;
  return item.initialStatus;
}
function courtIsClosed(sportId, court) { return Boolean(data.courtMaintenance[`${sportId}-${court}`]); }
function statusText(status) { return ({ idle: 'Idle', others: 'Booked · others', own: 'Booked · you', friend: 'Friend booked (เพื่อนจอง)', broken: 'Broken' })[status] || 'Idle'; }
function dailyEquipmentStats() {
  const all = sports.flatMap(s => equipmentRecords(s.id));
  const counts = { idle: 0, others: 0, own: 0, friend: 0, broken: 0 };
  all.forEach(item => counts[equipmentStatus(item, todayISO())]++);
  return { ...counts, total: all.length, available: counts.idle };
}
function courtDensityNow() {
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  if (mins < 420 || mins > 1260) return 0;
  const active = data.courtBookings.filter(b => b.date === todayISO() && b.start <= mins && b.end > mins).length;
  return Math.min(99, Math.round(active / courtCount() * 100));
}
function myQueue() {
  const dateNow = todayISO();
  const court = data.courtBookings.filter(b => b.user === data.currentUser && b.date >= dateNow).map(b => ({ ...b, kind: 'court' }));
  const equipment = data.equipmentBookings.filter(b => b.user === data.currentUser && b.date >= dateNow).map(b => ({ ...b, kind: 'equipment' }));
  return [...court, ...equipment].sort((a,b) => a.date.localeCompare(b.date) || (a.start ?? a.time) - (b.start ?? b.time));
}
function loadEstimate(date, hour) {
  const day = localDate(date).getDay();
  const evening = Math.max(0, 1 - Math.abs(hour - 18) / 7) * 24;
  const weekend = (day === 0 || day === 6) ? 16 : 0;
  const wave = (Math.sin((localDate(date).getDate() * 2.8) + hour * .79) + 1) * 11;
  return Math.max(9, Math.min(94, Math.round(21 + evening + weekend + wave)));
}
function recommendation() {
  let best = null;
  for (let offset = 1; offset <= 7; offset++) {
    const day = new Date(); day.setDate(day.getDate() + offset);
    const iso = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
    for (let hour = 7; hour <= 19; hour += .5) {
      const endHour = hour + 2;
      const sample = (loadEstimate(iso, hour) + loadEstimate(iso, hour + .75) + loadEstimate(iso, hour + 1.5)) / 3;
      const conflict = data.courtBookings.filter(b => b.date === iso && b.start < endHour * 60 && b.end > hour * 60).length * 4;
      const score = sample + conflict;
      if (!best || score < best.score) best = { date: iso, start: Math.round(hour * 60), end: Math.round(endHour * 60), score };
    }
  }
  return best;
}

function sportSvg(sportId) {
  const tint = { basketball: '#c78347', football: '#eff3e9', 'table-tennis': '#c4d992', badminton: '#d9e7bd' }[sportId];
  const ball = sportId === 'basketball' ? '<circle cx="104" cy="62" r="21" fill="#dd9857"/><path d="M83 62h42M104 41c-10 11-10 31 0 42M89 47c12 7 18 18 22 31M119 47c-12 7-18 18-22 31" fill="none" stroke="#a55f31" stroke-width="2"/>' :
    sportId === 'football' ? '<circle cx="104" cy="62" r="22" fill="#fbfcf8"/><path d="m104 51 8 6-3 10h-10l-3-10Zm0-18v18m21 5-13 1m-16 0-13-1m8 22 8-11m16 11-8-11" fill="none" stroke="#668466" stroke-width="2"/>' :
    sportId === 'table-tennis' ? '<circle cx="99" cy="57" r="15" fill="#d5e7a3"/><path d="M110 68 123 81" stroke="#9b6342" stroke-width="8" stroke-linecap="round"/><path d="M88 42 109 72" stroke="#96b366" stroke-width="1.4"/>' :
    '<ellipse cx="98" cy="55" rx="12" ry="19" transform="rotate(-35 98 55)" fill="#f9fbf2" stroke="#9aac80" stroke-width="2"/><path d="m106 68 14 14M91 39 105 70M106 42 90 68M84 51l29 4" fill="none" stroke="#9aac80" stroke-width="1.4"/><path d="M119 78 130 88" stroke="#a77950" stroke-width="6" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 190 120" role="img" aria-label="${escapeHTML(sportById(sportId).label)} sport illustration"><ellipse cx="95" cy="97" rx="64" ry="9" fill="#d4e2cf"/><rect x="27" y="24" width="136" height="69" rx="8" fill="#c7ddbf"/><rect x="32" y="29" width="126" height="59" rx="5" fill="#7da77b"/><path d="M95 30v57M33 58h125" stroke="#e6f0dd" stroke-width="1.5" fill="none"/><circle cx="95" cy="59" r="14" fill="none" stroke="#e6f0dd" stroke-width="1.5"/><rect x="32" y="43" width="15" height="29" fill="none" stroke="#e6f0dd" stroke-width="1.5"/><rect x="143" y="43" width="15" height="29" fill="none" stroke="#e6f0dd" stroke-width="1.5"/>${ball}</svg>`;
}
function courtSvg(sportId) {
  const field = sportId === 'football' ? '#60966f' : sportId === 'basketball' ? '#a7c584' : '#a9c47d';
  let markings = '<path d="M95 18v88M22 62h146"/><circle cx="95" cy="62" r="21"/>';
  if (sportId === 'basketball') markings += '<rect x="22" y="35" width="23" height="54"/><rect x="145" y="35" width="23" height="54"/><path d="M22 34a36 36 0 0 0 0 56m146-56a36 36 0 0 1 0 56"/>';
  if (sportId === 'football') markings += '<rect x="22" y="34" width="25" height="56"/><rect x="143" y="34" width="25" height="56"/><rect x="22" y="49" width="11" height="26"/><rect x="157" y="49" width="11" height="26"/>';
  if (sportId === 'table-tennis') markings = '<path d="M95 24v76M26 62h138"/><rect x="34" y="34" width="122" height="56" rx="4"/><path d="M95 34v56"/>';
  if (sportId === 'badminton') markings = '<path d="M95 20v84M24 62h142"/><rect x="29" y="30" width="132" height="64"/><path d="M43 30v64m104-64v64"/>';
  return `<svg viewBox="0 0 190 124" role="img" aria-label="${escapeHTML(sportById(sportId).label)} court"><rect x="8" y="8" width="174" height="108" rx="12" fill="#e1eadb"/><rect x="19" y="15" width="152" height="94" rx="7" fill="${field}"/><g fill="none" stroke="#eff5e9" stroke-width="1.3" opacity=".9">${markings}</g><circle cx="25" cy="21" r="2" fill="#fbfff4"/><circle cx="165" cy="103" r="2" fill="#fbfff4"/></svg>`;
}
function equipmentSvg(sportId, index) {
  const hue = ['#d68d50','#c8dba6','#8bb09a','#edcc6a'][index % 4];
  if (sportId === 'basketball' || sportId === 'football') {
    const bg = sportId === 'basketball' ? '#d78c4e' : '#f8faf5';
    const stroke = sportId === 'basketball' ? '#99582f' : '#718570';
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="${bg}" stroke="${stroke}" stroke-width="2"/><path d="M8 32h48M32 8v48M16 15c10 8 17 19 19 34M48 15c-10 8-17 19-19 34" fill="none" stroke="${stroke}" stroke-width="2"/></svg>`;
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="28" cy="25" rx="15" ry="20" transform="rotate(-32 28 25)" fill="#fbfcf8" stroke="#9aa984" stroke-width="2"/><path d="M39 41 54 57" stroke="#aa7950" stroke-width="7" stroke-linecap="round"/><path d="m18 9 18 32M40 14 17 36M11 22l33 3" fill="none" stroke="${hue}" stroke-width="1.6"/></svg>`;
}

function renderHome() {
  const equip = dailyEquipmentStats(), activeDensity = courtDensityNow(), queues = currentUser() ? myQueue() : [], rec = recommendation();
  const user = currentUser();
  const busy = activeDensity > 70 ? 'Busy right now' : activeDensity > 38 ? 'Steady right now' : 'Plenty of room';
  const brokenPct = Math.round(equip.broken / equip.total * 100);
  const queueMarkup = queues.length ? queues.slice(0,4).map(b => {
    const sport = sportById(b.sportId || sports.find(s => b.equipmentId?.startsWith(s.prefix))?.id || 'basketball');
    const title = b.kind === 'court' ? `${sport.label} · Court ${b.court}` : `${sport.label} equipment · ${b.equipmentId}`;
    const time = b.kind === 'court' ? `${timeText(b.start)} – ${timeText(b.end)}` : `Pickup at ${timeText(b.time)}`;
    return `<div class="queue-item"><div class="queue-sport-icon">${sport.icon}</div><div class="queue-info"><div class="queue-name">${escapeHTML(title)}</div><div class="queue-time">${escapeHTML(dateLabel(b.date))} · ${escapeHTML(time)}</div></div><span class="queue-tag">${b.kind === 'court' ? 'Court' : 'Gear'}</span></div>`;
  }).join('') : `<div class="empty-state"><div class="empty-icon">${icon('calendar')}</div><strong>${user ? 'Your queue is clear' : 'Your queue will appear here'}</strong>${user ? 'Book a court or borrow equipment to see your upcoming plans here.' : 'Sign in to make a booking and see your upcoming park plans.'}<br><button class="text-button" style="margin-top:9px" data-nav="${user ? 'courts' : 'login'}">${user ? 'Explore courts' : 'Log in to book'} →</button></div>`;
  const categories = sports.map(s => {
    const count = data.courtBookings.filter(b => b.sportId === s.id && b.date === todayISO()).length;
    const pct = Math.min(88, Math.max(18, Math.round(count / s.courts * 34)));
    return `<div class="category-stat"><div class="category-stat-label"><span>${s.icon}</span><span>${escapeHTML(s.label)}</span></div><div class="progress-track"><div class="progress-fill ${pct < 35 ? 'low' : pct > 70 ? 'high' : ''}" style="width:${pct}%"></div></div><div class="category-stat-value">${Math.round(100-pct)}% open</div></div>`;
  }).join('');
  $('#main').innerHTML = `<section class="hero-banner"><div class="hero-copy"><div class="hero-kicker"><i class="status-dot"></i> A better way to get moving</div><h1>Your next game starts<br>with knowing when.</h1><p>Check live court schedules and equipment availability before you head to the park. Less guesswork, more play.</p><div class="quick-actions"><button class="button button-primary" data-nav="courts">${icon('court')} Book a court</button><button class="button button-outline" data-nav="equipment">${icon('equipment')} Find equipment</button></div></div><div class="hero-illustration">${sportSvg('basketball')}</div></section>
    <div class="metric-grid"><article class="metric-card"><div class="metric-top"><span>Court activity</span><span class="metric-icon">${icon('court')}</span></div><div class="metric-value-row"><span class="metric-value">${activeDensity}%</span><span class="metric-unit">in use right now</span></div><div class="metric-note"><strong>${escapeHTML(busy)}</strong> · 15 courts across 4 sports</div></article>
    <article class="metric-card"><div class="metric-top"><span>Equipment ready</span><span class="metric-icon">${icon('check')}</span></div><div class="metric-value-row"><span class="metric-value">${equip.available}</span><span class="metric-unit">of ${equip.total} pieces</span></div><div class="metric-note"><strong>${equip.others + equip.own + equip.friend} booked for today</strong></div></article>
    <article class="metric-card"><div class="metric-top"><span>Needs attention</span><span class="metric-icon" style="color:#b54a50;background:#fae9e9">${icon('alert')}</span></div><div class="metric-value-row"><span class="metric-value">${equip.broken}</span><span class="metric-unit">items reported broken</span></div><div class="metric-note">Across all 4 equipment types · ${brokenPct}%</div></article>
    <article class="metric-card"><div class="metric-top"><span>Your upcoming queue</span><span class="metric-icon">${icon('calendar')}</span></div><div class="metric-value-row"><span class="metric-value">${user ? queues.length : '—'}</span><span class="metric-unit">${user ? 'upcoming bookings' : 'sign in to view'}</span></div><div class="metric-note">${user ? 'Your park plans, all in one place' : '<strong>One account</strong> for all your bookings'}</div></article></div>
    <div class="content-grid"><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Park activity</h2><p class="panel-subtitle">Court use and equipment bookings · estimated from park schedules</p></div><div class="segmented" role="group" aria-label="Chart time range"><button class="segment-button ${state.graphPeriod === 'day' ? 'active' : ''}" data-period="day">Day</button><button class="segment-button ${state.graphPeriod === 'week' ? 'active' : ''}" data-period="week">Week</button><button class="segment-button ${state.graphPeriod === 'month' ? 'active' : ''}" data-period="month">Month</button></div></div>
    <div class="chart-controls"><div class="panel-subtitle" id="graphCaption">${state.graphPeriod === 'day' ? 'Hourly activity for the selected day' : state.graphPeriod === 'week' ? 'Daily activity across the selected week' : 'Daily activity across the selected month'}</div><div id="graphPeriodControls">${graphControls()}</div></div><div class="chart-canvas-wrap"><canvas id="activityChart" aria-label="Line chart of court and equipment activity" role="img"></canvas></div><div class="chart-legend"><span class="legend-item"><i class="legend-swatch"></i> Court occupancy</span><span class="legend-item"><i class="legend-swatch eq"></i> Equipment booked</span></div></section>
    <section class="panel recommend-card"><div class="recommend-mark">${icon('spark')}</div><div class="eyebrow" style="margin-bottom:5px">A quieter time to play</div><h2 class="panel-title" style="margin:0">Recommended slot</h2><div class="recommend-day">${escapeHTML(dateLabel(rec.date,{weekday:'long',month:'short',day:'numeric'}))}</div><div class="recommend-time">${timeText(rec.start)} – ${timeText(rec.end)}</div><p class="recommend-reason">Our simple forecast expects fewer visitors around this time, so you can spend less time waiting and more time playing.</p><div class="recommend-meta"><span>Estimated park activity</span><span class="occupancy-pill">${Math.round(rec.score)}% · low</span></div><button class="button button-secondary" style="margin-top:14px;width:100%" data-action="book-recommendation">Check this time ${icon('arrow')}</button></section></div>
    <div class="bottom-grid"><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">${user ? 'Your queue' : 'Your queue'}</h2><p class="panel-subtitle">${user ? 'Your upcoming court and equipment bookings' : 'Sign in to see your upcoming park plans'}</p></div>${user ? `<button class="button button-outline button-small" data-nav="courts">Make a booking ${icon('arrow')}</button>` : ''}</div><div class="queue-list">${queueMarkup}</div></section>
    <section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Courts by sport</h2><p class="panel-subtitle">Today’s schedule at a glance</p></div><button class="button button-outline button-small" data-nav="courts">View schedules ${icon('arrow')}</button></div><div class="category-stat-list">${categories}</div><p class="footnote">Availability changes as park users book or release a time slot.</p></section></div>`;
  translateUI($('#main'));
  requestAnimationFrame(drawActivityChart);
}

function graphControls() {
  if (state.graphPeriod === 'month') {
    const currentYear = new Date().getFullYear();
    return `<div style="display:flex;gap:6px"><input class="input-control" type="month" aria-label="Select month" id="graphMonth" value="${escapeHTML(state.graphMonth)}"><select class="select-control" id="graphYear" aria-label="Select year">${Array.from({length:7},(_,i)=>currentYear-3+i).map(y => `<option value="${y}" ${Number(state.graphYear)===y?'selected':''}>${y}</option>`).join('')}</select></div>`;
  }
  return `<input class="input-control" type="date" aria-label="Select ${state.graphPeriod === 'day' ? 'day' : 'week'}" id="graphDate" value="${escapeHTML(state.graphDate)}" ${state.graphPeriod === 'day' ? `max="${todayISO()}"` : ''}>`;
}
function drawActivityChart() {
  const canvas = $('#activityChart'); if (!canvas) return;
  const rect = canvas.getBoundingClientRect(); if (!rect.width) return;
  const dpr = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width*dpr); canvas.height = Math.round(rect.height*dpr);
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const w = rect.width, h = rect.height, pad = { left: 34, right: 10, top: 12, bottom: 25 };
  const plotW = w-pad.left-pad.right, plotH = h-pad.top-pad.bottom;
  const styles = getComputedStyle(document.documentElement), grid = styles.getPropertyValue('--line').trim() || '#e4eae3', muted = styles.getPropertyValue('--muted').trim() || '#78867d';
  ctx.clearRect(0,0,w,h); ctx.font = '9px DM Sans, sans-serif'; ctx.textBaseline = 'middle';
  [0,25,50,75,100].forEach(v => { const y=pad.top+plotH*(1-v/100); ctx.beginPath();ctx.strokeStyle=grid;ctx.lineWidth=1;ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(`${v}%`,pad.left-7,y); });
  const values = chartValues(); const count = values.court.length;
  const x = i => pad.left + (count === 1 ? plotW/2 : i*plotW/(count-1));
  const y = v => pad.top + plotH*(1-v/100);
  const labels = values.labels;
  const step = count > 12 ? 4 : count > 8 ? 3 : 1;
  labels.forEach((label,i) => { if (i % step === 0 || i===count-1) {ctx.fillStyle=muted;ctx.textAlign='center';ctx.fillText(label,x(i),h-9);} });
  const drawLine = (arr, color, fill) => {
    ctx.beginPath();arr.forEach((v,i)=>{if(i===0)ctx.moveTo(x(i),y(v));else ctx.lineTo(x(i),y(v));});
    ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
    ctx.lineTo(x(arr.length-1),pad.top+plotH);ctx.lineTo(x(0),pad.top+plotH);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    arr.forEach((v,i)=>{if(i%step===0||i===arr.length-1){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x(i),y(v),2.7,0,Math.PI*2);ctx.fill();}});
  };
  drawLine(values.court,'#2e7653','rgba(46,118,83,.09)'); drawLine(values.equip,'#acc777','rgba(172,199,119,.10)');
}
function chartValues() {
  let count, start;
  if (state.graphPeriod === 'day') { count=15;start=7; }
  else if (state.graphPeriod === 'week') { count=7; }
  else { const [y,m] = state.graphMonth.split('-').map(Number); count=new Date(y,m,0).getDate(); }
  const court=[],equip=[],labels=[];
  for(let i=0;i<count;i++) {
    let date, hour;
    if(state.graphPeriod==='day') { date=state.graphDate;hour=start+i;labels.push(i%2===0?new Date(2000,0,1,hour).toLocaleTimeString(languageLocales[data.locale||'en'],{hour:'numeric'}):''); }
    else if(state.graphPeriod==='week') { const base=localDate(state.graphDate);base.setDate(base.getDate()-base.getDay()+i);date=`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;hour=18;labels.push(base.toLocaleDateString(languageLocales[data.locale||'en'],{weekday:'short'})); }
    else { const [y,m]=state.graphMonth.split('-').map(Number);date=`${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;hour=18;labels.push((i+1)%5===1||i===0?String(i+1):''); }
    const c=loadEstimate(date,hour);const e=Math.max(8,Math.min(91,Math.round(loadEstimate(date, state.graphPeriod==='day'?hour-.5:hour-1)*.78+Math.cos(i*1.7)*8)));
    court.push(c);equip.push(e);
  }
  return {court,equip,labels};
}

function renderCourts() {
  $('#main').innerHTML = `<div class="page-heading"><div><div class="eyebrow">Make a plan</div><h1>Book a court</h1><p>Choose your sport to see every court’s live queue.</p></div><span class="date-pill">${icon('pin')} Benchakitti Park · Open 5:00 AM–9:00 PM</span></div><p class="section-intro">Check the schedule before you set out. Each court’s timeline shows booked time in red and your own bookings in green. Choose a time from 7:00 AM to 9:00 PM.</p><div class="sport-grid">${sports.map(s=>`<button type="button" class="sport-card" data-open-courts="${s.id}"><div class="sport-visual">${sportSvg(s.id)}</div><div class="sport-card-body"><h2 class="sport-card-title">${escapeHTML(s.label)}</h2><p class="sport-card-desc">${escapeHTML(s.descriptor)}</p><div class="sport-card-bottom"><span>${s.courts} courts</span><strong>See schedule ${icon('arrow')}</strong></div></div></button>`).join('')}</div>`;
  translateUI($('#main'));
}
function courtBookings(sportId, court, date) { return data.courtBookings.filter(b=>b.sportId===sportId&&b.court===court&&b.date===date).sort((a,b)=>a.start-b.start); }
function renderCourtDetail() {
  const sport=sportById(state.sportId), rows=Array.from({length:sport.courts},(_,i)=>i+1), date=state.selectedDate;
  const scheduleNote=backendConfigured?'Court schedules and queues are loaded from the shared database.':'Demo schedules help illustrate availability. In a live park service, staff or booking integrations would keep this schedule current.';
  const timelines=rows.map(court=>{
    const bookings=courtBookings(sport.id,court,date);
    const segments=bookings.map(b=>{
      const left=Math.max(0,(b.start-420)/840*100),width=Math.max(1.2,(b.end-b.start)/840*100),mine=b.user===data.currentUser;
      const friend=!mine&&isFriendBooking(b);
      return `<button class="booking-segment ${mine?'mine':friend?'friend':''}" data-no-translate data-no-translate-title style="left:${left}%;width:${width}%" title="${escapeHTML(b.user.slice(0,4).toUpperCase())} · ${timeText(b.start)}–${timeText(b.end)}" data-court-booking="${escapeHTML(b.id)}">${width>7?escapeHTML(b.user.slice(0,4).toUpperCase()):''}</button>`;
    }).join('');
    const nowMins=new Date().getHours()*60+new Date().getMinutes();
    const activeNow=date===todayISO()&&bookings.some(b=>b.start<=nowMins&&b.end>nowMins), closed=courtIsClosed(sport.id,court);
    return `<article class="court-row ${closed?'court-row-closed':''}"><div class="court-thumb">${courtSvg(sport.id)}</div><div class="court-content"><div class="court-row-head"><div><h2 class="court-title">${escapeHTML(sport.label)} · Court ${court}</h2><div class="court-meta">${bookings.length} booked time${bookings.length===1?'':'s'} on ${escapeHTML(dateLabel(date))}</div></div><span class="court-open-label ${closed?'court-label-closed':''}">${closed?'Out of service':activeNow?'In use now':bookings.length?`${bookings.length} queued`:'Open schedule'}</span></div><div class="timeline-head">${Array.from({length:15},(_,i)=>`<span>${i%2===0?`${i===0?7:7+i}:00`:''}</span>`).join('')}</div><div class="timeline">${segments}</div><div class="court-row-bottom"><div class="timeline-legend"><span><i class="legend-dot"></i>Booked</span><span><i class="legend-dot mine"></i>Your queue</span><span><i class="legend-dot friend"></i>Friend queue</span></div><button class="button button-primary button-small" data-action="open-court-booking" data-sport="${sport.id}" data-court="${court}" ${closed?'disabled':''}>${closed?'Unavailable':`Make a queue ${icon('plus')}`}</button></div></div></article>`;
  }).join('');
  $('#main').innerHTML = `<div class="page-heading"><div><div class="eyebrow">Court schedule</div><h1>${escapeHTML(sport.label)}</h1><p>Tap a timeline booking for details or choose an open time below.</p></div><button class="button button-outline" data-nav="courts">← All sports</button></div><div class="equipment-toolbar"><p>Daily hours · <strong>7:00 AM – 9:00 PM</strong> · Each block is 30 minutes</p><div class="equipment-filter"><label class="panel-subtitle" for="courtDate">Show date</label><input class="input-control" type="date" id="courtDate" min="${todayISO()}" value="${escapeHTML(date)}"></div></div><div class="court-list">${timelines}</div><p class="footnote">${scheduleNote}</p>`;
  translateUI($('#main'));
}

function renderEquipment() {
  const sport=sportById(state.equipmentSportId), records=equipmentRecords(sport.id), counts={};
  const equipmentNote=backendConfigured?'Select an idle item to reserve it. Equipment status is loaded from the shared database.':'Select an idle item to reserve it. Equipment status is sample data for this prototype.';
  records.forEach(item=>counts[equipmentStatus(item,state.equipmentDate)]=(counts[equipmentStatus(item,state.equipmentDate)]||0)+1);
  const filtered=records.filter(item=>(state.equipmentFilter==='all'||equipmentStatus(item,state.equipmentDate)===state.equipmentFilter)&&(!state.equipmentSearch||item.id.toLowerCase().includes(state.equipmentSearch.toLowerCase())));
  const cards=filtered.map((item,i)=>{
    const status=equipmentStatus(item,state.equipmentDate), clickable=status==='idle'||status==='own';
    return `<button type="button" class="equipment-card" data-equipment-id="${item.id}" ${clickable?'':'disabled'} aria-label="${escapeHTML(item.name)} ${item.id}, ${statusText(status)}"><div class="equipment-visual">${equipmentSvg(sport.id,i)}</div><div class="equipment-info"><div class="equipment-name">${escapeHTML(item.name)}</div><div class="equipment-serial">Serial · ${item.id}</div></div><div class="equipment-status status-${status}"><i class="status-mini-dot"></i>${escapeHTML(statusText(status))}</div></button>`;
  }).join('');
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">Equipment desk</div><h1>Borrow equipment</h1><p>See what’s ready to use before you arrive.</p></div><button class="button button-outline" data-nav="home">${icon('home')} Overview</button></div><div class="sport-grid" style="margin-bottom:18px">${sports.map(s=>`<button type="button" class="sport-card" data-open-equipment="${s.id}"><div class="sport-visual" style="min-height:92px">${sportSvg(s.id)}</div><div class="sport-card-body"><h2 class="sport-card-title">${escapeHTML(s.label)}</h2><div class="sport-card-bottom"><span>30 pieces</span><strong>${s.id===sport.id?'Viewing':'See items'} ${icon('arrow')}</strong></div></div></button>`).join('')}</div>
    <div class="equipment-toolbar"><p>Availability for <strong>${escapeHTML(dateLabel(state.equipmentDate))}</strong> · ${escapeHTML(sport.label)} items</p><div class="equipment-filter"><input class="input-control" id="equipmentSearch" type="search" placeholder="Search serial" aria-label="Search equipment serial" value="${escapeHTML(state.equipmentSearch)}"><input class="input-control" id="equipmentDate" type="date" min="${todayISO()}" aria-label="Select equipment date" value="${escapeHTML(state.equipmentDate)}"><select class="select-control" id="equipmentFilter" aria-label="Filter by equipment status"><option value="all" ${state.equipmentFilter==='all'?'selected':''}>All status</option><option value="idle" ${state.equipmentFilter==='idle'?'selected':''}>Idle</option><option value="others" ${state.equipmentFilter==='others'?'selected':''}>Booked by others</option><option value="friend" ${state.equipmentFilter==='friend'?'selected':''}>Friend booked</option><option value="broken" ${state.equipmentFilter==='broken'?'selected':''}>Broken</option><option value="own" ${state.equipmentFilter==='own'?'selected':''}>Booked by you</option></select></div></div>
    <div class="status-summary"><span><i></i><b>${counts.idle||0}</b> idle</span><span><i class="s-red"></i><b>${counts.others||0}</b> booked</span><span><i class="s-green"></i><b>${counts.own||0}</b> yours</span><span><i class="s-blue"></i><b>${counts.friend||0}</b> friends</span><span><i class="s-danger"></i><b>${counts.broken||0}</b> broken</span></div><div class="equipment-grid">${cards||'<div class="empty-state" style="grid-column:1/-1">No equipment matches this search.</div>'}</div><p class="footnote">${equipmentNote}</p>`;
  translateUI($('#main'));
}

function renderFriends() {
  const friends=currentFriends().slice().sort((a,b)=>a.username.localeCompare(b.username,undefined,{sensitivity:'base'}));
  const requests=currentFriendRequests();
  const invites=currentPlayInvites();
  const friendRows=friends.length?friends.map(friend=>`<article class="friend-row"><div class="friend-avatar">${escapeHTML(initials(friend.username))}</div><div class="friend-row-info"><strong data-no-translate>${escapeHTML(friend.username)}</strong><span>Friend queue</span></div><button type="button" class="button button-outline button-small" data-remove-friend="${escapeHTML(friend.username)}">Remove friend</button></article>`).join(''):`<div class="empty-state">No friends yet. Send a request to get started.</div>`;
  const requestRows=requests.length?requests.map(request=>`<article class="friend-row"><div class="friend-avatar">${escapeHTML(initials(request.username))}</div><div class="friend-row-info"><strong data-no-translate>${escapeHTML(request.username)}</strong><span>${request.direction==='incoming'?'Incoming':'Outgoing'}</span></div>${request.direction==='incoming'?`<div class="friend-row-actions"><button type="button" class="button button-primary button-small" data-respond-friend="${escapeHTML(request.username)}" data-accept="true">Accept</button><button type="button" class="button button-outline button-small" data-respond-friend="${escapeHTML(request.username)}" data-accept="false">Decline</button></div>`:`<span class="friend-pending">Pending</span>`}</article>`).join(''):`<div class="empty-state">No pending friend requests.</div>`;
  const inviteRows=invites.length?invites.map(invite=>{
    const other=invite.direction==='incoming'?invite.sender:invite.receiver;
    const sport=sportById(invite.sportId);
    const slot=`${sport.label} · Court ${invite.court} · ${dateLabel(invite.date)} · ${timeText(invite.start)}–${timeText(invite.end)}`;
    return `<article class="friend-row friend-invite-row"><div class="friend-avatar">${escapeHTML(initials(other))}</div><div class="friend-row-info"><strong data-no-translate>${escapeHTML(other)}</strong><span>${escapeHTML(slot)}</span></div>${invite.status==='pending'&&invite.direction==='incoming'?`<div class="friend-row-actions"><button type="button" class="button button-primary button-small" data-respond-play-invite="${escapeHTML(invite.id)}" data-accept="true">Accept</button><button type="button" class="button button-outline button-small" data-respond-play-invite="${escapeHTML(invite.id)}" data-accept="false">Decline</button></div>`:`<span class="friend-pending">${invite.status==='accepted'?'Accepted':invite.status==='declined'?'Declined':'Sent'}</span>`}</article>`;
  }).join(''):`<div class="empty-state">No play invitations yet.</div>`;
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">Social play</div><h1>Friends</h1><p>Find friends by username and invite them to play.</p></div><span class="date-pill">${icon('users')} Friend bookings appear in blue.</span></div>
    <section class="panel friend-add-panel"><div class="panel-heading"><div><h2 class="panel-title">Add friend</h2><p class="panel-subtitle">Find friends by username and invite them to play.</p></div></div><form id="friendRequestForm" class="friend-add-form"><label class="sr-only" for="friendUsername">Friend username</label><input class="input-control" id="friendUsername" name="username" autocomplete="off" required placeholder="Friend username"><button class="button button-primary" type="submit">Send request ${icon('arrow')}</button></form><div id="friendPageError"></div></section>
    <div class="friend-columns"><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Your friends</h2><p class="panel-subtitle">Friends · ${friends.length}</p></div></div><div class="friend-list">${friendRows}</div></section><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Friend requests</h2><p class="panel-subtitle">Incoming and outgoing requests</p></div></div><div class="friend-list">${requestRows}</div></section></div>
    <section class="panel friend-invites-panel"><div class="panel-heading"><div><h2 class="panel-title">Play invitations</h2><p class="panel-subtitle">Court bookings your friends have invited you to join</p></div></div><div class="friend-list">${inviteRows}</div></section>`;
  translateUI($('#main'));
}

function renderParkAdmin() {
  if (!isAdmin()) { navigate(currentUser()?'home':'login',{history:false}); return; }
  const courtActive=state.adminTab==='courts';
  const body=courtActive?renderAdminCourts():renderAdminEquipment();
  const operationsNote=backendConfigured?'Changes are saved to the shared database.':'Changes update availability across this prototype.';
  const staffFootnote=backendConfigured?'Staff changes are shared across devices.':'Admin actions are saved in this browser’s prototype data. In a live service, staff changes would sync to every device.';
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">Staff workspace</div><h1>Court & equipment admin</h1><p>Update park availability and handle on-the-day changes.</p></div><span class="role-chip ${isHead()?'head':'admin'}">${escapeHTML(roleName(currentUser().role))}</span></div><div class="panel management-panel"><div class="panel-heading management-heading"><div><h2 class="panel-title">Park operations</h2><p class="panel-subtitle">${operationsNote}</p></div><div class="segmented" role="tablist" aria-label="Management area"><button type="button" class="segment-button ${courtActive?'active':''}" role="tab" aria-selected="${courtActive}" data-admin-tab="courts">Courts</button><button type="button" class="segment-button ${!courtActive?'active':''}" role="tab" aria-selected="${!courtActive}" data-admin-tab="equipment">Equipment</button></div></div><div class="management-toolbar"><p>${courtActive?'Court queues and service status':'Equipment status, reservations, and pickup records'}</p><div class="equipment-filter"><label class="panel-subtitle" for="adminDate">Date</label><input class="input-control" type="date" id="adminDate" min="${todayISO()}" value="${escapeHTML(state.adminDate)}"></div></div>${body}</div><p class="footnote">${staffFootnote}</p>`;
  translateUI($('#main'));
}
function renderAdminCourts() {
  return `<div class="management-court-grid">${sports.flatMap(s=>Array.from({length:s.courts},(_,i)=>i+1).map(court=>{
    const key=`${s.id}-${court}`,closed=courtIsClosed(s.id,court),bookings=courtBookings(s.id,court,state.adminDate);
    const queueMarkup=bookings.length?bookings.map(b=>`<div class="management-booking"><div class="management-booking-info"><strong>${timeText(b.start)} – ${timeText(b.end)}</strong><span><span data-no-translate>${escapeHTML(b.user.slice(0,4).toUpperCase())}</span>${b.seeded?' · sample queue':''}</span></div><button class="button button-outline button-small" type="button" data-release-court="${escapeHTML(b.id)}">Release</button></div>`).join(''):`<div class="management-empty">No queues on this date.</div>`;
    return `<article class="management-court-card"><div class="management-court-head"><div class="management-court-title"><span class="management-sport-icon">${s.icon}</span><div><h3>${escapeHTML(s.label)} · Court ${court}</h3><p>${bookings.length} queue${bookings.length===1?'':'s'} · ${escapeHTML(dateLabel(state.adminDate))}</p></div></div><span class="service-chip ${closed?'service-closed':'service-open'}">${closed?'Out of service':'Open'}</span></div><div class="management-booking-list">${queueMarkup}</div><button type="button" class="button ${closed?'button-secondary':'button-outline'} button-small court-service-button" data-toggle-court="${key}">${closed?'Reopen court':'Mark out of service'}</button></article>`;
  })).join('')}</div>`;
}
function renderAdminEquipment() {
  const sport=sportById(state.adminSportId),items=equipmentRecords(sport.id),counts={idle:0,own:0,others:0,friend:0,broken:0};
  items.forEach(item=>counts[equipmentStatus(item,state.adminDate)]++);
  const filtered=items.filter(item=>{
    const status=equipmentStatus(item,state.adminDate),statusMatch=state.adminEquipmentFilter==='all'||(state.adminEquipmentFilter==='booked'?['own','others','friend'].includes(status):status===state.adminEquipmentFilter);
    return statusMatch&&(!state.adminEquipmentSearch||item.id.toLowerCase().includes(state.adminEquipmentSearch.toLowerCase()));
  });
  const cards=filtered.map((item,i)=>{
    const status=equipmentStatus(item,state.adminDate),booking=data.equipmentBookings.find(b=>b.equipmentId===item.id&&b.date===state.adminDate);
    const pickup=booking?.pickedUpAt?`Picked up ${escapeHTML(booking.pickedUpAt)}`:booking?`Awaiting pickup · ${timeText(booking.time)}`:'';
    return `<article class="equipment-card admin-equipment-card"><div class="equipment-visual">${equipmentSvg(sport.id,i)}</div><div class="equipment-info"><div class="equipment-name">${escapeHTML(item.name)}</div><div class="equipment-serial">Serial · ${item.id}</div></div><div class="equipment-status status-${status}"><i class="status-mini-dot"></i>${escapeHTML(statusText(status))}</div>${pickup?`<div class="admin-pickup-state">${pickup}</div>`:''}<button class="button button-outline button-small admin-manage-equipment" type="button" data-manage-equipment="${item.id}" data-sport="${sport.id}">Manage status</button></article>`;
  }).join('');
  return `<div class="management-equipment-toolbar"><select class="select-control" id="adminSport" aria-label="Equipment sport">${sports.map(s=>`<option value="${s.id}" ${s.id===sport.id?'selected':''}>${escapeHTML(s.label)}</option>`).join('')}</select><input class="input-control" id="adminEquipmentSearch" type="search" placeholder="Search serial…" aria-label="Search equipment serial" value="${escapeHTML(state.adminEquipmentSearch)}"><select class="select-control" id="adminEquipmentFilter" aria-label="Filter equipment status"><option value="all" ${state.adminEquipmentFilter==='all'?'selected':''}>All status</option><option value="idle" ${state.adminEquipmentFilter==='idle'?'selected':''}>Idle</option><option value="booked" ${state.adminEquipmentFilter==='booked'?'selected':''}>Booked</option><option value="broken" ${state.adminEquipmentFilter==='broken'?'selected':''}>Broken</option></select></div><div class="status-summary"><span><i></i><b>${counts.idle}</b> idle</span><span><i class="s-red"></i><b>${counts.own+counts.others+counts.friend}</b> booked</span><span><i class="s-danger"></i><b>${counts.broken}</b> broken</span></div><div class="equipment-grid management-equipment-grid">${cards||'<div class="empty-state" style="grid-column:1/-1">No equipment matches this filter.</div>'}</div>`;
}

function renderSettings() {
  const user=currentUser();
  const dataNote=backendConfigured?'Bookings and park equipment are loaded from the shared database. Theme and language preferences stay on this device.':'This demo uses sample court schedules and equipment status. Changes are saved in this browser only. It does not send reservations to park staff.';
  const integrationNote=backendConfigured?'Reservations are saved to the shared database. Staff changes are visible on other devices.':'For an operational service, the park would connect this interface to a shared booking and maintenance system.';
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">Your preferences</div><h1>Settings</h1><p>Make Benjakitti Active feel right for you.</p></div></div><div class="settings-grid"><section class="setting-card"><h2>Appearance</h2><p>Choose a color theme or match your device’s appearance.</p><div class="setting-row"><div><div class="setting-label">Theme</div><div class="setting-help">Applies on this browser and device.</div></div><select class="select-control" id="themeSelect"><option value="system" ${data.theme==='system'?'selected':''}>Use device setting</option><option value="light" ${data.theme==='light'?'selected':''}>Light</option><option value="dark" ${data.theme==='dark'?'selected':''}>Dark</option></select></div><div class="setting-row"><div><div class="setting-label">Language</div><div class="setting-help">Choose the language used across this website.</div></div><select class="select-control" id="languageSelectSettings" aria-label="Language"><option value="en" ${state.locale==='en'?'selected':''}>English</option><option value="th" ${state.locale==='th'?'selected':''}>ไทย</option><option value="zh" ${state.locale==='zh'?'selected':''}>中文</option><option value="ja" ${state.locale==='ja'?'selected':''}>日本語</option></select></div></section><section class="setting-card"><h2>Account</h2><p>Update your username. Your bookings will stay linked to your account.</p>${user?`<form id="changeUsernameForm" class="form-stack"><div class="form-field"><label for="newUsername">Username</label><input id="newUsername" name="username" value="${escapeHTML(user.username)}" autocomplete="username" required><span class="form-hint">At least 8 characters and one English letter.</span></div><button class="button button-primary" type="submit">Save username</button><button class="button button-outline" type="button" data-action="logout">Log out</button></form>`:`<div class="empty-state"><strong>You’re browsing as a guest</strong>Log in to manage your account and bookings.<br><button class="button button-primary button-small" style="margin-top:11px" data-nav="login">Log in</button></div>`}</section><section class="setting-card"><h2>About this prototype</h2><p>${dataNote}</p><div class="notice">${icon('alert')}<span>${integrationNote}</span></div></section></div>`;
  translateUI($('#main'));
}

function renderLogin() {
  const demoAccounts=backendConfigured?'':`<div class="demo-accounts"><strong>Prototype admin accounts</strong><br>Admin: admin001 · 12345678<br>Head account: headaccount001 · RVKs2551</div>`;
  $('#main').innerHTML=`<div class="auth-layout"><section class="auth-card"><div class="auth-brand"><div class="brand-mark">${icon('leaf')}</div><div><div class="brand-name">Benjakitti Active</div><div class="brand-sub">Park sports, made easier</div></div></div><div class="eyebrow">Welcome back</div><h1 class="auth-title">Log in to your account</h1><p class="auth-copy">Sign in to make a court queue or reserve equipment at the park.</p>${state.loginNotice?`<div class="auth-message">${escapeHTML(state.loginNotice)}</div>`:''}${state.loginSuccess?`<div class="auth-message success">${escapeHTML(state.loginSuccess)}</div>`:''}<form class="form-stack" id="loginForm"><div class="form-field"><label for="loginUsername">Username</label><input id="loginUsername" name="username" autocomplete="username" required autofocus></div><div class="form-field"><label for="loginPassword">Password</label><input id="loginPassword" name="password" type="password" autocomplete="current-password" required></div><button class="button button-primary" type="submit">Log in ${icon('arrow')}</button></form><p class="auth-switch">New to the park? <button class="text-button" data-nav="register">Create an account</button></p>${demoAccounts}</section></div>`;
  translateUI($('#main'));
}
function renderRegister() {
  $('#main').innerHTML=`<div class="auth-layout"><section class="auth-card"><div class="auth-brand"><div class="brand-mark">${icon('leaf')}</div><div><div class="brand-name">Benjakitti Active</div><div class="brand-sub">Park sports, made easier</div></div></div><div class="eyebrow">Join the park</div><h1 class="auth-title">Create your account</h1><p class="auth-copy">One account to check court queues and borrow park equipment.</p><div id="registerMessage"></div><form class="form-stack" id="registerForm" novalidate><div class="form-field" id="usernameField"><label for="registerUsername">Username <span aria-hidden="true">*</span></label><div id="usernameError"></div><input id="registerUsername" name="username" autocomplete="username" required><span class="form-hint">At least 8 characters, including one English letter.</span></div><div class="form-field" id="passwordField"><label for="registerPassword">Password <span aria-hidden="true">*</span></label><div id="passwordError"></div><input id="registerPassword" name="password" type="password" autocomplete="new-password" required><span class="form-hint">At least 8 characters, with uppercase, lowercase, and a number.</span></div><div class="form-field"><label for="registerPhone">Telephone number <span style="font-weight:400;color:var(--muted)">(optional)</span></label><input id="registerPhone" name="phone" type="tel" autocomplete="tel" placeholder="For staff to contact you"></div><button class="button button-primary" type="submit">Create account ${icon('arrow')}</button></form><p class="auth-switch">Already registered? <button class="text-button" data-nav="login">Log in</button></p></section></div>`;
  translateUI($('#main'));
}

function renderAdminUsers() {
  if (!isAdmin()) { navigate(currentUser()?'home':'login',{history:false}); return; }
  const accountNote=backendConfigured?'Passwords are managed by secure authentication and can never be viewed. Enter a new password in Manage to reset one.':'Prototype account data is stored locally in this browser. Password reveal lasts 10 seconds and then hides automatically.';
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">Administrator access</div><h1>User administration</h1><p>Search accounts and manage park access.</p></div><span class="role-chip ${isHead()?'head':'admin'}">${escapeHTML(roleName(currentUser().role))}</span></div><div class="notice" style="margin-bottom:16px">${icon('alert')}<span>${accountNote}</span></div><div class="admin-toolbar"><div class="search-wrap">${icon('search')}<input id="userSearch" type="search" placeholder="Search by username…" value="${escapeHTML(state.userSearch)}" aria-label="Search usernames"></div><button class="button button-primary" data-action="add-user">${icon('plus')} Add user</button></div><div class="table-wrap"><table class="users-table"><thead><tr><th>Username</th><th>Password</th><th>Access</th><th>Telephone</th><th>Manage</th></tr></thead><tbody id="userTableBody">${usersRows()}</tbody></table></div><p class="footnote">Usernames are sorted alphabetically. Head account permissions cannot be changed by an administrator.</p>`;
  translateUI($('#main'));
}
function usersRows() {
  const users=data.users.filter(u=>u.username.toLowerCase().includes((state.userSearch||'').toLowerCase())).sort((a,b)=>a.username.localeCompare(b.username,undefined,{sensitivity:'base'}));
  if (!users.length) return '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:25px">No matching users.</td></tr>';
  return users.map(u=>{
    const visible=!backendConfigured&&state.revealedPasswords.has(u.username);
    const safe=escapeHTML(u.username);
    const passwordControl=backendConfigured?'<span class="password-cell" aria-label="Password stored securely">••••••••</span>':`<span class="password-cell" data-no-translate>${visible?escapeHTML(u.password):'********'}</span> <button type="button" class="password-toggle" aria-label="${visible?'Hide':'Show'} password for ${safe}" data-reveal-password="${safe}">${icon(visible?'eyeOff':'eye')}</button>`;
    return `<tr><td><strong data-no-translate>${safe}</strong></td><td>${passwordControl}</td><td><span class="role-chip ${u.role==='head'?'head':u.role==='admin'?'admin':''}">${escapeHTML(roleName(u.role))}</span></td><td><span data-no-translate>${escapeHTML(u.phone||'—')}</span></td><td><button type="button" class="button button-outline button-small" data-manage-user="${safe}">Manage</button></td></tr>`;
  }).join('');
}
function render() {
  if (protectedRoutes.has(state.route) && !currentUser()) { state.intendedRoute = state.route; state.route = 'login'; }
  if (['adminUsers','parkAdmin'].includes(state.route) && !isAdmin()) state.route = currentUser() ? 'home' : 'login';
  applyTheme(); renderNavigation(); renderTopbar();
  const views={home:renderHome,courts:renderCourts,courtDetail:renderCourtDetail,equipment:renderEquipment,equipmentDetail:renderEquipment,settings:renderSettings,friends:renderFriends,login:renderLogin,register:renderRegister,adminUsers:renderAdminUsers,parkAdmin:renderParkAdmin};
  (views[state.route]||renderHome)();
  translateUI($('#sidebar')); translateUI($('#topbar')); translateUI($('#mobileNav'));
  document.title=translateText('Benjakitti Active — Park sports, made easier');
}

function courtBookingModal(sportId,court,date=state.selectedDate,defaultStart=null,defaultEnd=null) {
  const sport=sportById(sportId), start=defaultStart ?? 9*60, end=defaultEnd ?? start+60;
  openModal(`<div class="modal-head"><div><div class="eyebrow">Court queue</div><h2 class="modal-title">${escapeHTML(sport.label)} · Court ${court}</h2><p class="modal-copy">Pick a start and end time. Each booking is at least 30 minutes.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div id="courtModalError"></div><form id="courtBookingForm" class="form-stack"><input type="hidden" name="sportId" value="${sportId}"><input type="hidden" name="court" value="${court}"><div class="form-field"><label for="bookingDate">Date</label><input id="bookingDate" name="date" type="date" min="${todayISO()}" value="${escapeHTML(date)}" required></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="form-field"><label for="bookingStart">Start time</label><select id="bookingStart" name="start" required>${timeOptions(420,1230).map(t=>`<option value="${t}" ${t===start?'selected':''}>${timeText(t)}</option>`).join('')}</select></div><div class="form-field"><label for="bookingEnd">End time</label><select id="bookingEnd" name="end" required>${timeOptions(450,1260).map(t=>`<option value="${t}" ${t===end?'selected':''}>${timeText(t)}</option>`).join('')}</select></div></div><div class="form-hint">Court hours are 7:00 AM–9:00 PM. A time cannot overlap another queue on this court.</div><div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Book this time</button></div></form>`);
}
function equipmentBookingModal(item) {
  const status=equipmentStatus(item,state.equipmentDate), sport=sportById(item.sportId);
  const booking=data.equipmentBookings.find(b=>b.equipmentId===item.id&&b.date===state.equipmentDate&&b.user===data.currentUser);
  const descriptions={idle:'This item is available. Choose when you would like to pick it up.',others:'This item is currently booked by another park user.',friend:'A friend has booked this item.',own:`You have reserved this item for ${timeText(booking?.time||480)} on ${dateLabel(booking?.date||state.equipmentDate)}.`,broken:'This item has been reported broken and cannot be reserved.'};
  const actions=status==='own'?`<div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Keep booking</button><button class="button button-danger" type="button" data-cancel-equipment="${item.id}">Cancel reservation</button></div>`:status==='idle'?`<form id="equipmentBookingForm" class="form-stack"><input type="hidden" name="equipmentId" value="${item.id}"><div class="form-field"><label for="equipmentBookingDate">Receive date</label><input id="equipmentBookingDate" name="date" type="date" min="${todayISO()}" value="${escapeHTML(state.equipmentDate)}" required></div><div class="form-field"><label for="equipmentBookingTime">Receive time</label><select id="equipmentBookingTime" name="time">${timeOptions(420,1230).map(t=>`<option value="${t}">${timeText(t)}</option>`).join('')}</select></div><div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Reserve equipment</button></div></form>`:`<div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Close</button></div>`;
  openModal(`<div class="modal-head"><div><div class="eyebrow">${escapeHTML(sport.label)} equipment</div><h2 class="modal-title">${escapeHTML(item.name)} · ${item.id}</h2><p class="modal-copy">Reservation status for ${escapeHTML(dateLabel(state.equipmentDate))}.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="equipment-modal-status status-${status}">${escapeHTML(statusText(status))}</div><p class="modal-copy" style="margin-bottom:16px">${escapeHTML(descriptions[status])}</p><div id="equipmentModalError"></div>${actions}`);
}
function equipmentAdminModal(item) {
  const date=state.adminDate,booking=data.equipmentBookings.find(b=>b.equipmentId===item.id&&b.date===date);
  const current=equipmentStatus(item,date),selected=['own','others','friend'].includes(current)?'booked':current;
  const users=[...data.users].sort((a,b)=>a.username.localeCompare(b.username,undefined,{sensitivity:'base'}));
  const assigned=booking?.user||users.find(u=>u.role==='user')?.username||users[0]?.username||'';
  const pickupTime=booking?.time??480;
  openModal(`<div class="modal-head"><div><div class="eyebrow">Staff equipment control</div><h2 class="modal-title">${escapeHTML(item.name)} · ${item.id}</h2><p class="modal-copy">Update its status or record when a reservation was actually collected.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="equipment-modal-status status-${current}">Current status · ${escapeHTML(statusText(current))}</div><div id="adminEquipmentError"></div><form id="adminEquipmentForm" class="form-stack"><input type="hidden" name="equipmentId" value="${item.id}"><div class="form-field"><label for="adminEquipmentStatus">Set status</label><select id="adminEquipmentStatus" name="status"><option value="idle" ${selected==='idle'?'selected':''}>Idle · available / returned</option><option value="booked" ${selected==='booked'?'selected':''}>Booked · assign a user</option><option value="broken" ${selected==='broken'?'selected':''}>Broken · unavailable</option></select></div><div id="adminBookedFields" class="form-stack" ${selected!=='booked'?'hidden':''}><div class="form-field"><label for="adminEquipmentUser">Reserved for</label><select id="adminEquipmentUser" name="user">${users.map(u=>`<option value="${escapeHTML(u.username)}" ${u.username===assigned?'selected':''}>${escapeHTML(u.username)}${u.role!=='user'?` · ${escapeHTML(roleName(u.role))}`:''}</option>`).join('')}</select></div><div class="form-field"><label for="adminScheduledPickup">Scheduled pickup date</label><input id="adminScheduledPickup" name="date" type="date" value="${escapeHTML(booking?.date||date)}" required></div><div class="form-field"><label for="adminScheduledTime">Scheduled pickup time</label><select id="adminScheduledTime" name="time">${timeOptions(300,1260).map(t=>`<option value="${t}" ${t===pickupTime?'selected':''}>${timeText(t)}</option>`).join('')}</select></div><div class="form-field"><label for="adminActualPickup">Actual pickup time <span style="font-weight:400;color:var(--muted)">(optional)</span></label><input id="adminActualPickup" name="pickedUpAt" type="time" min="05:00" max="21:00" value="${escapeHTML(booking?.pickedUpAt||'')}"><span class="form-hint">Enter the time they arrived, whether early or late. Leave blank while awaiting pickup.</span></div></div><div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save status</button></div></form><p class="modal-note">Setting Idle releases today’s booking. Setting Broken removes reservations for this item.</p>`);
}
function courtBookingInfoModal(booking) {
  const sport=sportById(booking.sportId), mine=booking.user===data.currentUser;
  openModal(`<div class="modal-head"><div><div class="eyebrow">Queue details</div><h2 class="modal-title">${escapeHTML(sport.label)} · Court ${booking.court}</h2><p class="modal-copy">${escapeHTML(dateLabel(booking.date))}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="tooltip-card"><div class="tooltip-user"><span data-no-translate>${escapeHTML(booking.user.slice(0,4).toUpperCase())}</span>${mine?' · Your queue':isFriendBooking(booking)?' · Friend queue':''}</div><div class="tooltip-time">${timeText(booking.start)} – ${timeText(booking.end)}</div></div>${mine?`<div class="modal-actions modal-actions-wrap"><button class="button button-outline" type="button" data-action="invite-play" data-booking-id="${escapeHTML(booking.id)}">Invite to play</button><button class="button button-outline" type="button" data-action="close-modal">Keep queue</button><button class="button button-danger" type="button" data-cancel-court="${escapeHTML(booking.id)}">Delete queue</button></div>`:`<div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Close</button></div>`}`);
}
function playInviteModal(booking) {
  const friends=currentFriends().slice().sort((a,b)=>a.username.localeCompare(b.username,undefined,{sensitivity:'base'}));
  if(!friends.length) { closeModal();toast('Add a friend before sending a play invitation.',true);return; }
  const sport=sportById(booking.sportId);
  openModal(`<div class="modal-head"><div><div class="eyebrow">Court queue invitation</div><h2 class="modal-title">Invite to play</h2><p class="modal-copy">${escapeHTML(sport.label)} · Court ${booking.court} · ${escapeHTML(dateLabel(booking.date))} · ${timeText(booking.start)}–${timeText(booking.end)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><form id="playInviteForm" class="form-stack"><input type="hidden" name="bookingId" value="${escapeHTML(booking.id)}"><div class="form-field"><label for="playInviteFriend">Choose a friend</label><select id="playInviteFriend" name="username" required>${friends.map(friend=>`<option value="${escapeHTML(friend.username)}">${escapeHTML(friend.username)}</option>`).join('')}</select></div><div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Send invite</button></div></form>`);
}
function userModal(username = null) {
  const user=username?data.users.find(u=>u.username===username):null;
  if(username&&!user) return;
  const locked=user?.role==='head'&&!isHead();
  const canChangeRole=isHead()&&user?.role!=='head';
  openModal(`<div class="modal-head"><div><div class="eyebrow">${user?'Manage account':'New park user'}</div><h2 class="modal-title">${user?'User details':'Add a user'}</h2><p class="modal-copy">${user?'Update account details or access.':'Create username and password credentials.'}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div id="userModalError"></div>${locked?`<div class="notice">${icon('alert')}<span>The head account is protected from administrator changes.</span></div>`:`<form id="userForm" class="form-stack"><input type="hidden" name="original" value="${escapeHTML(user?.username||'')}"><div class="form-field"><label for="manageUsername">Username</label><input id="manageUsername" name="username" value="${escapeHTML(user?.username||'')}" required autocomplete="off"></div><div class="form-field"><label for="managePassword">${user?'New password (leave blank to keep current)':'Password'}</label><input id="managePassword" name="password" type="password" ${user?'':'required'} autocomplete="new-password"></div>${canChangeRole?`<div class="form-field"><label for="manageRole">Access level</label><select id="manageRole" name="role"><option value="user" ${user?.role==='user'?'selected':''}>Park member</option><option value="admin" ${user?.role==='admin'?'selected':''}>Administrator</option></select></div>`:''}<div class="form-hint">Username: at least 8 characters and one English letter. Password: at least 8 characters with uppercase, lowercase, and a number.</div><div class="modal-actions" style="justify-content:space-between">${user&&user.username!==data.currentUser?'<button class="button button-danger button-small" type="button" data-delete-user="'+escapeHTML(user.username)+'">Delete user</button>':'<span></span>'}<div style="display:flex;gap:7px"><button class="button button-outline" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${user?'Save changes':'Add user'}</button></div></div></form>`}`);
}

function isUsernameValid(username) { return username.length>=8 && /[A-Za-z]/.test(username); }
function isPasswordValid(password) { return password.length>=8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password); }
function usernameAvailable(username, except='') { return !data.users.some(u=>u.username.toLowerCase()===username.toLowerCase()&&u.username!==except); }
function setRegisterError(field,message) {
  const el=$(`#${field}Error`), group=$(`#${field}Field`); if(!el||!group)return;
  el.innerHTML=message?`<div class="form-error">${escapeHTML(message)}</div>`:'';group.classList.toggle('field-error',!!message);translateUI(el);
}

document.addEventListener('click', async (event) => {
  const target=event.target.closest('button,[data-court-booking],[data-equipment-id],[data-action]'); if(!target)return;
  if(target.hasAttribute('data-nav')) { navigate(target.dataset.nav); return; }
  if(target.dataset.openCourts) { navigate('courtDetail',{sportId:target.dataset.openCourts}); return; }
  if(target.dataset.openEquipment) { state.equipmentSportId=target.dataset.openEquipment; state.equipmentFilter='all';state.equipmentSearch='';render();return; }
  if(target.dataset.period) { state.graphPeriod=target.dataset.period;renderHome();requestAnimationFrame(drawActivityChart);return; }
  if(target.dataset.courtBooking) { const booking=data.courtBookings.find(b=>b.id===target.dataset.courtBooking);if(booking)courtBookingInfoModal(booking);return; }
  if(target.dataset.action==='invite-play') { const booking=data.courtBookings.find(b=>b.id===target.dataset.bookingId);if(booking&&booking.user===data.currentUser)playInviteModal(booking);return; }
  if(target.dataset.respondFriend) {
    const username=target.dataset.respondFriend,accept=target.dataset.accept==='true';
    if(backendConfigured) {
      try { await remoteRpc('park_respond_friend_request',{p_username:username,p_accept:accept});renderFriends();toast(accept?'You are now friends.':'Friend request declined.'); }
      catch(error) { toast(error.message,true); }
      return;
    }
    const relation=(data.friendships||[]).find(row=>row.requester===username&&row.target===data.currentUser&&row.status==='pending');
    if(!relation)return;
    if(accept)relation.status='accepted';else data.friendships=data.friendships.filter(row=>row!==relation);
    saveData();renderFriends();toast(accept?'You are now friends.':'Friend request declined.');return;
  }
  if(target.dataset.removeFriend) {
    const username=target.dataset.removeFriend;
    if(backendConfigured) {
      try { await remoteRpc('park_remove_friend',{p_username:username});renderFriends();toast('Friend removed.'); }
      catch(error) { toast(error.message,true); }
      return;
    }
    data.friendships=data.friendships.filter(row=>row.status!=='accepted'||![row.requester,row.target].includes(username)||![row.requester,row.target].includes(data.currentUser));
    saveData();renderFriends();toast('Friend removed.');return;
  }
  if(target.dataset.respondPlayInvite) {
    const inviteId=target.dataset.respondPlayInvite,accept=target.dataset.accept==='true';
    if(backendConfigured) {
      try { await remoteRpc('park_respond_play_invite',{p_invite_id:inviteId,p_accept:accept});renderFriends();toast(accept?'Invitation accepted.':'Invitation declined.'); }
      catch(error) { toast(error.message,true); }
      return;
    }
    const invite=(data.playInvites||[]).find(row=>row.id===inviteId&&row.receiver===data.currentUser&&row.status==='pending');
    if(!invite)return;
    invite.status=accept?'accepted':'declined';saveData();renderFriends();toast(accept?'Invitation accepted.':'Invitation declined.');return;
  }
  if(target.dataset.equipmentId) { const item=equipmentRecords(state.equipmentSportId).find(x=>x.id===target.dataset.equipmentId);if(item)equipmentBookingModal(item);return; }
  if(target.dataset.action==='close-modal') { closeModal();return; }
  if(target.dataset.action==='backdrop'&&event.target===target) { closeModal();return; }
  if(target.dataset.action==='login') { navigate('login');return; }
  if(target.dataset.action==='logout') {
    if(backendConfigured) {
      const { error } = await backendClient.auth.signOut();
      if(error) { toast(error.message,true); return; }
    }
    data.currentUser=null;
    if(!backendConfigured) saveData();
    toast('You have logged out.');navigate('home');return;
  }
  if(target.dataset.action==='notifications') { toast('You’re all caught up.');return; }
  if(target.dataset.adminTab) { state.adminTab=target.dataset.adminTab;renderParkAdmin();return; }
  if(target.dataset.toggleCourt) {
    const key=target.dataset.toggleCourt;
    if(backendConfigured) {
      const courtParts=key.split('-'),courtText=courtParts.pop(),sportId=courtParts.join('-');
      try {
        await remoteRpc('park_admin_set_court_status',{p_sport_id:sportId,p_court_number:Number(courtText),p_closed:!data.courtMaintenance[key]});
        renderParkAdmin();toast(data.courtMaintenance[key]?'Court marked out of service.':'Court reopened.');
      } catch(error) { toast(error.message,true); }
      return;
    }
    if(data.courtMaintenance[key]) delete data.courtMaintenance[key]; else data.courtMaintenance[key]=true;
    saveData();renderParkAdmin();toast(data.courtMaintenance[key]?'Court marked out of service.':'Court reopened.');return;
  }
  if(target.dataset.releaseCourt) {
    const booking=data.courtBookings.find(b=>b.id===target.dataset.releaseCourt);if(!booking)return;
    openModal(`<div class="modal-head"><div><div class="eyebrow">Staff action</div><h2 class="modal-title">Release this court queue?</h2><p class="modal-copy">${escapeHTML(sportById(booking.sportId).label)} · Court ${booking.court}, ${timeText(booking.start)}–${timeText(booking.end)} · ${escapeHTML(booking.user)}.</p></div><button class="modal-close" type="button" data-action="close-modal">×</button></div><div class="modal-actions"><button class="button button-outline" type="button" data-action="close-modal">Keep queue</button><button class="button button-danger" type="button" data-confirm-release-court="${escapeHTML(booking.id)}">Release queue</button></div>`);return;
  }
  if(target.dataset.confirmReleaseCourt) {
    if(backendConfigured) {
      try { await remoteRpc('park_delete_court_booking',{p_booking_id:target.dataset.confirmReleaseCourt});closeModal();renderParkAdmin();toast('Court queue released.'); }
      catch(error) { toast(error.message,true); }
      return;
    }
    data.courtBookings=data.courtBookings.filter(b=>b.id!==target.dataset.confirmReleaseCourt);saveData();closeModal();renderParkAdmin();toast('Court queue released.');return;
  }
  if(target.dataset.manageEquipment) {
    const item=equipmentRecords(target.dataset.sport).find(x=>x.id===target.dataset.manageEquipment);if(item)equipmentAdminModal(item);return;
  }
  if(target.dataset.action==='open-court-booking') { courtBookingModal(target.dataset.sport,Number(target.dataset.court));return; }
  if(target.dataset.action==='book-recommendation') { const rec=recommendation(),openCourt=sports.flatMap(s=>Array.from({length:s.courts},(_,i)=>({sportId:s.id,court:i+1}))).find(c=>!courtIsClosed(c.sportId,c.court));if(!openCourt){toast('All courts are currently out of service.',true);return;}state.selectedDate=rec.date;courtBookingModal(openCourt.sportId,openCourt.court,rec.date,rec.start,rec.end);return; }
  if(target.dataset.action==='add-user') { userModal();return; }
  if(target.dataset.manageUser) { userModal(target.dataset.manageUser);return; }
  if(target.dataset.revealPassword) {
    const username=target.dataset.revealPassword;
    if(state.revealedPasswords.has(username)) state.revealedPasswords.delete(username); else state.revealedPasswords.add(username);
    const tbody=$('#userTableBody');if(tbody){tbody.innerHTML=usersRows();translateUI(tbody);}
    if(state.revealedPasswords.has(username)) setTimeout(()=>{state.revealedPasswords.delete(username);const current=$('#userTableBody');if(current){current.innerHTML=usersRows();translateUI(current);}},10000);
    return;
  }
  if(target.dataset.cancelCourt) {
    const booking=data.courtBookings.find(b=>b.id===target.dataset.cancelCourt);
    if(!booking||booking.user!==data.currentUser)return;
    if(backendConfigured) {
      try { await remoteRpc('park_delete_court_booking',{p_booking_id:booking.id});closeModal();toast('Your court queue was deleted.');render(); }
      catch(error) { toast(error.message,true); }
      return;
    }
    data.courtBookings=data.courtBookings.filter(b=>b.id!==booking.id);saveData();closeModal();toast('Your court queue was deleted.');render();return;
  }
  if(target.dataset.cancelEquipment) {
    const itemId=target.dataset.cancelEquipment;
    if(backendConfigured) {
      try { await remoteRpc('park_cancel_equipment_booking',{p_equipment_id:itemId,p_booking_date:state.equipmentDate});closeModal();toast('Your equipment reservation was cancelled.');render(); }
      catch(error) { toast(error.message,true); }
      return;
    }
    data.equipmentBookings=data.equipmentBookings.filter(b=>!(b.equipmentId===itemId&&b.date===state.equipmentDate&&b.user===data.currentUser));saveData();closeModal();toast('Your equipment reservation was cancelled.');render();return;
  }
  if(target.dataset.deleteUser) {
    const username=target.dataset.deleteUser,user=data.users.find(u=>u.username===username);
    if(!user||username===data.currentUser||user.role==='head'&&!isHead()) { $('#userModalError').innerHTML='<div class="form-error">This account cannot be deleted.</div>';return; }
    const deleteNote=backendConfigured?'Their account and associated reservations will be removed from the shared database.':'Their account and demo bookings will be removed from this browser.';
    openModal(`<div class="modal-head"><div><div class="eyebrow">Confirm deletion</div><h2 class="modal-title">Delete ${escapeHTML(username)}?</h2><p class="modal-copy">${deleteNote}</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-actions"><button class="button button-outline" data-action="edit-user-back" data-username="${escapeHTML(username)}">Go back</button><button class="button button-danger" data-confirm-delete="${escapeHTML(username)}">Delete user</button></div>`);translateUI($('#modalRoot'));return;
  }
  if(target.dataset.action==='edit-user-back') { userModal(target.dataset.username);return; }
  if(target.dataset.confirmDelete) {
    const username=target.dataset.confirmDelete;
    if(backendConfigured) {
      try { await invokeAccountAction({action:'delete',username});await refreshRemoteState();closeModal();render();toast('User deleted.'); }
      catch(error) { const box=$('#modalRoot #userModalError');if(box)box.innerHTML=`<div class="form-error">${escapeHTML(error.message)}</div>`;else toast(error.message,true); }
      return;
    }
    removeLocalUserReferences(username);saveData();closeModal();state.revealedPasswords.delete(username);render();toast('User deleted.');
  }
});

document.addEventListener('change', (event) => {
  const el=event.target;
  if(el.id==='themeSelect') { data.theme=el.value;saveData();applyTheme(); }
  if(el.id==='languageSelect'||el.id==='languageSelectSettings') { data.locale=el.value;state.locale=el.value;saveData();render(); }
  if(el.id==='courtDate') { state.selectedDate=el.value||todayISO();renderCourtDetail(); }
  if(el.id==='equipmentDate') { state.equipmentDate=el.value||todayISO();renderEquipment(); }
  if(el.id==='equipmentFilter') { state.equipmentFilter=el.value;renderEquipment(); }
  if(el.id==='adminDate') { state.adminDate=el.value||todayISO();renderParkAdmin(); }
  if(el.id==='adminSport') { state.adminSportId=el.value;renderParkAdmin(); }
  if(el.id==='adminEquipmentFilter') { state.adminEquipmentFilter=el.value;renderParkAdmin(); }
  if(el.id==='adminEquipmentStatus') { const fields=$('#adminBookedFields');if(fields)fields.hidden=el.value!=='booked'; }
  if(el.id==='graphDate') { state.graphDate=el.value||todayISO();renderHome(); }
  if(el.id==='graphMonth') { state.graphMonth=el.value||todayISO().slice(0,7);state.graphYear=Number(state.graphMonth.slice(0,4));renderHome(); }
  if(el.id==='graphYear') { state.graphYear=Number(el.value);state.graphMonth=`${state.graphYear}-${state.graphMonth.slice(5,7)}`;renderHome(); }
});
document.addEventListener('input', (event) => {
  const el=event.target;
  if(el.id==='equipmentSearch') { state.equipmentSearch=el.value;renderEquipment();const search=$('#equipmentSearch');search?.focus();search?.setSelectionRange(search.value.length,search.value.length); }
  if(el.id==='userSearch') { state.userSearch=el.value;const tbody=$('#userTableBody');if(tbody){tbody.innerHTML=usersRows();translateUI(tbody);} }
  if(el.id==='adminEquipmentSearch') { state.adminEquipmentSearch=el.value;renderParkAdmin();const search=$('#adminEquipmentSearch');search?.focus();search?.setSelectionRange(search.value.length,search.value.length); }
});

document.addEventListener('submit', async (event) => {
  event.preventDefault(); const form=event.target;
  if(form.id==='friendRequestForm') {
    const username=String(new FormData(form).get('username')||'').trim();
    if(!username) return;
    if(backendConfigured) {
      try {
        const result=await remoteRpc('park_send_friend_request',{p_username:username});
        renderFriends();toast(result==='accepted'?'You are now friends.':'Friend request sent.');
      } catch(error) { const box=$('#friendPageError');if(box){box.innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI(box);}else toast(error.message,true); }
      return;
    }
    const target=data.users.find(user=>user.username.toLowerCase()===username.toLowerCase());
    if(!target){$('#friendPageError').innerHTML='<div class="auth-message">That username was not found.</div>';translateUI($('#friendPageError'));return;}
    if(target.username===data.currentUser){$('#friendPageError').innerHTML='<div class="auth-message">You cannot add yourself as a friend.</div>';translateUI($('#friendPageError'));return;}
    const pair=(data.friendships||[]).find(row=>[row.requester,row.target].includes(data.currentUser)&&[row.requester,row.target].includes(target.username));
    if(pair?.status==='accepted'){ $('#friendPageError').innerHTML='<div class="auth-message">You are already friends with this user.</div>';translateUI($('#friendPageError'));return; }
    if(pair?.status==='pending') {
      if(pair.requester===target.username&&pair.target===data.currentUser) { pair.status='accepted';saveData();renderFriends();toast('You are now friends.'); }
      else { $('#friendPageError').innerHTML='<div class="auth-message">A friend request is already pending.</div>';translateUI($('#friendPageError')); }
      return;
    }
    data.friendships.push({id:`${data.currentUser}:${target.username}`,requester:data.currentUser,target:target.username,status:'pending',createdAt:new Date().toISOString()});
    saveData();renderFriends();toast('Friend request sent.');return;
  }
  if(form.id==='playInviteForm') {
    const fd=new FormData(form),bookingId=String(fd.get('bookingId')||''),username=String(fd.get('username')||'');
    if(backendConfigured) {
      try { await remoteRpc('park_send_play_invite',{p_booking_id:bookingId,p_friend_username:username});closeModal();render();toast('Invitation sent.'); }
      catch(error) { toast(error.message,true); }
      return;
    }
    const booking=data.courtBookings.find(item=>item.id===bookingId&&item.user===data.currentUser);
    if(!booking||!isFriendUsername(username)){toast('You can only invite an accepted friend to your own court queue.',true);return;}
    const existing=(data.playInvites||[]).find(invite=>invite.bookingId===bookingId&&invite.receiver===username&&['pending','accepted'].includes(invite.status));
    if(existing){toast('This friend has already been invited.',true);return;}
    data.playInvites.push({id:`invite-${Date.now()}`,bookingId,sportId:booking.sportId,court:booking.court,date:booking.date,start:booking.start,end:booking.end,sender:data.currentUser,receiver:username,status:'pending'});
    saveData();closeModal();render();toast('Invitation sent.');return;
  }
  if(form.id==='loginForm') {
    const fd=new FormData(form),username=String(fd.get('username')||'').trim(),password=String(fd.get('password')||'');
    if(backendConfigured) {
      const { error } = await backendClient.auth.signInWithPassword({email:usernameLoginEmail(username),password});
      if(error) { state.loginNotice='That username and password combination could not be found.';renderLogin();return; }
      try {
        await refreshRemoteState();
        if(!currentUser()) throw new Error('This account does not have a park profile. Ask an administrator to restore access.');
      } catch(error) {
        await backendClient.auth.signOut();
        state.loginNotice=error.message;renderLogin();return;
      }
      const destination=state.intendedRoute||'home';state.intendedRoute='home';toast(`Welcome, ${data.currentUser}.`);navigate(destination);return;
    }
    const user=data.users.find(u=>u.username.toLowerCase()===username.toLowerCase()&&u.password===password);
    if(!user) { state.loginNotice='That username and password combination could not be found.';renderLogin();return; }
    data.currentUser=user.username;saveData();const destination=state.intendedRoute||'home';state.intendedRoute='home';toast(`Welcome, ${user.username}.`);navigate(destination);return;
  }
  if(form.id==='registerForm') {
    const fd=new FormData(form),username=String(fd.get('username')||'').trim(),password=String(fd.get('password')||''),phone=String(fd.get('phone')||'').trim();
    let valid=true;setRegisterError('username','');setRegisterError('password','');$('#registerMessage').innerHTML='';
    if(!isUsernameValid(username)){setRegisterError('username','Use at least 8 characters and include an English letter.');valid=false;}
    else if(!backendConfigured&&!usernameAvailable(username)){setRegisterError('username','That username is already registered. Choose another.');valid=false;}
    if(!isPasswordValid(password)){setRegisterError('password','Use at least 8 characters, including uppercase, lowercase, and a number.');valid=false;}
    if(phone&&!/^[+0-9()\-\s]{8,20}$/.test(phone)){ $('#registerMessage').innerHTML='<div class="auth-message">Enter a valid telephone number or leave this field blank.</div>';translateUI($('#registerMessage'));valid=false; }
    if(!valid)return;
    if(backendConfigured) {
      try {
        await invokeAccountAction({action:'register',username,password,phone});
        const { error }=await backendClient.auth.signInWithPassword({email:usernameLoginEmail(username),password});
        if(error) throw error;
        await refreshRemoteState();
        toast('Your account is ready.');navigate(state.intendedRoute||'home');state.intendedRoute='home';
      } catch(error) {
        if(/already registered|already in use|duplicate/i.test(error.message)) setRegisterError('username','That username is already registered. Choose another.');
        else { $('#registerMessage').innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI($('#registerMessage')); }
      }
      return;
    }
    data.users.push({username,password,phone,role:'user'});data.currentUser=username;saveData();toast('Your account is ready.');navigate(state.intendedRoute||'home');state.intendedRoute='home';return;
  }
  if(form.id==='courtBookingForm') {
    const fd=new FormData(form),sportId=String(fd.get('sportId')),court=Number(fd.get('court')),date=String(fd.get('date')),start=Number(fd.get('start')),end=Number(fd.get('end'));
    let message='';
    if(!currentUser())message='Log in before making a queue.';
    else if(date<todayISO())message='Choose today or a future date.';
    else if(courtIsClosed(sportId,court))message='This court is out of service. Choose another court.';
    else if(start<420||end>1260||start>=end)message='Choose a valid time between 7:00 AM and 9:00 PM.';
    else if(date===todayISO()&&start<new Date().getHours()*60+new Date().getMinutes())message='That start time has already passed. Choose a future time.';
    else if(courtBookings(sportId,court,date).some(b=>start<b.end&&end>b.start))message='That time overlaps another queue. Please choose a different time.';
    if(message){$('#courtModalError').innerHTML=`<div class="auth-message">${escapeHTML(message)}</div>`;translateUI($('#courtModalError'));return;}
    if(backendConfigured) {
      try {
        await remoteRpc('park_make_court_booking',{p_sport_id:sportId,p_court_number:court,p_booking_date:date,p_start_minute:start,p_end_minute:end});
        closeModal();state.selectedDate=date;state.sportId=sportId;state.route='courtDetail';render();toast('Court queue confirmed.');
      } catch(error) { $('#courtModalError').innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI($('#courtModalError')); }
      return;
    }
    data.courtBookings.push({id:`q-${Date.now()}`,sportId,court,date,start,end,user:data.currentUser});saveData();closeModal();state.selectedDate=date;state.sportId=sportId;state.route='courtDetail';render();toast('Court queue confirmed.');return;
  }
  if(form.id==='equipmentBookingForm') {
    const fd=new FormData(form),equipmentId=String(fd.get('equipmentId')),date=String(fd.get('date')),time=Number(fd.get('time'));
    const item=equipmentRecords(state.equipmentSportId).find(x=>x.id===equipmentId);let message='';
    if(!currentUser())message='Log in before reserving equipment.';
    else if(date<todayISO())message='Choose today or a future date.';
    else if(date===todayISO()&&time<new Date().getHours()*60+new Date().getMinutes())message='That pickup time has passed. Choose a future time.';
    else if(!item||equipmentStatus(item,date)!=='idle')message=`This item is ${statusText(item?equipmentStatus(item,date):'broken')} and cannot be reserved.`;
    else if(data.equipmentBookings.some(b=>b.equipmentId===equipmentId&&b.date===date))message='That equipment is already reserved for this date.';
    if(message){$('#equipmentModalError').innerHTML=`<div class="auth-message">${escapeHTML(message)}</div>`;translateUI($('#equipmentModalError'));return;}
    if(backendConfigured) {
      try {
        await remoteRpc('park_make_equipment_booking',{p_equipment_id:equipmentId,p_booking_date:date,p_pickup_minute:time});
        state.equipmentDate=date;closeModal();render();toast('Equipment reserved.');
      } catch(error) { $('#equipmentModalError').innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI($('#equipmentModalError')); }
      return;
    }
    data.equipmentBookings.push({id:`e-${Date.now()}`,equipmentId,sportId:state.equipmentSportId,date,time,user:data.currentUser});saveData();state.equipmentDate=date;closeModal();render();toast('Equipment reserved.');return;
  }
  if(form.id==='adminEquipmentForm') {
    const fd=new FormData(form),equipmentId=String(fd.get('equipmentId')),status=String(fd.get('status')),date=String(fd.get('date')||state.adminDate),item=equipmentRecords(state.adminSportId).find(x=>x.id===equipmentId);
    if(!item){$('#adminEquipmentError').innerHTML='<div class="auth-message">Equipment item could not be found.</div>';translateUI($('#adminEquipmentError'));return;}
    if(backendConfigured) {
      const time=Number(fd.get('time')),pickedUpAt=String(fd.get('pickedUpAt')||'');
      try {
        await remoteRpc('park_admin_set_equipment_status',{
          p_equipment_id:equipmentId,p_status:status,
          p_username:status==='booked'?String(fd.get('user')||''):null,
          p_booking_date:status==='booked'?date:null,
          p_pickup_minute:status==='booked'?time:null,
          p_admin_date:state.adminDate,
          p_picked_up_at:status==='booked'&&pickedUpAt?pickedUpAt:null,
        });
        closeModal();renderParkAdmin();toast(status==='booked'?'Reservation and pickup details saved.':status==='broken'?'Equipment marked broken; reservations released.':'Equipment marked available; today’s reservation released.');
      } catch(error) { $('#adminEquipmentError').innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI($('#adminEquipmentError')); }
      return;
    }
    if(status==='booked') {
      const user=String(fd.get('user')||''),time=Number(fd.get('time')),pickedUpAt=String(fd.get('pickedUpAt')||'');
      if(!data.users.some(u=>u.username===user)){ $('#adminEquipmentError').innerHTML='<div class="auth-message">Choose a valid account for this reservation.</div>';translateUI($('#adminEquipmentError'));return; }
      if(!date||time<300||time>1260){ $('#adminEquipmentError').innerHTML='<div class="auth-message">Choose a valid pickup date and time during park hours.</div>';translateUI($('#adminEquipmentError'));return; }
      if(pickedUpAt&&(pickedUpAt<'05:00'||pickedUpAt>'21:00')){ $('#adminEquipmentError').innerHTML='<div class="auth-message">Actual pickup time must be between 5:00 AM and 9:00 PM.</div>';translateUI($('#adminEquipmentError'));return; }
      data.equipmentBookings=data.equipmentBookings.filter(b=>!(b.equipmentId===equipmentId&&(b.date===date||b.date===state.adminDate)));
      data.equipmentBookings.push({id:`staff-${Date.now()}`,equipmentId,sportId:item.sportId,date,time,user,pickedUpAt,staffManaged:true});
      data.equipmentOverrides[equipmentId]={status:'idle'};
    } else if(status==='idle') {
      data.equipmentBookings=data.equipmentBookings.filter(b=>!(b.equipmentId===equipmentId&&b.date===state.adminDate));
      data.equipmentOverrides[equipmentId]={status:'idle'};
    } else if(status==='broken') {
      data.equipmentBookings=data.equipmentBookings.filter(b=>b.equipmentId!==equipmentId);
      data.equipmentOverrides[equipmentId]={status:'broken'};
    }
    saveData();closeModal();renderParkAdmin();toast(status==='booked'?'Reservation and pickup details saved.':status==='broken'?'Equipment marked broken; reservations released.':'Equipment marked available; today’s reservation released.');return;
  }
  if(form.id==='changeUsernameForm') {
    const username=String(new FormData(form).get('username')||'').trim(),user=currentUser();
    if(!user)return;
    if(!isUsernameValid(username)){toast('Use at least 8 characters and include an English letter.',true);return;}
    if(!usernameAvailable(username,user.username)){toast('That username is already in use.',true);return;}
    if(backendConfigured) {
      try {
        await invokeAccountAction({action:'update',original:user.username,username,phone:user.phone||'',password:'',role:user.role});
        await refreshRemoteState();render();toast('Username updated.');
      } catch(error) { toast(error.message,true); }
      return;
    }
    const old=user.username;user.username=username;renameLocalUserReferences(old,username);data.currentUser=username;saveData();render();toast('Username updated.');return;
  }
  if(form.id==='userForm') {
    const fd=new FormData(form),original=String(fd.get('original')||''),username=String(fd.get('username')||'').trim(),password=String(fd.get('password')||''),user=original?data.users.find(u=>u.username===original):null;
    const role=isHead()&&fd.has('role')?String(fd.get('role')):(user?.role||'user');let message='';
    if(!isUsernameValid(username))message='Use at least 8 characters and include an English letter.';
    else if(!usernameAvailable(username,original))message='That username is already in use.';
    else if(!original&&!isPasswordValid(password))message='Password needs 8+ characters, uppercase, lowercase, and a number.';
    else if(password&&!isPasswordValid(password))message='Password needs 8+ characters, uppercase, lowercase, and a number.';
    else if(user?.role==='head'&&!isHead())message='Only the head account can change this account.';
    if(message){$('#userModalError').innerHTML=`<div class="auth-message">${escapeHTML(message)}</div>`;translateUI($('#userModalError'));return;}
    if(backendConfigured) {
      try {
        await invokeAccountAction({action:user?'update':'create',original:original||undefined,username,password,phone:user?.phone||'',role});
        await refreshRemoteState();closeModal();render();toast(user?'User updated.':'User added.');
      } catch(error) {
        const box=$('#userModalError');if(box){box.innerHTML=`<div class="auth-message">${escapeHTML(error.message)}</div>`;translateUI(box);}else toast(error.message,true);
      }
      return;
    }
    if(user) {
      const old=user.username;user.username=username;if(password)user.password=password;if(isHead()&&old!==data.currentUser&&user.role!=='head')user.role=role;
      if(old!==username){if(data.currentUser===old)data.currentUser=username;renameLocalUserReferences(old,username);}
    } else data.users.push({username,password,phone:'',role:'user'});
    saveData();closeModal();render();toast(user?'User updated.':'User added.');
  }
});

window.addEventListener('resize', () => { if(state.route==='home') requestAnimationFrame(drawActivityChart); });
initializeApp();
