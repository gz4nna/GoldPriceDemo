// index.ts
import { request } from '../../utils/request';
import { GoldPrice } from '../../models/gold_price';

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
        },() => {
          // 使用 setTimeout 避开渲染层同步锁
          setTimeout(() => {
            this.drawTrendChart(history);
          }, 100); 
        });
        console.debug('数据加载成功');
      } catch (err) {
        console.error('数据加载失败', err);
        this.setData({ loading: false });
      }
    },
    // index.ts 内部方法
    async drawTrendChart(history: GoldPrice[]) {
      // 严谨校验：如果数据不足，直接清空画布或返回，不执行后续逻辑
      if (!history || history.length < 2) {
        console.warn('历史数据不足，无法绘制趋势图');
        return;
      }

      const query = wx.createSelectorQuery().in(this);
      query.select('#trendChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = res[0].width;
          const height = res[0].height;

          // 处理高清屏缩放
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 取 basePrice 作为数据源
          const prices = [...history].reverse().map(item => item.basePrice);
          // 上下留空
          const maxPrice = Math.max(...prices) * 1.01;
          const minPrice = Math.min(...prices) * 0.99;
          const range = maxPrice - minPrice;

          // 绘图坐标计算
          const points = prices.map((p, i) => ({
            x: (i / (prices.length - 1)) * width,
            y: height - ((p - minPrice) / range) * height
          }));

          // 阴影渐变
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
          gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

          ctx.beginPath();
          ctx.moveTo(points[0].x, height);
          points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.lineTo(points[points.length - 1].x, height);
          ctx.fillStyle = gradient;
          ctx.fill();

          // 金色主线
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#D4AF37';
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();

          const maxY = Math.min(...points.map(p => p.y));
          const minY = Math.max(...points.map(p => p.y));
          
          points.forEach((point, index) => {
            // 如果不是最高、最低或最后一点，就跳过不画圆圈
            if (point.y !== maxY && point.y !== minY && index !== points.length - 1) {
              return; 
            }
            ctx.beginPath();
            const radius = (index === points.length - 1) ? 4 : 2;
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            
            ctx.fillStyle = (index === points.length - 1) ? '#D4AF37' : 'rgba(212, 175, 55, 0.5)';
            ctx.fill();

            if (index === points.length - 1) {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        });
    }
  },
  
})
