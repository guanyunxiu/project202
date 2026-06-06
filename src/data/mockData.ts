import type { DataField, MockDataItem } from '@/types'

export const mockDataFields: DataField[] = [
  { id: '1', name: '订单编号', fieldName: 'orderNo', type: 'string' },
  { id: '2', name: '客户名称', fieldName: 'customerName', type: 'string' },
  { id: '3', name: '产品名称', fieldName: 'productName', type: 'string' },
  { id: '4', name: '数量', fieldName: 'quantity', type: 'number' },
  { id: '5', name: '单价', fieldName: 'unitPrice', type: 'number' },
  { id: '6', name: '金额', fieldName: 'amount', type: 'number' },
  { id: '7', name: '订单日期', fieldName: 'orderDate', type: 'date' },
  { id: '8', name: '状态', fieldName: 'status', type: 'string' },
  { id: '9', name: '是否支付', fieldName: 'isPaid', type: 'boolean' },
  { id: '10', name: '业务员', fieldName: 'salesman', type: 'string' },
  { id: '11', name: '区域', fieldName: 'region', type: 'string' },
  { id: '12', name: '折扣率', fieldName: 'discount', type: 'number' }
]

export const mockTableData: MockDataItem[] = [
  { orderNo: 'ORD20240001', customerName: '北京科技有限公司', productName: '笔记本电脑', quantity: 10, unitPrice: 5999, amount: 59990, orderDate: '2024-01-15', status: '已完成', isPaid: true, salesman: '张三', region: '华北', discount: 0.95 },
  { orderNo: 'ORD20240002', customerName: '上海贸易集团', productName: '显示器', quantity: 20, unitPrice: 1299, amount: 25980, orderDate: '2024-01-16', status: '处理中', isPaid: false, salesman: '李四', region: '华东', discount: 0.9 },
  { orderNo: 'ORD20240003', customerName: '广州电子科技', productName: '键盘', quantity: 50, unitPrice: 299, amount: 14950, orderDate: '2024-01-17', status: '已完成', isPaid: true, salesman: '王五', region: '华南', discount: 0.88 },
  { orderNo: 'ORD20240004', customerName: '深圳网络公司', productName: '鼠标', quantity: 30, unitPrice: 199, amount: 5970, orderDate: '2024-01-18', status: '已发货', isPaid: true, salesman: '赵六', region: '华南', discount: 0.92 },
  { orderNo: 'ORD20240005', customerName: '杭州互联网公司', productName: '笔记本电脑', quantity: 15, unitPrice: 6999, amount: 104985, orderDate: '2024-01-19', status: '已完成', isPaid: true, salesman: '张三', region: '华东', discount: 0.85 },
  { orderNo: 'ORD20240006', customerName: '成都软件开发', productName: '服务器', quantity: 5, unitPrice: 15999, amount: 79995, orderDate: '2024-01-20', status: '处理中', isPaid: false, salesman: '孙七', region: '西南', discount: 0.9 },
  { orderNo: 'ORD20240007', customerName: '武汉制造企业', productName: '显示器', quantity: 25, unitPrice: 1899, amount: 47475, orderDate: '2024-01-21', status: '已完成', isPaid: true, salesman: '李四', region: '华中', discount: 0.88 },
  { orderNo: 'ORD20240008', customerName: '西安教育机构', productName: '投影仪', quantity: 8, unitPrice: 3999, amount: 31992, orderDate: '2024-01-22', status: '已发货', isPaid: true, salesman: '周八', region: '西北', discount: 0.95 }
]
