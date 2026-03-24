# T01 Phase 1 Business Rules

## Overview

Tai lieu nay dinh nghia business rules cho Phase 1 cua du an HRM.
Muc tieu cua tai lieu:
- Khoa scope nghiep vu truoc khi thiet ke schema
- Tao nguon tham chieu chung cho backend, frontend, database, va QA
- Ghi ro gia dinh hien tai va cac diem can xac nhan voi cong ty

Phan nay bao phu:
- Employee management
- Organization structure
- Authentication and RBAC
- Attendance
- Leave management
- Payroll co ban
- Reporting
- Notification

## Rule Priority

Neu co xung dot, uu tien theo thu tu:
1. Van ban quy dinh noi bo cua cong ty
2. Tai lieu nay
3. Quy tac tam thoi trong code hoac test

## Global Assumptions

- He thong phuc vu mot cong ty trong giai doan dau
- Cong ty hien co 1 chi nhanh tai Ha Noi
- Phase 1 khong can tach du lieu theo chi nhanh
- Co the mo rong nhieu chi nhanh trong cac phase sau neu can
- Mui gio mac dinh cua he thong la `Asia/Bangkok`
- Don vi tien te mac dinh la `VND`
- Nhan vien moi co duy nhat 1 ma nhan vien
- Moi nhan vien gan voi 1 phong ban chinh va 1 chuc vu hien tai
- Payroll cua Phase 1 chi la payroll co ban theo cong thuc, chua xu ly cac case dac thu phuc tap

## Glossary

- `Employee`: Nhan vien co ho so trong he thong
- `User`: Tai khoan dang nhap vao he thong
- `Manager`: Nguoi co quyen xem va duyet du lieu cua team duoc giao
- `Attendance Record`: Ban ghi cham cong trong ngay
- `Shift`: Cau hinh ca lam viec
- `Leave Request`: Don xin nghi phep
- `Payroll Period`: Ky luong theo thang
- `Payslip`: Phieu luong cua 1 nhan vien trong 1 ky

## Role Model

### Super Admin
- Quan ly toan bo cau hinh he thong
- Toan quyen tren moi module
- Co quyen gan role va phan quyen

### HR
- Quan ly ho so nhan vien
- Quan ly phong ban, chuc vu, hop dong
- Xem va dieu chinh du lieu cong neu duoc cap quyen
- Tao va xem bao cao HR

### Manager
- Xem danh sach nhan vien thuoc pham vi team duoc giao
- Duyet hoac tu choi don nghi
- Xem thong tin cham cong cua team

### Payroll
- Quan ly ky luong
- Tao bang luong
- Xem phieu luong va export bang luong

### Employee
- Dang nhap
- Xem ho so ca nhan
- Check-in va check-out
- Tao va theo doi don nghi
- Xem phieu luong cua chinh minh

## Module Rules

### 1. Employee Management

#### Core Rules
- Moi nhan vien phai co `employee_code` duy nhat
- Moi nhan vien phai co trang thai hoat dong
- Trang thai hop le gom:
  - `draft`
  - `active`
  - `inactive`
  - `probation`
  - `resigned`
  - `terminated`
- Nhan vien chi duoc dang nhap khi:
  - Co tai khoan user active
  - Ho so nhan vien khong o trang thai `terminated`

#### Required Fields
- Ma nhan vien
- Ho va ten
- Ngay sinh
- Gioi tinh
- Email cong ty
- So dien thoai
- Ngay vao lam
- Phong ban
- Chuc vu
- Loai hop dong
- Trang thai lam viec

#### Optional Fields
- Dia chi
- So CCCD/CMND
- So tai khoan ngan hang
- Nguoi lien he khan cap
- Tep dinh kem

#### Data Rules
- Email cong ty phai duy nhat tren toan he thong
- Ngay vao lam khong duoc lon hon ngay hien tai khi kich hoat ho so
- Nhan vien da `resigned` hoac `terminated` khong duoc tao attendance moi
- Xoa nhan vien theo kieu soft delete hoac inactive, khong xoa cung du lieu lich su

#### Access Rules
- HR va Super Admin xem duoc tat ca nhan vien
- Manager chi xem duoc nhan vien trong team duoc gan
- Employee chi xem va sua duoc cac truong ca nhan duoc cho phep cua chinh minh

### 2. Organization Structure

#### Core Rules
- He thong ho tro:
  - Cong ty
  - Chi nhanh
  - Phong ban
  - Chuc vu
- Moi nhan vien phai thuoc it nhat 1 phong ban
- Moi phong ban co the co 1 manager chinh
- Cung 1 phong ban khong duoc co 2 ban ghi cung ten neu cung chi nhanh

