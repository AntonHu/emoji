import Taro from "@tarojs/taro";

export default definePageConfig({
  navigationBarTitleText:
    Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? "" : "Emoji查找神器",
});
