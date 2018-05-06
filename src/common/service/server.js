import fetch from 'node-fetch';

'use strict';
const { host, port, path, wx } = think.config('transpond');

export default class extends think.service.base {
  /**
   * init
   * @return {}         []
   */
  init(...args) {
    super.init(...args);
  }
  async getList(pageNo = 0, openid) {
    const par = {
      headers:  {
        'Authorization': openid,
      },
      url: `${host}:${port}${path}/list?pageNo=${pageNo}`,
      method: 'get',
      action: 'getList',
    }
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  isUserFollowed(openid){
    const par = {
      url: `${wx.host}/user/checkExists?openId=${openid}`,
      method: 'get',
      action: 'isUserFollowed'
    }
    think.log(par, `openid: ${openid}`);
    return this.send(par);
  }
  addProduct(data, openid) {
    const par = {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': openid,
      },
      url: `${host}:${port}${path}/publish`,
      method: 'post',
      action: 'addProduct',
    }
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  updateProduct(data, openid) {
    think.log(JSON.stringify(data), 'update product params:');
    const par = {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': openid,
      },
      url: `${host}:${port}${path}/update`,
      method: 'post',
      action: 'updateProduct',
    }
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  getDetail(id, openid) {
    const par = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': openid,
      },
      url: `${host}:${port}${path}/detail/${id}`,
      method: 'get',
      action: 'getDetail'
    };
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  getMyProducts(pageNo, openid) {
    const par = {
      headers:{
        'Content-Type': 'application/json',
        'Authorization': openid,
      },
      url: `${host}:${port}${path}/mylist?pageNo=${pageNo}`,
      method: 'get',
      action: 'getMyProducts',
    };
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  vote(id, openid) {
    const par = {
      body: `id=${id}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: openid,
      },
      url: `${host}:${port}${path}/vote`,
      method: 'post',
      action: 'vote',
    }
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  uploadEvent(eventInfo, openid){
    think.log(JSON.stringify(eventInfo), 'upload eventInfo');
    const par = {
      url: `${wx.host}/user/log?openId=${openid}&event=${encodeURIComponent(eventInfo.type)}&info=${encodeURIComponent(JSON.stringify(event.info))}`,
      method: 'get',
      action: 'uploadEvent',
    }
    think.log(par, `openid:${openid}`);
    return this.send(par);
  }
  getWxSignInfo(url) {
    const par = {
      url: `${wx.host}/wechart/sign?url=${url}`,
      method: 'get',
      action: 'getWxSignInfo',
    }
    think.log(par, `url:${url}`);
    return this.send(par);
  }
  uploadUserLocation(userLocationInfo, openid) {
      const  par  = {
         url: `${wx.host}/user/location?openId=${openid}&longitude=${userLocationInfo.longitude}&latitude=${userLocationInfo.latitude}&accuracy=${userLocationInfo.accuracy || ''}&speed=${userLocationInfo.speed || ''}`,
         method: 'post',
         action: 'uploadUserLocation'
      }
      think.log(par, `openid:${openid}`);
      return this.send(par);
  }
  getAuditList(pageNo = 1 , openid) {
    const par = {
      url: `${host}:${port}${path}/auditlist?pageNo=${pageNo}`,
      method: 'get',
      action: 'getAuditList',
      headers: {
        Authorization: openid,
      }
    }
    think.log(par, `openid:${openid}`);

    return this.send(par);
  }
  audit(id, openid, status){
    const auditPath = status == '1' ? '/audit/pass' : '/audit/unpass';
    const par = {
        url: `${host}:${port}${path}${auditPath}`,
        method: 'post',
        action: 'audit',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: openid,
        },
        body: `id=${id}`,
    }
    return this.send(par);
  }
  send({ body = null, headers = null, url, method, action }) {
    return fetch(url, {
      method: method,
      headers,
      body: body,
    }).then(response => {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      let ERROR_TIP;
      if (response.status == 405) {
        ERROR_TIP = '禁止查看';
      } else {
        ERROR_TIP = '网络错误，请稍后再试';
      }
      let error = new Error(ERROR_TIP);
      error.response = response;
      throw error;
    }).then(response => response.json()).then(res => {
      think.log(res, `${action} res`);
      return res;
    }).catch(e => {
      think.log(e, 'error');
      if(e.response && e.response.status == 403){
        throw new Error(e.response.status);
      } else {
        throw new Error('网络繁忙，请稍后再试');
      }
    });
  }
}