#### Change Rules
- Khi nhan vien chuyen phong ban, he thong phai luu lich su dieu chuyen
- Khi manager phong ban thay doi, cac luong duyet moi phai dung manager moi
- Ban ghi lich su cu khong bi sua de tranh mat audit

### 3. Authentication and RBAC

#### Authentication Rules
- Dang nhap bang email cong ty va mat khau
- Mat khau phai duoc ma hoa, khong luu plain text
- User co the reset mat khau qua luong reset an toan
- Session dang nhap het han theo cau hinh he thong

#### Authorization Rules
- Quyen truy cap dua tren role
- Co the bo sung phan quyen theo module hoac action neu can
- Moi API can co kiem tra quyen truoc khi xu ly nghiep vu
- Moi man hinh frontend can an chuc nang neu user khong co quyen

#### Audit Rules
- Dang nhap thanh cong va that bai nen duoc log
- Thay doi role va permission phai duoc audit
- Xem du lieu nhay cam co the duoc audit o phase hardening neu can

### 4. Attendance

#### Attendance Model
- Cham cong theo ngay
- Moi ngay cua moi nhan vien co toi da 1 attendance record tong hop
- Attendance record co the chua:
  - Gio check-in dau tien
  - Gio check-out cuoi cung
  - Tong gio lam
  - Trang thai cham cong
  - Ghi chu dieu chinh

#### Standard Work Rules
- He thong ho tro ca lam viec co gio bat dau va gio ket thuc
- Ca lam viec mac dinh trong Phase 1 la `09:00 - 18:00`
- Mac dinh 1 nhan vien co 1 ca lam viec chinh
- Co the override ca theo ngay neu HR hoac manager duoc cap quyen

#### Check-in and Check-out Rules
- Nhan vien chi duoc check-in 1 lan hop le de bat dau ngay lam viec
- Neu co nhieu check-in/check-out, he thong luu log su kien va sinh 1 ket qua tong hop
- Check-out truoc check-in la khong hop le
- Attendance co the duoc tao bang tay boi HR trong truong hop bo sung cong

#### Status Rules
- Trang thai attendance goi y:
  - `present`
  - `late`
  - `early_leave`
  - `absent`
  - `leave`
  - `holiday`
  - `weekend`
- Di muon duoc tinh khi gio check-in sau `09:05`
- Ve som duoc tinh khi gio check-out truoc `17:55`

#### Overtime Rules
- OT chi duoc tinh sau `18:30`
- OT phai duoc manager approve moi duoc dua vao payroll
- He so OT:
  - Weekday: `1.5x`
  - Weekend: `2.0x`
  - Holiday: `3.0x`
- OT chua duoc approve chi duoc luu o trang thai cho duyet, khong duoc tinh luong
- Trong MVP, OT qua dem chua tach thanh rule rieng
- Tam thoi tinh OT dua tren tong so gio OT hop le trong ky tinh cong

#### Adjustment Rules
- HR co quyen dieu chinh cong
- Moi dieu chinh cong phai luu:
  - Nguoi sua
  - Ly do
  - Gia tri truoc
  - Gia tri sau
  - Thoi gian sua

#### Attendance Deduction Rules
- Attendance deduction duoc tinh theo thoi gian thieu thuc te, uu tien theo gio hoac theo phut
- He thong can cho phep cau hinh nguong quy doi tu thoi gian thieu sang don vi ngay cong
- Vi du:
  - Di muon qua nguong X phut co the bi tru `0.25 ngay`
  - Di muon qua nguong cao hon co the bi tru `0.5 ngay`
- Cong thuc va nguong quy doi phai duoc cau hinh, khong hardcode

#### Validation Rules
- Nhan vien `inactive`, `resigned`, `terminated` khong duoc cham cong moi
- Khong tao attendance cho ngay truoc ngay vao lam
- He thong khong tu dong quyet dinh OT phuc tap trong Phase 1

### 5. Leave Management

#### Leave Types
- He thong ho tro nhieu loai nghi
- Toi thieu gom:
  - Nghi phep nam
  - Nghi khong luong
  - Nghi om
  - Nghi khac

#### Request Rules
- Nhan vien co the tao don nghi cho chinh minh
- Don nghi phai co:
  - Loai nghi
  - Tu ngay
  - Den ngay
  - So ngay nghi
  - Ly do
- Don nghi khong hop le neu `from_date > to_date`
- Don nghi khong duoc overlap voi don nghi da duoc duyet cua cung nhan vien

#### Approval Rules
- Luong duyet mac dinh:
  - Employee gui don
  - Manager duyet cap 1
  - HR xem thong tin va theo doi
