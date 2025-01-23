import Taro from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react"; // 引入 useCallback
import { View, Text, Input } from "@tarojs/components";
import { pinyin } from "pinyin-pro"; // 使用命名导入
import { debounce } from "@/utils"; // 引入防抖函数
import emojis from "./emojis.json"; // 引入 Emoji 数据
import "./index.scss";

// 拼音缓存
const pinyinCache = {};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("全部"); // 默认选中“全部”
  const [searchKeyword, setSearchKeyword] = useState(""); // 输入框的值
  const [displayEmojis, setDisplayEmojis] = useState([]); // 显示的 Emoji 列表
  const [theme, setTheme] = useState("dark"); // 默认主题为深色模式
  const [isLoading, setIsLoading] = useState(true); // 加载状态

  // 初始化主题
  useEffect(() => {
    const savedTheme = Taro.getStorageSync("theme") || "dark";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    Taro.setStorageSync("theme", newTheme); // 保存主题设置
    document.body.setAttribute("data-theme", newTheme);
  };

  // 处理分类点击
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchKeyword(""); // 清空搜索框
  };

  // 实时更新输入框的值
  const handleSearchInput = (e) => {
    const keyword = e.detail.value;
    setSearchKeyword(keyword); // 实时更新输入框的值
  };

  // 防抖后的搜索逻辑
  const performSearch = useCallback(
    debounce((keyword) => {
      let emojiList = [];

      if (selectedCategory === "全部") {
        // 如果是“全部”分类，合并所有 Emoji
        emojiList = Object.values(emojis).flat();
      } else {
        // 否则显示当前分类的 Emoji
        emojiList = emojis[selectedCategory];
      }

      if (keyword) {
        // 搜索模式下，过滤匹配的 Emoji
        const filteredEmojis = emojiList.filter((item) => {
          // 匹配中文关键字
          const matchChinese = item.keywords.some((kw) => kw.includes(keyword));

          // 匹配拼音（全拼和首字母）
          const matchPinyin = item.keywords.some((kw) => {
            const { fullPinyin, initials } = getPinyin(kw);
            return (
              fullPinyin.toLowerCase().includes(keyword.toLowerCase()) ||
              initials.toLowerCase().includes(keyword.toLowerCase())
            );
          });

          return matchChinese || matchPinyin;
        });

        setDisplayEmojis(filteredEmojis); // 更新显示的 Emoji 列表
      } else {
        // 非搜索模式下，显示当前分类的 Emoji
        setDisplayEmojis(emojiList);
      }

      setIsLoading(false); // 数据加载完成
    }, 300), // 延迟 300ms
    [selectedCategory]
  );

  // 监听 searchKeyword 的变化，触发防抖搜索
  useEffect(() => {
    setIsLoading(true); // 开始加载
    performSearch(searchKeyword);
  }, [searchKeyword, performSearch]);

  // 复制 Emoji 到剪贴板
  const handleCopyEmoji = (emoji) => {
    Taro.setClipboardData({
      data: emoji,
      success: () => {
        Taro.showToast({ title: "已复制", icon: "success" });
      },
      fail: () => {
        Taro.showToast({ title: "复制失败", icon: "none" });
      },
    });
  };

  // 将中文关键字转换为拼音（全拼和首字母），并缓存结果
  const getPinyin = (keyword) => {
    if (pinyinCache[keyword]) {
      // 如果缓存中存在，直接返回
      return pinyinCache[keyword];
    }

    // 计算全拼和首字母
    const fullPinyin = pinyin(keyword, {
      toneType: "none",
      type: "array",
    }).join(""); // 不带声调，返回字符串
    const initials = pinyin(keyword, { pattern: "first", type: "array" }).join(
      ""
    ); // 只取首字母，返回字符串

    // 存储到缓存中
    pinyinCache[keyword] = { fullPinyin, initials };

    return { fullPinyin, initials };
  };

  return (
    <View className="container">
      <View className="header">
        <View className="title">Anton Emoji Finder</View>
        <View className="subtitle">快速查找 Emoji，点击即可复制</View>
      </View>
      <View className="search-box">
        <Input
          className="search-input"
          placeholder="搜索 Emoji（支持中文、拼音或首字母）"
          value={searchKeyword}
          onInput={handleSearchInput}
        />
      </View>
      <View className="content">
        {/* 分类列表 */}
        <View className="category-list">
          <Text className="category-title">分类</Text>
          <View className="categories">
            {/* 添加“全部”分类 */}
            <View
              key="全部"
              className={`category-item ${
                selectedCategory === "全部" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("全部")}
            >
              <Text>全部</Text>
            </View>
            {/* 其他分类 */}
            {Object.keys(emojis).map((category) => (
              <View
                key={category}
                className={`category-item ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                <Text>{category}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Emoji 列表 */}
        <View className="emoji-list">
          <Text className="emoji-title">
            {searchKeyword ? "搜索结果" : selectedCategory}
          </Text>
          <View className="emojis">
            {isLoading ? (
              <View className="loading">
                <View className="dot" />
                <View className="dot" />
                <View className="dot" />
              </View>
            ) : (
              displayEmojis.map((item, index) => (
                <View key={index} className="emoji-item">
                  <Text
                    className="emoji"
                    onClick={() => handleCopyEmoji(item.emoji)}
                  >
                    {item.emoji}
                  </Text>
                  <Text className="emoji-keywords">
                    {item.keywords.join(", ")} {/* 显示 keywords */}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      {/* 悬浮按钮 */}
      <View className="theme-toggle" onClick={toggleTheme}>
        🌓
      </View>
    </View>
  );
};

export default Index;
