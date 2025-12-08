# إصلاح قاعدة البيانات - Fix Database

## المشكلة
عند التسجيل، يظهر خطأ: 
```
Integrity constraint violation: 1452 Cannot add or update a child row: a foreign key constraint fails
```

## السبب
جدول `majors` فارغ ولا يحتوي على أي تخصصات.

## الحل
قم بتنفيذ هذه الخطوات في phpMyAdmin:

### الخطوة 1: افتح phpMyAdmin
1. اذهب إلى: http://localhost/phpmyadmin
2. قم بتسجيل الدخول (المستخدم: root، كلمة المرور: فارغة)

### الخطوة 2: اختر قاعدة البيانات
1. اضغط على `tsharok` من القائمة اليسرى
2. اضغط على تبويب `SQL`

### الخطوة 3: نفذ هذا الأمر SQL

```sql
-- إضافة التخصصات
INSERT IGNORE INTO majors (id, name, description) VALUES
(1, 'Computer Science', 'Study of computation, programming, and software development'),
(2, 'Information Systems', 'Integration of technology and business processes'),
(3, 'Software Engineering', 'Systematic approach to software development and maintenance'),
(4, 'Data Science', 'Analysis and interpretation of complex data'),
(5, 'Cybersecurity', 'Protection of computer systems and networks'),
(6, 'Artificial Intelligence', 'Development of intelligent computer systems'),
(7, 'Network Engineering', 'Design and implementation of computer networks'),
(8, 'Mathematics', 'Study of numbers, structures, and patterns');

-- التحقق من الإضافة
SELECT * FROM majors;
```

### الخطوة 4: اضغط "Go" أو "تنفيذ"

### الخطوة 5: تحقق من النتيجة
يجب أن ترى 8 سجلات في جدول `majors`.

## البديل: استخدام الملف SQL
أو يمكنك استيراد الملف مباشرة:
1. في phpMyAdmin، اضغط على `Import` / `استيراد`
2. اختر الملف: `database/insert_majors.sql`
3. اضغط `Go` / `تنفيذ`

## التحقق من نجاح العملية
بعد إضافة التخصصات، جرب التسجيل من جديد في:
http://localhost:8000/register.html

يجب أن يعمل التسجيل بدون مشاكل! ✅

