export class Task {
    constructor(
        public readonly id: string,
        public title: string,
        public content: string,
        public state: TaskStatus = TaskStatus.TODO, // قيمة افتراضية
        public priority: TaskPriority = TaskPriority.MEDIUM,
        public readonly createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public readonly userId: string, // صاحب المهمة
    ) { }
} 

export enum TaskStatus {
    TODO = "TODO",                 // لم يبدأ العمل عليها بعد
    IN_PROGRESS = "IN_PROGRESS",   // جاري العمل عليها
    IN_REVIEW = "IN_REVIEW",       // بانتظار مراجعة المدير أو الفريق
    COMPLETED = "COMPLETED",       // تم إنجاز المهمة
    BLOCKED = "BLOCKED",           // متوقفة بسبب عائق
    CANCELED = "CANCELED",         // تم إلغاؤها
}
export enum UserRole {
    ADMIN = "ADMIN",       // مدير النظام: إدارة الفرق والمهام والمستخدمين
    MANAGER = "MANAGER",   // قائد الفريق: إدارة مهام الفريق
    MEMBER = "MEMBER",     // عضو الفريق: تنفيذ المهام فقط
    VIEWER = "VIEWER",     // مستخدم يملك صلاحيات قراءة فقط 
    USER = 'USER'
}
export enum TaskPriority {
    LOW = "LOW",           // أولوية منخفضة
    MEDIUM = "MEDIUM",     // أولوية متوسطة
    HIGH = "HIGH",         // أولوية مرتفعة
    CRITICAL = "CRITICAL", // مهمة عاجلة جدًا
}
export enum TaskType {
    FEATURE = "FEATURE",   // إضافة ميزة جديدة
    BUG = "BUG",           // إصلاح خطأ
    IMPROVEMENT = "IMPROVEMENT", // تحسين نظام موجود
    RESEARCH = "RESEARCH", // دراسة أو بحث
}
export enum NotificationType {
    TASK_ASSIGNED = "TASK_ASSIGNED",   // تعيين مهمة جديدة
    TASK_UPDATED = "TASK_UPDATED",     // تعديل حالة أو تفاصيل المهمة
    TASK_COMPLETED = "TASK_COMPLETED", // اكتمال مهمة
    TEAM_INVITE = "TEAM_INVITE",       // دعوة للانضمام لفريق
    SYSTEM_ALERT = "SYSTEM_ALERT",     // تنبيه من النظام
}
export enum TeamRole {
    OWNER = "OWNER",     // صاحب الفريق
    LEADER = "LEADER",   // قائد الفريق
    MEMBER = "MEMBER",   // عضو عادي
    GUEST = "GUEST",     // ضيف (قراءة فقط)
}
export enum ProjectStatus {
    ACTIVE = "ACTIVE",       // مشروع نشط
    ON_HOLD = "ON_HOLD",     // مؤجل
    COMPLETED = "COMPLETED", // تم الانتهاء منه
    CANCELED = "CANCELED",   // تم إلغاؤه
}
export enum ActivityType {
    TASK_CREATED = "TASK_CREATED",
    TASK_UPDATED = "TASK_UPDATED",
    TASK_DELETED = "TASK_DELETED",
    USER_JOINED = "USER_JOINED",
    USER_LEFT = "USER_LEFT",
    COMMENT_ADDED = "COMMENT_ADDED",
}
