/**
 * 基于element-ui table合并列方法
 * @param {Array:Object} list
 */
export default class Mergercol {
  constructor(list) {
    this.list = list
  }
  /**
   * 组合可用companyMergeList
   * @param {String} args 可选的合并参数列(companyName, companyNo)
   */
  packMergeList(args) {
    let beforeComNa
    let comNum = 1
    let packObj
    let packList = []
    let overObj = false
    this.list.map(obj => {
      switch (args) {
        case 'companyName':
          if (beforeComNa !== obj.companyName) {
            if (overObj) {
              packObj = { name: beforeComNa, num: comNum }
              packList.push(packObj)
              comNum = 1
            }
            beforeComNa = obj.companyName
            overObj = true
          } else {
            comNum++
            packObj = { name: obj.companyName, num: comNum }
          }
          break
        case 'companyNo':
          if (beforeComNa !== obj.companyNo) {
            if (overObj) {
              packObj = { name: beforeComNa, num: comNum }
              packList.push(packObj)
              comNum = 1
            }
            beforeComNa = obj.companyNo
            overObj = true
          } else {
            comNum++
            packObj = { name: obj.companyNo, num: comNum }
          }
          break
        default:
          if (beforeComNa !== obj.companyName) {
            if (overObj) {
              packObj = { name: beforeComNa, num: comNum }
              packList.push(packObj)
              comNum = 1
            }
            beforeComNa = obj.companyName
            overObj = true
          } else {
            comNum++
            packObj = { name: obj.companyName, num: comNum }
          }
          break
      }
    })
    packList.push(packObj)
    // console.log('packList', packList)
    return packList
  }
}
