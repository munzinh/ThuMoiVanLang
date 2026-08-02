# Thư Mời Tốt Nghiệp 🎓

Trang web thư mời tham dự lễ bảo vệ đồ án tốt nghiệp, thiết kế theo phong cách **Pixel Art**.

## Tính năng

- 🎨 Phong cách Pixel Art độc đáo
- 🔗 Mỗi khách mời có link riêng (`/ten-khach-moi`)
- ⚙️ Trang Admin để quản lý danh sách khách
- 📱 Responsive trên mobile
- ✨ Hiệu ứng confetti pixel khi mở thư mời

## Cài đặt

```bash
npm install
npm run dev
```

## Cập nhật thông tin

Chỉnh sửa file [`config/event.ts`](./config/event.ts) để cập nhật:
- Tên, thời gian, địa điểm buổi lễ
- Link Google Maps & bãi đỗ xe
- Số điện thoại liên hệ
- Mật khẩu admin

## Sử dụng

1. Truy cập `/admin` → đăng nhập → thêm tên khách mời
2. Copy link và gửi cho từng người (link dạng `/ten-khach-moi`)
3. Mỗi người mở link sẽ thấy thư mời có tên của họ

## Deploy lên Vercel

```bash
# Push lên GitHub trước
git add .
git commit -m "Initial commit"
git push

# Sau đó connect repo với Vercel tại vercel.com
```

> **Lưu ý Vercel**: Vercel dùng serverless functions, nên file `data/guests.json` sẽ bị reset khi redeploy.
> Khuyến nghị dùng [Vercel KV](https://vercel.com/storage/kv) hoặc [PlanetScale](https://planetscale.com/) cho production.
