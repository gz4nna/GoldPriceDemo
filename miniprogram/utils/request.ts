// utils/request.ts
const DEFAULT_URL = 'https://api.gz4nna.com';

export const request = <T>(url: string, method: 'GET' | 'POST' = 'GET', data: any = {}): Promise<T> => {
  // 从缓存读取 URL，实现动态切换
  const baseUrl = wx.getStorageSync('baseUrl') || DEFAULT_URL;

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      header: {
        'X-Admin-Token': 'gz4nna_admin_token'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T);
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};