- He thong ho tro cac trang thai:
  - `pending`
  - `approved`
  - `rejected`
  - `cancelled`
- Don da `approved` chi duoc huy theo rule duoc cho phep

#### Leave Balance Rules
- Nghi phep nam dung so du phep
- Nghi khong luong khong tru vao so du phep
- Chinh sach phep nam la `12 ngay / nam`
- Phep nam duoc cong don theo thang, mac dinh `1 ngay / thang`
- So du phep duoc reset theo nam tai thoi diem cau hinh cua cong ty
- Phase 1 cho phep HR cap nhat so du phep bang tay

#### Attendance Integration
- Don nghi da duoc duyet se anh huong den bang cong
- Ngay nghi hop le khong bi tinh `absent`
- Don nghi bi huy hoac tu choi khong tao tac dong payroll

### 6. Payroll

#### Scope Rule
- Payroll trong Phase 1 bao gom:
  - Luong co ban
  - Attendance deduction
  - OT da duyet
  - Bao hiem `BHXH`, `BHYT`, `BHTN`
  - Thue `TNCN`
- Chua bao gom:
  - Payroll da don vi tien te
  - Rule payroll da quoc gia
  - Cong thuc phuc tap ngoai chinh sach hien tai

#### Payroll Period Rules
- Moi payroll period co:
  - Thang
  - Nam
  - Tu ngay
  - Den ngay
  - Trang thai
- Trang thai goi y:
  - `draft`
  - `processing`
  - `locked`
  - `published`
- Moi nhan vien chi co toi da 1 payslip trong 1 payroll period

#### Payroll Formula Rules
- Luong co ban la thanh phan nen
- Payroll co the gom:
  - Base salary
  - Allowances
  - Bonuses
  - Attendance deductions
  - Approved overtime pay
  - Insurance deductions
  - Personal income tax
  - Deductions
- Cong thuc tinh tam thoi:
  - Gross = base salary + allowances + bonuses + approved overtime pay
  - Pre-tax income = gross - insurance deductions - attendance deductions
  - Net = pre-tax income - personal income tax - other deductions
- Attendance deductions, insurance, va tax duoc phep tinh theo cong thuc cau hinh
- OT chi duoc dua vao payroll neu da duoc manager approve

#### Locking Rules
- Khi ky luong o trang thai `locked`, khong cho sua du lieu payslip tru nguoi co quyen dac biet
- Khi payslip da `published`, employee co the xem phieu luong cua minh
- Moi mo khoa ky luong phai duoc audit
- Chi `HR Manager` va `Admin` co quyen lock hoac unlock payroll period

#### Input Rules
- Payroll su dung du lieu attendance va leave da chot
- Neu du lieu cong chua chot, he thong khong nen chay payroll final
- Payroll co the chay ban nhap de kiem tra truoc khi publish
- Insurance va tax can duoc tinh tren bo du lieu da chot cua ky luong

### 7. Reporting

#### Access Rules
- HR va Super Admin xem tat ca bao cao
- Manager chi xem bao cao trong pham vi team
- Employee khong xem bao cao tong hop HR

#### Minimum Reports
- Tong so nhan vien
- Nhan vien theo phong ban
- Attendance summary theo thang
- Leave summary theo thang
- Payroll summary theo ky

#### Export Rules
- Export toi thieu ho tro `CSV` hoac `Excel`
- File export can phan quyen giong voi du lieu nguon
- Export du lieu nhay cam phai duoc audit neu la payroll

### 8. Notification

#### Event Rules
- Tao thong bao khi:
  - Don nghi moi duoc gui
  - Don nghi duoc duyet hoac tu choi
  - Den han cham cong neu co chinh sach nhac
  - Phieu luong duoc publish

#### Delivery Rules
- Phase 1 uu tien thong bao trong he thong
- MVP chi can thong bao trong he thong
- Email notification de phase sau

#### Visibility Rules
- User chi nhan duoc thong bao lien quan den quyen va nghiep vu cua minh

### 9. Holiday Calendar

#### Configuration Rules
- Holiday calendar duoc HR cau hinh theo tung nam
- He thong khong hardcode lich nghi co dinh
- Moi ngay le can co:
  - Ten ngay le
  - Ngay ap dung
  - Loai ngay
  - Mo ta neu can

#### Usage Rules
- Holiday calendar anh huong den:
  - Attendance status
  - Leave validation
  - Overtime multiplier
  - Payroll tinh cong neu co ap dung

### 10. Insurance and Tax Configuration

#### Configuration Rules
- He thong phai ho tro cau hinh rule cho:
  - `BHXH`
  - `BHYT`
  - `BHTN`
  - `TNCN`
