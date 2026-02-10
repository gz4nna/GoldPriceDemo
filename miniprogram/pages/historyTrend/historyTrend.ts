// pages/historyTrend/historyTrend.ts
import { request } from '../../utils/request';
import { GoldPrice } from '../../models/gold_price';

Component({
  data:{
    range: '7d' as string,
    records: null as string | null,
    recordOptions: ['所有', '10', '20', '50'],
    canvasWidth: 375 as number,
    chartScrollLeft: 0,
    history: [] as GoldPrice[]
  },
  pageLifetimes:{
    show(){
      // 页面显示时刷新数据
      this.fetchHistory();
    }
  },
  methods:{
    async fetchHistory() {
      const days = this.data.range === '7d' ? 7 : (this.data.range === '30d' ? 30 : 90);
      let url = `/api/GoldPrice/history?days=${days}`;
      if (this.data.records) url += `&records=${this.data.records}`;
      
      const res = await request<GoldPrice[]>(url);
      
      const sysInfo = wx.getSystemInfoSync();
      const pointGap = 50; // 每个点的像素间距
      const calculatedWidth = Math.max(sysInfo.windowWidth, res.length * pointGap);
      
      this.setData({ 
        history: res,
        canvasWidth: calculatedWidth
      }, () => {
        console.debug('数据加载成功');
        // 增加延时
        const timer = setTimeout(() => {
          this.drawTrendChart(res, calculatedWidth);
          // 滚动到最右侧
          this.setData({ chartScrollLeft: calculatedWidth * 2});
          clearTimeout(timer);
        }, 300); 
      });
    },
    async drawTrendChart(history: GoldPrice[], calculatedWidth: number) {
      const query = wx.createSelectorQuery().in(this);
      query.select('#trendChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = Math.max(res[0].width, calculatedWidth);
          const height = res[0].height || 250;
    
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = width * dpr ;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
    
          const prices = [...history].reverse().map(item => item.basePrice);
          if (prices.length === 0) return;
    
          // 这里不留空，放下面加范围时候处理
          const maxPrice = Math.max(...prices);
          const minPrice = Math.min(...prices);
          let range = maxPrice - minPrice;
          
          // 价格完全一样时手动增加范围
          const displayMin = range === 0 ? minPrice - 5 : minPrice - (range * 0.05);
          const displayMax = range === 0 ? maxPrice + 5 : maxPrice + (range * 0.5);
          const displayRange = displayMax - displayMin;
    
          // 左右留白
          const margin = 50; 
          const drawWidth = width - (margin * 2);
    
          // 坐标计算
          const points = prices.map((p, i) => {
            // 防止单点数据时除以 0
            const xPercent = prices.length > 1 ? (i / (prices.length - 1)) : 0.5;
            return {
              x: margin + xPercent * drawWidth,
              y: height - ((p - displayMin) / displayRange) * height
            };
          });
    
          // 阴影填充
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
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
    
          // 高亮
          const maxY = Math.min(...points.map(p => p.y));
          const minY = Math.max(...points.map(p => p.y));
          
          points.forEach((point, index) => {
            const isLast = index === points.length - 1;
            const isMax = point.y === maxY;
            const isMin = point.y === minY;
    
            if (isLast || isMax || isMin) {
              ctx.beginPath();
              const radius = isLast ? 4 : 2.5;
              ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
              ctx.fillStyle = isLast ? '#D4AF37' : 'rgba(212, 175, 55, 0.8)';
              ctx.fill();
    
              if (isLast) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }
          });
        });
    },
    changeRange(e: any) {
      this.setData({ range: e.currentTarget.dataset.val }, () => this.fetchHistory());
    },
    changeRecords(e: any) {
      const val = this.data.recordOptions[e.detail.value];
      this.setData({ records: val === '所有' ? null : val }, () => this.fetchHistory());
    }
  }
})