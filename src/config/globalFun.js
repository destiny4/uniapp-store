function getDistance(latitude1, longitude1, latitude2, longitude2) {
  latitude1 = latitude1 || 0;
  longitude1 = longitude1 || 0;
  latitude2 = latitude2 || 0;
  longitude2 = longitude2 || 0;
  var rad1 = (latitude1 * Math.PI) / 180.0;
  var rad2 = (latitude2 * Math.PI) / 180.0;
  var a = rad1 - rad2;
  var b = (longitude1 * Math.PI) / 180.0 - (longitude2 * Math.PI) / 180.0;
  var r = 6378137;
  return (
    r *
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(rad1) * Math.cos(rad2) * Math.pow(Math.sin(b / 2), 2)
      )
    )
  );
}
function authH5() {
  let tenantid = uni.getStorageSync("tenantid");
  let wxcode = uni.getStorageSync("wxcode");
  return new Promise(function(resolve, reject) {
    uni.request({
      method: "POST",
      url: "/auth",
      data: {
        tenantid: tenantid,
        auth_code: wxcode,
      },
      success(res) {
        resolve(res);
      },
      fail(error) {
        reject(error);
      },
    });
  });
}
export {
    getDistance,
    authH5
}