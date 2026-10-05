import type { EvaluationForm, FormType } from './types';

// The 11 base teaching criteria (shared across teacher-type forms)
const baseTeacherCriteria = [
  { id: 't1', label: 'أداء الواجبات الوظيفية', weight: 10 },
  { id: 't2', label: 'التفاعل مع المجتمع المهني', weight: 10 },
  { id: 't3', label: 'التفاعل مع أولياء الأمور', weight: 10 },
  { id: 't4', label: 'التنوع في استراتيجيات التدريس', weight: 10 },
  { id: 't5', label: 'تحسين نتائج المتعلمين', weight: 10 },
  { id: 't6', label: 'إعداد وتنفيذ خطة التعلم', weight: 10 },
  { id: 't7', label: 'توظيف تقنيات ووسائل التعلم المناسبة', weight: 10 },
  { id: 't8', label: 'تهيئة بيئة تعليمية', weight: 5 },
  { id: 't9', label: 'الإدارة الصفية', weight: 5 },
  { id: 't10', label: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم', weight: 10 },
  { id: 't11', label: 'تنوع أساليب التقويم', weight: 10 },
];

export const EVALUATION_FORMS: Record<FormType, EvaluationForm> = {
  teacher: {
    type: 'teacher',
    name: 'النموذج الأول: معلم (النموذج العام)',
    shortName: 'معلم',
    description: '11 بنداً للمعلم العادي',
    icon: 'GraduationCap',
    criteria: baseTeacherCriteria,
  },
  teacher_activity: {
    type: 'teacher_activity',
    name: 'النموذج الثاني: معلم مسند له نشاط طلابي',
    shortName: 'معلم + نشاط طلابي',
    description: '15 بنداً - البنود التعليمية + بنود النشاط الطلابي',
    icon: 'Trophy',
    criteria: [
      ...baseTeacherCriteria,
      { id: 'a1', label: 'إعداد خطة مزمنة ومعتمدة لبرامج وفعاليات النشاط الطلابي', weight: 10 },
      { id: 'a2', label: 'تهيئة البيئة المدرسية للبرامج والأنشطة الطلابية', weight: 5 },
      { id: 'a3', label: 'يدعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة', weight: 5 },
      { id: 'a4', label: 'يحفز المتعلمين على المشاركة في الأنشطة المدرسية', weight: 10 },
    ],
  },
  teacher_health: {
    type: 'teacher_health',
    name: 'النموذج الثالث: معلم مسند له توجيه صحي',
    shortName: 'معلم + توجيه صحي',
    description: '14 بنداً - البنود التعليمية + بنود التوجيه الصحي',
    icon: 'HeartPulse',
    criteria: [
      ...baseTeacherCriteria,
      { id: 'h1', label: 'تنفيذ الخطة المشتركة للبرامج الصحية المدرسية', weight: 15 },
      { id: 'h2', label: 'حصر الحالات الصحية للمتعلمين', weight: 5 },
      { id: 'h3', label: 'تهيئة البيئة الصحية المدرسية', weight: 10 },
    ],
  },
  lab_keeper: {
    type: 'lab_keeper',
    name: 'النموذج الرابع: محضر مختبر',
    shortName: 'محضر مختبر',
    description: '13 بنداً لمحضر المختبر',
    icon: 'FlaskConical',
    criteria: [
      { id: 'l1', label: 'أداء الواجبات الوظيفية', weight: 10 },
      { id: 'l2', label: 'التفاعل مع المجتمع المهني', weight: 10 },
      { id: 'l3', label: 'التفاعل مع أولياء الأمور', weight: 10 },
      { id: 'l4', label: 'التنوع في استراتيجيات التدريس', weight: 10 },
      { id: 'l5', label: 'تحسين نتائج المتعلمين', weight: 10 },
      { id: 'l6', label: 'يعد خطة يومية لأنشطة المختبر', weight: 5 },
      { id: 'l7', label: 'المعرفة بالأصل والمفاهيم الفنية', weight: 5 },
      { id: 'l8', label: 'يوفر المستلزمات اللازمة لأداء التجارب العلمية', weight: 5 },
      { id: 'l9', label: 'يلتزم بسياسات وإجراءات السلامة المهنية', weight: 5 },
      { id: 'l10', label: 'يحضر ويجهز المختبر', weight: 5 },
      { id: 'l11', label: 'تهيئة وتسليم الأجهزة المطلوبة للمعلمين وتخزينها بطريقة سليمة', weight: 5 },
      { id: 'l12', label: 'يعد تقرير أنشطة ومهام المختبر الأسبوعية', weight: 10 },
      { id: 'l13', label: 'يعد تقارير دورية عن حالة الأجهزة والمعدات', weight: 10 },
    ],
  },
  student_guide: {
    type: 'student_guide',
    name: 'النموذج الخامس: الموجه الطلابي',
    shortName: 'موجه طلابي',
    description: '13 بنداً للموجه الطلابي',
    icon: 'Compass',
    criteria: [
      { id: 'g1', label: 'أداء الواجبات الوظيفية', weight: 20 },
      { id: 'g2', label: 'التفاعل مع المجتمع المهني', weight: 5 },
      { id: 'g3', label: 'التفاعل مع أولياء الأمور', weight: 5 },
      { id: 'g4', label: 'يقدم التدخلات المناسبة لتعزيز الانضباط', weight: 5 },
      { id: 'g5', label: 'تقديم برامج تربوية لتعزيز دافعية الطلبة للتعلم', weight: 5 },
      { id: 'g6', label: 'إعداد خطة لبرامج التوجيه الطلابي', weight: 10 },
      { id: 'g7', label: 'يصنف الحالات ويقدم برامج الدعم المناسبة', weight: 10 },
      { id: 'g8', label: 'يعزز القيم والسلوكيات للمتعلمين', weight: 10 },
      { id: 'g9', label: 'يقدم التدخلات النفسية والاجتماعية', weight: 10 },
      { id: 'g10', label: 'يساعد المتعلمين على التخطيط المهني والتعليمي', weight: 5 },
      { id: 'g11', label: 'يعزز التفوق الدراسي', weight: 5 },
      { id: 'g12', label: 'يقدم تدخلات تربوية للمتأخرين دراسياً والمعيدين', weight: 5 },
      { id: 'g13', label: 'توعية المتعلمين وأولياء أمورهم بقواعد السلوك والمواظبة', weight: 5 },
    ],
  },
};

export const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف جداً',
  2: 'ضعيف',
  3: 'مقبول',
  4: 'جيد',
  5: 'ممتاز',
};

export const RATING_COLORS: Record<number, string> = {
  1: 'bg-error-100 text-error-700 border-error-300',
  2: 'bg-warning-100 text-warning-700 border-warning-300',
  3: 'bg-accent-100 text-accent-700 border-accent-300',
  4: 'bg-primary-100 text-primary-700 border-primary-300',
  5: 'bg-success-100 text-success-700 border-success-300',
};

export function getRatingLabel(score: number): string {
  if (score >= 4.5) return 'ممتاز';
  if (score >= 3.5) return 'جيد جداً';
  if (score >= 2.5) return 'جيد';
  if (score >= 1.5) return 'مقبول';
  if (score >= 0.5) return 'ضعيف';
  return 'غير مقيّم';
}

export function getRatingColor(score: number): string {
  if (score >= 4.5) return 'text-success-600';
  if (score >= 3.5) return 'text-primary-600';
  if (score >= 2.5) return 'text-accent-600';
  if (score >= 1.5) return 'text-warning-600';
  return 'text-error-600';
}
