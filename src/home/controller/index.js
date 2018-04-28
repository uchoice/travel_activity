'use strict';

import Base from './base.js';
import fs from 'fs';
import path from 'path';

function base64ToImg(base64Url, openid) {
  var base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
  var dataBuffer = new Buffer(base64Data, 'base64');
  const uploadpath = '/static/img/upload';
  var imageName = `${openid}-${(new Date()).getTime()}.png`;
  think.log(imageName, `write img use path`)
  return new Promise((resolve, reject) => {
    fs.writeFile(`${think.RESOURCE_PATH}/${uploadpath}/${imageName}`, dataBuffer, function(err) {
        if(err){
          reject(err);
        }else{
          resolve(`${uploadpath}/${imageName}`);
        }
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
    if (id) {
      try {
        const openid = await this.session('openid');
        const server = new (think.service('server'))();
        const detailInfo = await server.getDetail(id, openid);
        think.log(detailInfo, 'detailInfo');
        this.assign('detailInfo', detailInfo);
        this.assign('openid', openid);
        this.assign('modify', 'true');
      } catch (e) {
        think.log(e);
      }
    }
    return this.display();
  }
  //上传图片
  async uploadimgAction() {
   /*  const files = this.file();
    const imgPath = files.file.path;//为防止上传的时候因文件名重复而覆盖同名已上传文件，path是MD5方式产生的随机名称
    const imgName = imgPath.split(path.sep).pop();
    const uploadpath = think.RESOURCE_PATH + '/static/img/upload';
    think.mkdir(uploadpath);//创建该目录

    const writePath = uploadpath + '/' + imgName;//因为本系统不允许上传同名主题，所以文件名就直接使用主题名
    //将上传的文件（路径为filepath的文件）移动到第二个参数所在的路径，并改为第二个参数的文件名。
    fs.renameSync(imgPath, writePath);

    return this.success('/static/img/upload/' + imgName); */
    const openid = await this.session('openid');
    const imgbase64Url = this.post('imgUrl');
    /* console.log('imgbase64Url', imgbase64Url); */ 
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
    const data = this.post();
    let { content, ...oth } = data;
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
        
      }
      this.success(res);
    } else {
      this.fail(1002 ,'请先关注公众号后再投票');
    }
  }
  async myproductsAction() {
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const res = await server.getMyProducts(1, openid);
    this.assign('myList', res);
    this.display();
  }
  async loadmoremyproductsAction() {
    const pageNo = this.post('pageNo');
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const res = await server.getMyProducts(pageNo, openid);
    this.json(res);
  }
  //是否关注过公众号
  async isfollowAction(){
    const openid = await this.session('openid');
    const server = new (think.service('server'))();
    const res = await server.isUserFollowed(openid);
    this.json(false);
  }
  //获取微信签名信息
  async getsignatureAction(){
    const url = this.get('url');
    const server = new (think.service('server'))();
    const res = await server.getWxSignInfo(url);
    this.json(res);
  }

  async uploadeventAction(){
    const openid = await this.session('openid');
    const eventInfo = this.post('eventInfo');
    const server = new (think.service('server'))();
    const res = await server.uploadEvent(eventInfo,openid);
  }
 }