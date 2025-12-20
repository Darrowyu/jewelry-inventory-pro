export default {
  pages: [
    'pages/index/index',
    'pages/records/index',
    'pages/finance/index',
    'pages/product/index',
    'pages/add-product/index',
    'pages/add-transaction/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '库存管家',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#D1D5DB',
    selectedColor: '#EC4899',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '库存'
      },
      {
        pagePath: 'pages/records/index',
        text: '明细'
      },
      {
        pagePath: 'pages/finance/index',
        text: '财务'
      }
    ]
  },
  cloud: true
}