- Rule bao hiem va thue can ho tro versioning theo nam
- Moi bo rule can co:
  - Nam ap dung
  - Ngay hieu luc
  - Trang thai hoat dong
  - Tham so tinh toan

#### Usage Rules
- Payroll period phai su dung bo rule bao hiem va thue co hieu luc tai thoi diem tinh luong
- Khong duoc sua bo rule da ap dung cho ky luong da khoa ma khong co audit
- Co the luu snapshot rule vao payslip hoac payroll run de doi soat ve sau

## Cross-Module Rules

### Employee Lifecycle
- Nhan vien moi co the o trang thai `draft` truoc khi chinh thuc kich hoat
- Khi nhan vien chuyen sang `active`, co the dang nhap va su dung chuc nang cho phep
- Khi nhan vien `resigned` hoac `terminated`:
  - Khoa dang nhap
  - Giu lai lich su cong, nghi, luong
  - Khong tao giao dich moi

### Data Retention
- Khong xoa cung du lieu payroll, attendance, leave, audit
- Ban ghi nhay cam nen duoc giu de phuc vu doi soat va kiem toan

### Audit Requirements
- Can audit toi thieu cho:
  - Tao, sua, khoa payslip hoac payroll period
  - Dieu chinh attendance
  - Duyet va tu choi leave
  - Sua role hoac quyen
  - Sua thong tin nhan vien nhay cam

## Sad Paths and Edge Cases

- Employee quen check-out
  - He thong danh dau can xu ly va HR co the dieu chinh
- Employee gui don nghi trung ngay da cham cong
  - He thong can canh bao va ap dung rule uu tien theo trang thai duyet
- Employee da nghi viec nhung van con don pending
  - HR can xu ly don truoc khi dong ho so
- Manager khong ton tai hoac thay doi trong luc don dang pending
  - HR hoac manager moi duoc tiep quan xu ly
- Payroll period dang bi locked nhung attendance bi sua
  - Can mo khoa co audit truoc khi tinh lai

## MVP vs Later

### MUST in Phase 1
- Ho so nhan vien
- Phong ban va chuc vu
- Dang nhap va RBAC
- Attendance co ban
- Leave request va approval co ban
- Payroll co ban
- Bao cao tong hop co ban

### SHOULD in Phase 1
- Audit log ro rang
- Export Excel
- Notification trong he thong
- Reset password an toan
- Insurance va tax configurable

### WON'T in Phase 1
- Recruitment
- Onboarding
- Performance review
- Learning and development
- Workflow builder
- Mobile app rieng

## Acceptance Criteria Summary

- Business rules duoc ghi lai cho tat ca module in-scope
- Co phan role va access ro rang
- Co quy tac tich hop giua attendance, leave, payroll
- Co danh sach edge cases chinh de phuc vu schema va test
- Co danh sach out-of-scope ro rang de tranh scope creep

## Confirmed Decisions

- Cong ty hien co `1 chi nhanh` tai Ha Noi, chua can tach du lieu theo chi nhanh trong Phase 1
- Gio lam viec mac dinh la `09:00 - 18:00`
- Di muon sau `09:05`
- Ve som truoc `17:55`
- OT tinh sau `18:30` va can manager approve
- He so OT:
  - Weekday `1.5x`
  - Weekend `2.0x`
  - Holiday `3.0x`
- Nhan vien co `12 ngay phep / nam`, cong don `1 ngay / thang`
- Attendance deduction nen tinh theo gio hoac theo phut, sau do quy doi theo ngay cong bang rule cau hinh
- Payroll Phase 1 phai tinh:
  - Luong co ban
  - Attendance deduction
  - OT
  - BHXH
  - BHYT
  - BHTN
  - TNCN
- MVP tam thoi chua tach rieng rule OT qua dem, OT duoc tinh theo tong so gio hop le
- Holiday calendar duoc HR cau hinh theo tung nam trong he thong
- Rule `BHXH`, `BHYT`, `BHTN`, `TNCN` can ho tro versioning theo nam
- `HR Manager` va `Admin` co quyen lock/unlock payroll period
- MVP chi can `in-app notification`

## Remaining Open Questions

- Nguong quy doi attendance deduction cu the se la bao nhieu phut -> `0.25 ngay`, `0.5 ngay`, hoac `1 ngay`?
- Holiday calendar co can ho tro nua ngay nghi hay chi full-day?
- Payslip co can luu snapshot chi tiet tung khoan bao hiem va tax theo rule version nao khong?

## Recommended Next Step

Sau khi cong ty xac nhan cac open questions, co the chuyen sang:
1. ERD va schema database
2. API contract cho auth, employees, attendance, leave, payroll
3. UI flow cho HR, Manager, Employee
