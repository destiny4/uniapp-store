import Fly from 'flyio/dist/npm/wx'
// TODO:lijia--hideLoading
// import app from '../main'

var fly = new Fly()

// let myTimer = null
// let timerCount = 0
removeInfo()
// 添加请求拦截器
fly.interceptors.request.use(function (request) {
  if (request.url !== '/api/user/info') {
    // TODO:lijia--hideLoading   getUserInfo获取用户信息：参数（地区和语言）
    // timerCount++
    // if (timerCount === 1) {
    //   myTimer = setTimeout(() => {
    //     uni.showLoading({
    //       title: app.locale.loading,
    //       mask: true
    //     })
    //   }, 1000)
    // }
  }
  request.headers['X-Tag'] = 'flyio'
  request.baseURL = ''
 
  // #ifndef H5
  const info = getInfo()
  if (!info) {
    this.lock()
    return wxlogin()
      .then(resinfo => {
        return formatBody(resinfo, request.url, request.body).then(res => {
          request._url = request.url
          request.url = res
          return request
        })
      })
      .then(req => {
        this.unlock() // 解锁后，会继续发起请求队列中的任务，详情见后面文档
        return req
      })
  } else {
    return formatBody(info, request.url, request.body).then(res => {
      request._url = request.url
      request.url = res
      return request
    })
  }
  // #endif
})

// 添加响应拦截器，响应拦截器会在then/catch处理之前执行
fly.interceptors.response.use(
  function (res) {
    // if (timerCount > 0) {
    //   timerCount--
    //   if (timerCount === 0) {
    //     clearTimeout(myTimer)
    //     uni.hideLoading()
    //   }
    // }
    // if (res.data.code === 400) {
    //   removeInfo()
    //   let url = res.request.url
    //   let index = url.lastIndexOf('?')
    //   url = url.substring(0, index)
    //   let backOff = new Promise(function (resolve) {
    //     setTimeout(function () {
    //       resolve()
    //     }, 1)
    //   })
    //   return backOff.then(() => {
    //     return fly.post(url, res.request.body)
    //   })
    // }

    // 只将请求结果的data字段返回
    if (res) return res
    uni.hideLoading()
    return Promise.reject(res)
  },
  function (err) {
    uni.hideLoading()
    // if (timerCount > 0) {
    //   timerCount--
    //   if (timerCount === 0) {
    //     clearTimeout(myTimer)
    //     uni.hideLoading()
    //   }
    // }
    return Promise.reject(err)
  }
)

// 取180秒不重复随机数
const getNonce = () => {
  return (Math.random() / +new Date())
    .toString(36)
    .replace(/\d/g, '')
    .slice(1)
}

function authLogin(code,resolve,reject){
	uni.request({
	  url: CONFIG.BASE_URL + '/minipro_token',
	  data: {
	    appid: encodeURIComponent(CONFIG.APP_ID),
	    code: encodeURIComponent(code),
	    timestamp:
	      Math.floor(new Date().getTime() / 1000) +
	      store.state.timeDifference
	  },
	  success (res) {
	    if (res.statusCode === 200 && res.data.code === 0) {
	      saveInfo(res.data.data)
	      saveUserid(res.data.data.userid)
	      resolve(res.data.data)
	    } else {
	      removeInfo()
	      reject(res.data)
	    }
	    resolve(res.data.data)
	  },
	  fail (error) {
	    removeInfo()
	    reject(error)
	  }
	})
}

// 小程序登录
function wxlogin () {
  return new Promise(function (resolve, reject) {
	let loginInfo=uni.getStorageSync('loginInfo')
	if(loginInfo){
		authLogin(JSON.parse(loginInfo).code,resolve,reject)
	}else{
		uni.login({
		  success (res) {
			console.log('wxcode',res)
		    authLogin(res.code,resolve,reject)
		  },
		  fail (error) {
		    reject(error)
		  }
		})
	}
  })
}

// 格式化参数
const formatBody = (info, api, request) => {
  return new Promise(function (resolve, reject) {
    let requestConfig = {
      nonce: getNonce(),
      timestamp:
        Math.floor(new Date().getTime() / 1000) + store.state.timeDifference,
      userid: encodeURIComponent(info.userid)
    }
    let configUrl = sortArg(requestConfig)
    let requestUrl = request ? JSON.stringify(request) : ''
    let CryptoJS = require('crypto-js')
    let url = api + '?' + configUrl + requestUrl
    let hash = CryptoJS.HmacSHA1(url, info.token)
    let sign64 = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash))
    let requestBody = api + '?' + configUrl + '&sign=' + sign64
    resolve(requestBody)
  })
}

// 对参数进行排序，json格式
const sortArg = args => {
  let keys = Object.keys(args)
  keys = keys.sort()
  let newArgs = {}
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key]
  })

  let string = ''
  for (let k in newArgs) {
    string += '&' + k + '=' + newArgs[k]
  }
  string = string.substr(1)
  return string
}

// 保存token信息
const saveInfo = res => {
  uni.setStorage({
    key: 'info',
    data: JSON.stringify(res)
  })
}

// 清除token信息
function removeInfo () {
  try {
    uni.removeStorage({
      key: 'info'
    })
  } catch (err) {
    console.error('err', err)
  }
}

// 保存userid
function saveUserid (res) {
  uni.setStorage({
    key: 'userid',
    data: JSON.stringify(res)
  })
}

// 获取token信息
const getInfo = () => {
  try {
    const value = uni.getStorageSync('info')
    return JSON.parse(value)
  } catch (e) {
    return ''
  }
}

export default fly
