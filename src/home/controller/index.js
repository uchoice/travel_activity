'use strict';

import Base from './base.js';
import fs from 'fs';
import path from 'path';

function base64ToImg(base64Url, openid) {
  var base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
  var dataBuffer = new Buffer(base64Data, 'base64');
  const uploadpath = /* '/static/img/upload' */think.config('uploadPath');
  var imageName = `${(new Date()).getTime()}.png`;
  /* think.log(`${uploadpath}/${openid}/${imageName}`, `write img use path`) */
  return new Promise((resolve, reject) => {
    fs.mkdir(`/${uploadpath}/${openid}`, function(err){
      fs.writeFile(`/${uploadpath}/${openid}/${imageName}`, dataBuffer, function(err) {
          if(err){
            reject(err);
          }else{
            resolve(`/statics/img/${openid}/${imageName}`);
          }
      });
    });
  });
}

export default class extends Base {
  async __before() {
    const openid = this.get('openid');
    think.log(openid, 'get openid in before');
    openid && await this.session('openid', openid);
  }
  async indexAction() {
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    try {
      const data = await server.getList(0, openid);
      for(let i = 0, length1 = data.data.length; i < length1 ; i ++) {
        data.data[i].firstImg = '/static/img/download-error.png';
        for(let j = 0, length2 = data.data[i].content.length; j < length2; j++){
            if(data.data[i].content[j].pic != '') {
              data.data[i].firstImg = data.data[i].content[j].pic;
              break;
            }
        }
      }
      think.log(data, 'data');
      this.assign('data', data);
    } catch (e) {

    }
    const getOpenid = this.get('openid');
    if(getOpenid) {
      return this.redirect('/home/index');
    }
    return this.display();
  }
  prizeAction() {
    return this.display();
  }
  ruleAction() {
    return this.display();
  }
  async uploadproductAction() {
    const id = this.get('id');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const isfollowed = await server.isUserFollowed(openid);
    if(isfollowed) {
      if (id) {
        try {
          const detailInfo = await server.getDetail(id, openid);
          think.log(detailInfo, 'detailInfo');
          this.assign('detailInfo', detailInfo);
          this.assign('openid', openid);
          this.assign('modify', 'true');
        } catch (e) {
          think.log(e);
        }
      }
    } else {
      this.assign('notfollow', true);
    }
    return this.display();
  }
  //上传图片
  async uploadimgAction() {
    const openid = await this.session('openid');
    const imgbase64Url = this.post('imgUrl');
    base64ToImg(imgbase64Url, openid).then((imgUrl) => {
      return this.success(imgUrl);
    }).catch((e) => {
      think.log(e, 'upload error');
      this.fail();
    })
  }
  //添加作品
  async addorupdateproductAction() {
    let contentArr = [];
    const data = this.post('param');
    let { content, ...oth } = JSON.parse(data);
    for (let prop in content) {
      contentArr.push(content[prop]);
    }
    let refactData = {
      ...oth,
      content: contentArr,
    }
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    if (oth.id) {
      await server.updateProduct(refactData, openid);
    } else {
      await server.addProduct(refactData, openid);
    }
    return this.success();
  }
  //分页加载
  async loadmoreAction() {
    const pageNo = this.post('pageNo');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const data = await server.getList(pageNo, openid);
    for(let i = 0, length1 = data.data.length; i < length1 ; i ++) {
      data.data[i].firstImg = '/static/img/download-error.png';
      for(let j = 0, length2 = data.data[i].content.length; j < length2; j++){
          if(data.data[i].content[j].pic != '') {
            data.data[i].firstImg = data.data[i].content[j].pic;
            break;
          }
      }
    }
    return this.json(data);
  }
  //详情
  async detailAction() {
    const id = this.get('id');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    try {
      const detailInfo = await server.getDetail(id, openid);
      think.log(detailInfo, 'detailInfo');
      this.assign('detailInfo', detailInfo);
      this.assign('openid', openid);
      if (openid == detailInfo.article.author) {
        this.assign('canModify', true);
      }
    } catch (e) {
      think.log(e);
    }
    return this.display();
  }
  //投票
  async voteAction() {
    const id = this.post('id');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const isfollow = await server.isUserFollowed(openid);
    let res;
    console.log('isfollow', isfollow);
    if (isfollow) {
      try{
        res = await server.vote(id, openid);
      } catch(e){
        this.fail(+e.message, '已投票');
      }
      this.success(res);
    } else {
      this.fail(1002 ,'请先关注公众号后再投票');
    }
  }
  async myproductsAction() {
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    let res = await server.getMyProducts(1, openid);
    for(let i = 0, length1 = res.data.length; i < length1 ; i ++) {
      res.data[i].firstImg = '/static/img/download-error.png';
      for(let j = 0, length2 = res.data[i].content.length; j < length2; j++){
          if(res.data[i].content[j].pic != '') {
            res.data[i].firstImg = res.data[i].content[j].pic;
            break;
          }
      }
    }
    this.assign('myList', res);
    this.display();
  }
  async loadmoremyproductsAction() {
    const pageNo = this.post('pageNo');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const res = await server.getMyProducts(pageNo, openid);
    for(let i = 0, length1 = res.data.length; i < length1 ; i ++) {
      res.data[i].firstImg = '/static/img/download-error.png';
      for(let j = 0, length2 = res.data[i].content.length; j < length2; j++){
          if(res.data[i].content[j].pic != '') {
            res.data[i].firstImg = res.data[i].content[j].pic;
            break;
          }
      }
    }
    this.json(res);
  }
  //是否关注过公众号
  async isfollowAction(){
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const res = await server.isUserFollowed(openid);
    this.json(res);
  }
  //获取微信签名信息
  async getsignatureAction(){
    const url = this.get('url');
    const server = new (think.service('server'))();
    const res = await server.getWxSignInfo(url);
    this.json(res);
  }
  async uploaduserlocationAction(){
    console.log('uploaduserlocation');
    const openid = await this.session('openid');
    const userLocationInfo = JSON.parse(this.post('userlocation'));
    const server = new (think.service('server'))();
    server.uploadUserLocation(userLocationInfo, openid);
    return this.success();
  }
  async uploadeventAction(){
    const openid = await this.session('openid');
    const eventInfo = this.post('eventInfo');
    const server = new (think.service('server'))();
    server.uploadEvent(eventInfo,openid);
    return this.success();
  }
  async auditlistAction() {
    const openid = this.get('openid');
    await this.session('openid', openid);
    const server = new (think.service('server'))();
    const auditList  = await server.getAuditList(1,openid);
    for(let i = 0, length1 = auditList.data.length; i < length1 ; i ++) {
      auditList.data[i].firstImg = '/static/img/download-error.png';
      for(let j = 0, length2 = auditList.data[i].content.length; j < length2; j++){
          if(auditList.data[i].content[j].pic != '') {
            auditList.data[i].firstImg = auditList.data[i].content[j].pic;
            break;
          }
      }
    }
    this.assign('auditList', auditList);
    this.display();
  }
  async loadmorealistAction() {
    const pageNo = this.post('pageNo');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const data  = await server.getAuditList(pageNo, openid);
    for(let i = 0, length1 = data.data.length; i < length1 ; i ++) {
      data.data[i].firstImg = '/static/img/download-error.png';
      for(let j = 0, length2 = data.data[i].content.length; j < length2; j++){
          if(data.data[i].content[j].pic != '') {
            data.data[i].firstImg = data.data[i].content[j].pic;
            break;
          }
      }
    }
    this.json(data);
  }
  async auditinfoAction() {
     const id = this.get('id');
     const openid = await this.session('openid');
     const server = new (think.service('server'))();
     const auditInfo = await server.getDetail(id, openid);
     this.assign('openid', openid);
     this.assign('auditInfo', auditInfo);
     this.display();
  }
  async auditAction() {
     const auditInfo = this.post();
     const openid = await this.session('openid');
     const server = new (think.service('server'))();
     const res = await server.audit(auditInfo.id, openid, auditInfo.status);
     this.json(res);
  }
 }