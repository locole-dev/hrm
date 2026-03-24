# HRM Project Phases

## Overview

Tai lieu nay luu lai pham vi va muc tieu cho du an HRM noi bo cua cong ty.

Gia dinh hien tai:
- San pham la web app noi bo cho cong ty
- Frontend dung React
- Backend dung Node.js
- Database se uu tien PostgreSQL
- Uu tien dua he thong vao dung som o Phase 1, sau do mo rong o Phase 2

## Product Goal

Xay dung mot he thong HRM co the tap trung du lieu nhan su, so hoa van hanh HR hang ngay, va mo rong dan sang tuyen dung, danh gia, phat trien nhan su.

## User Groups

- `Super Admin`: cau hinh he thong, quan ly toan bo du lieu
- `HR`: quan ly ho so nhan vien, hop dong, nghi phep, bang luong
- `Manager`: duyet don, theo doi nhan su trong team
- `Payroll`: xu ly ky luong va phieu luong
- `Employee`: su dung cac chuc nang tu phuc vu

## Phase Structure

### Phase 1: Core Operations

Muc tieu:
- Tao nguon du lieu nhan su tap trung
- So hoa van hanh HR hang ngay
- Ket noi cong, phep, luong tren cung mot he thong

Pham vi:
- Employee management
- Organization structure
- Authentication va RBAC
- Attendance
- Leave management
- Payroll co ban
- Reporting co ban
- Notification co ban

Chi tiet module:

#### 1. Employee Management
- Ho so nhan vien
- Ma nhan vien
- Thong tin ca nhan va lien he
- Phong ban, chuc vu, cap bac
- Trang thai lam viec
- Hop dong lao dong co ban
- Lich su cong tac
- Tep dinh kem ho so

#### 2. Organization Structure
- Cong ty
- Chi nhanh
- Phong ban
- Chuc vu
- Quan he quan ly

#### 3. Authentication and RBAC
- Dang nhap
- Doi mat khau
- Quen mat khau
- Phan quyen theo role
- Phan quyen theo module
- Phan quyen theo phong ban du lieu

#### 4. Attendance
- Check-in va check-out
- Ca lam viec
- Lich lam
- Ghi nhan OT co ban
- Theo doi di muon, ve som
- Bang cong thang
- Dieu chinh cong boi HR

#### 5. Leave Management
- Tao don nghi phep
- Nhieu loai nghi
- So du phep
- Quy trinh duyet
- Huy don
- Lich su nghi phep

#### 6. Payroll
- Cau hinh ky luong
- Cong thuc luong co ban
- Phu cap
- Thuong
- Khau tru
- Dong bo du lieu cong va phep
- Phieu luong
- Export bang luong

#### 7. Reporting
- Tong quan nhan su
- Bao cao cong
- Bao cao nghi phep
- Bao cao luong
- Bao cao theo phong ban

#### 8. Notification
- Thong bao duyet don
- Nhac cham cong
- Thong bao phieu luong
- Thong bao he thong

Deliverables ket thuc Phase 1:
- Web app noi bo co the su dung boi HR, manager, employee
- Du lieu nhan su tap trung
- Van hanh cong, phep, luong co ban tren he thong

### Phase 2: Talent and Growth

Muc tieu:
- Mo rong tu quan ly hanh chinh sang quan ly vong doi nhan su
- Ho tro tuyen dung, onboarding, danh gia hieu suat, va phat trien nhan su

Pham vi:
- Recruitment
- Onboarding
- Performance management
- Learning and development

Chi tiet module:

#### 1. Recruitment
- Tao yeu cau tuyen dung
- Tin tuyen dung
- Danh sach ung vien
- Pipeline ung vien
- Lich phong van
- Ket qua phong van
- Offer

#### 2. Onboarding
- Checklist nhan viec
- Ban giao tai khoan
- Ban giao thiet bi
- Tai lieu onboarding
- Theo doi trang thai hoan thanh

#### 3. Performance Management
- Chu ky danh gia
- Mau danh gia
- KPI va OKR co ban
- Tu danh gia
- Manager review
- Tong hop ket qua

#### 4. Learning and Development
- Ho so dao tao
- Ky nang va nang luc
- Khoa hoc noi bo
- Lo trinh phat trien
- Lich su hoc tap

Deliverables ket thuc Phase 2:
- He thong HRM bao phu tuyen dung, van hanh, danh gia, phat trien nhan su
- Co nen tang du lieu de ho tro quyet dinh nhan su dai han

## Recommended Release Order

1. Phase 1 MVP
2. Phase 1 hardening and reporting
3. Phase 2 recruitment and onboarding
4. Phase 2 performance and development

## Out of Scope for Initial Release

- Workflow builder dong
- Mobile app rieng
- Payroll engine qua dac thu cho nhieu quoc gia
- Tich hop sinh trac hoc phuc tap
- AI scoring va du doan nhan su

## Key Risks

- Quy trinh nghiep vu HR chua duoc chot ro truoc khi build
- Rule tinh luong co the thay doi theo cong ty
- Du lieu nhan vien cu dang nam o Excel va kho dong bo
- Phan quyen sai se anh huong den bao mat du lieu nhay cam

## Next Document

Tai lieu plan chi tiet cho giai doan trien khai tiep theo duoc luu tai:
- `docs/PLAN-phase1-hrm.md`
