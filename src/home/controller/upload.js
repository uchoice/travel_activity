'use strict'

export default class extends think.controller.base {
    indexAction() {
        console.log(this.post());
        this.success('success');
    }
}
