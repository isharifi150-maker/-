# Changes included

- Removed browser `localStorage` session persistence and the entire IndexedDB/`idb` data layer.
- `employees`, `evidence`, `evaluations`, and `school_settings` now use the Supabase client directly.
- Evaluation criterion scores are persisted inside `evaluations.scores` (`jsonb`).
- Evidence files upload directly to the `employee-evidence` Storage bucket; cloud URLs and storage paths are stored in `evidence`.
- Deleting evidence also deletes the Storage object. Deleting an employee removes related Storage objects; database relations cascade.
- Added cloud sync/loading indicators and error toasts on data-heavy screens.
- Added responsive hamburger navigation, mobile drawer, mobile bottom-sheet modals, responsive action buttons/cards, and reduced table columns at small breakpoints to avoid page-level horizontal scrolling.
- Added `supabase/schema.sql` and setup instructions.

## Build note
The source was syntax-checked across all TS/TSX files. A fresh `dist` is intentionally not bundled because the execution environment could not complete an npm dependency install; this avoids shipping the old pre-change build. Run `npm install && npm run build` after setup to create `dist`.

## تصميم شاشة الدخول
- حذف صندوق بيانات الدخول الافتراضية الظاهر للمستخدم من شاشة تسجيل الدخول.
- استبدال نص التذييل `وزارة التعليم، المملكة العربية السعودية` بـ `مدرسة أم الشعنون`.
