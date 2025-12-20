# Jewelry Inventory Pro - 库存管家

珠宝库存管理小程序，支持微信小程序和Web端双平台运行。

## 项目结构

```
jewelry-inventory-pro/
├── src/                    # Web 端源码（电脑端后台管理界面）
│   ├── components/         # UI组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # 数据服务
│   └── ...
├── taro-app/               # 小程序端源码
│   ├── cloud/              # 云函数
│   │   ├── inventory/      # 库存管理
│   │   ├── transactions/   # 交易记录
│   │   └── costs/          # 成本管理
│   ├── src/
│   │   ├── pages/          # 页面
│   │   ├── services/       # 云服务封装
│   │   ├── types/          # 类型定义
│   │   └── constants/      # 常量配置
│   └── project.config.json # 小程序配置
└── README.md
```

## 功能特性

- **库存管理**: 查看、搜索商品库存
- **出入库登记**: 快速登记销售出库和采购入库
- **财务看板**: 盈利概览、多币种收益统计
- **数据同步**: 云开发支持，数据实时同步

## 技术栈

### 小程序端
- Taro 4 + React 18 + TypeScript
- 微信云开发（云函数 + 云数据库）
- Sass

### Web端
- React 19 + TypeScript
- Vite 6
- Recharts

## 快速开始

### 1. 安装依赖

```bash
# 安装小程序端依赖
cd taro-app
npm install

# 安装Web端依赖（可选）
cd ../
npm install
```

### 2. 配置云开发环境

1. 在微信开发者工具中打开 `taro-app/dist` 目录
2. 开通云开发，创建环境
3. 修改 `taro-app/src/app.ts` 中的环境ID

```typescript
Taro.cloud.init({
  env: 'your-env-id', // 替换为您的云开发环境ID
  traceUser: true
})
```

### 3. 创建数据库集合

在云开发控制台创建以下集合：
- `inventory` - 库存商品
- `transactions` - 交易记录
- `costs` - 成本项

### 4. 上传云函数

在微信开发者工具中，右键点击 `cloud` 目录下的每个云函数，选择"上传并部署"。

### 5. 运行项目

```bash
# 开发模式 - 小程序
cd taro-app
npm run dev:weapp

# 开发模式 - H5/Web
npm run dev:h5
```

## 部署

### 小程序端
1. 执行 `npm run build:weapp`
2. 在微信开发者工具中上传代码
3. 在微信公众平台提交审核

### Web端（H5）
1. 执行 `npm run build:h5`
2. 将 `dist` 目录部署到云开发静态托管

## 数据库结构

### inventory 集合
```json
{
  "_id": "自动生成",
  "modelNumber": "ES-2024-001",
  "category": "耳饰",
  "specification": "耳针",
  "color": "银色",
  "quantity": 45,
  "warehouse": "SOHO",
  "costPrice": 12.00,
  "onlinePrice": 29.90,
  "offlinePrice": 35.00,
  "image": "https://...",
  "priceLogs": [],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### transactions 集合
```json
{
  "_id": "自动生成",
  "itemId": "商品ID",
  "type": "outbound",
  "method": "Shopee 新加坡",
  "quantity": 1,
  "amount": 29.90,
  "finalAmount": 29.90,
  "currency": "SGD",
  "date": "2024-03-16T10:15:00Z"
}
```

### costs 集合
```json
{
  "_id": "自动生成",
  "name": "设备",
  "value": 1200,
  "category": "equipment",
  "date": "2024-01-01T00:00:00Z"
}
```
