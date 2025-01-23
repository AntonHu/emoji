// 防抖函数
export const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer); // 清除之前的定时器
    timer = setTimeout(() => {
      func.apply(this, args); // 延迟执行目标函数
    }, delay);
  };
};
