// index.ts
import { request } from '../../utils/request';
import { GoldPrice } from '../../models/gold_price';

// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

// 使用组件化页面
Component({
  data: {
    latestPrice: null as GoldPrice | null,
    history: [] as GoldPrice[],
    loading: true
  },  
  // 页面生命周期声明
  pageLifetimes:{
    show(){
      // 页面显示时刷新数据
      this.fetchData();
    }
  },
  methods: {    
    // 事件处理函数
    async fetchData() {
      try {
        this.setData({ loading: true });
        const latest = await request<GoldPrice>('/api/GoldPrice/latest');
        const history = await request<GoldPrice[]>('/api/GoldPrice/history?days=7');
        
        this.setData({
          latestPrice: latest,
          history: history,
          loading: false
        });
        console.debug('数据加载成功');
      } catch (err) {
        console.error('数据加载失败', err);
        this.setData({ loading: false });
      }
    },
    onAdminAccess() {
      wx.showModal({
        title: '服务器设置',
        editable: true,
        placeholderText: '请输入新的 BaseURL',
        success: (res) => {
          if (res.confirm && res.content) {
            wx.setStorageSync('baseUrl', res.content);
            wx.showToast({ title: '配置已更新' });
            this.fetchData(); // 重新加载
          }
        }
      });
    }
  },
  
})
